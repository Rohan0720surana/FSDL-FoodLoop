const Offer = require('../models/Offer');
const Listing = require('../models/Listing');
const Organisation = require('../models/Organisation');
const { refreshDailyCapacity } = require('../utils/capacity');
const { REPLY_MINUTES, offerToNextShelter, housekeeping } = require('../utils/cascade');
const { averageRatings } = require('../utils/ratings');

const handleError = (res, err) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid offer ID format.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// a random 4-digit code like "4827"
const makeHandoverCode = () => String(1000 + Math.floor(Math.random() * 9000));

// ── GET /api/offers/mine ───────────────────────────────────────────────────────
// Recipient only. The offers this shelter is being asked about right now,
// each with the time it has left to reply.
const getMyOffers = async (req, res) => {
  try {
    await housekeeping();
    const offers = await Offer.find({
      recipient: req.orgId,
      status: 'PENDING',
      active: true,
    })
      .sort({ score: -1 })
      .populate({
        path: 'listing',
        select: 'description foodType quantity pickupDeadline donor',
        populate: { path: 'donor', select: 'name locality address' },
      })
      .lean();

    // how other shelters rated each kitchen's food
    const donorIds = offers.filter((o) => o.listing && o.listing.donor).map((o) => o.listing.donor._id);
    const foodRatings = await averageRatings('ratingOfFood', 'donor', donorIds);

    offers.forEach((offer) => {
      const since = new Date(offer.activeSince || offer.createdAt).getTime();
      offer.replyBy = new Date(since + REPLY_MINUTES * 60 * 1000);
      if (offer.listing && offer.listing.donor) {
        offer.listing.donor.rating = foodRatings[offer.listing.donor._id.toString()] || null;
      }
    });

    res.status(200).json(offers);
  } catch (err) {
    handleError(res, err);
  }
};

// ── GET /api/offers/pickups ────────────────────────────────────────────────────
// Recipient only. Food this shelter accepted: where to collect it, who to call,
// and the handover code to show at the kitchen.
const getMyPickups = async (req, res) => {
  try {
    await housekeeping();
    const offers = await Offer.find({ recipient: req.orgId, status: 'ACCEPTED' })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate({
        path: 'listing',
        select: 'description foodType quantity pickupDeadline status acceptedAt collectedAt handoverCode donor ratingOfFood',
        populate: { path: 'donor', select: 'name locality address contactName phone lat lng' },
      })
      .lean();

    const pickups = offers
      .filter((o) => o.listing)
      .map((o) => ({
        offerId: o._id,
        score: o.score,
        km: o.km,
        driveMinutes: o.driveMinutes,
        listing: o.listing,
      }));

    res.status(200).json(pickups);
  } catch (err) {
    handleError(res, err);
  }
};

// ── POST /api/offers/:id/accept ────────────────────────────────────────────────
const acceptOffer = async (req, res) => {
  try {
    await housekeeping();
    const offer = await Offer.findById(req.params.id).populate('listing');
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }
    if (offer.recipient.toString() !== req.orgId) {
      return res.status(403).json({ message: 'Not authorised — this offer is not yours.' });
    }
    if (!offer.active || offer.status !== 'PENDING') {
      return res.status(400).json({ message: 'This offer is no longer waiting for you (it may have moved to another shelter).' });
    }
    if (new Date(offer.listing.pickupDeadline).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Pickup deadline has already passed.' });
    }

    // Check today's room before taking the food
    const shelter = await refreshDailyCapacity(await Organisation.findById(req.orgId));
    const quantity = offer.listing.quantity;
    if (!shelter || shelter.remainingCapacityToday < quantity) {
      return res.status(400).json({
        message: 'You only have room for ' + (shelter ? shelter.remainingCapacityToday : 0) +
          ' more meals today, but this offer is ' + quantity + ' meals. Pass it so the next shelter can take it.',
      });
    }

    // Take the room atomically so two accepts at once can never go below zero
    const updatedShelter = await Organisation.findOneAndUpdate(
      { _id: req.orgId, remainingCapacityToday: { $gte: quantity } },
      { $inc: { remainingCapacityToday: -quantity } },
      { new: true }
    );
    if (!updatedShelter) {
      return res.status(400).json({ message: 'Not enough room left today to accept this offer.' });
    }

    // Accept only if it is still the active offer (stops double clicks or a race with a lapse)
    const accepted = await Offer.findOneAndUpdate(
      { _id: offer._id, status: 'PENDING', active: true },
      { status: 'ACCEPTED', active: false },
      { new: true }
    );
    if (!accepted) {
      await Organisation.findByIdAndUpdate(req.orgId, { $inc: { remainingCapacityToday: quantity } });
      return res.status(400).json({ message: 'This offer is no longer waiting for you.' });
    }

    // Everyone else waiting for this food is told it has gone
    await Offer.updateMany(
      { listing: offer.listing._id, _id: { $ne: offer._id }, status: 'PENDING' },
      { status: 'EXPIRED', active: false }
    );

    const code = makeHandoverCode();
    await Listing.findByIdAndUpdate(offer.listing._id, {
      status: 'ACCEPTED',
      acceptedBy: req.orgId,
      acceptedAt: new Date(),
      handoverCode: code,
    });

    return res.status(200).json({
      message: 'Offer accepted. Show code ' + code + ' at the kitchen when you collect.',
      handoverCode: code,
      remainingCapacityToday: updatedShelter.remainingCapacityToday,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// ── POST /api/offers/:id/pass ──────────────────────────────────────────────────
const passOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }
    if (offer.recipient.toString() !== req.orgId) {
      return res.status(403).json({ message: 'Not authorised — this offer is not yours.' });
    }

    const passed = await Offer.findOneAndUpdate(
      { _id: offer._id, status: 'PENDING', active: true },
      { status: 'PASSED', active: false },
      { new: true }
    );
    if (!passed) {
      return res.status(400).json({ message: 'This offer is no longer waiting for you.' });
    }

    // Re-score the shelters still waiting with the time left now, and ask the best one
    const next = await offerToNextShelter(offer.listing);

    if (next) {
      return res.status(200).json({
        message: 'Offer passed. It has gone to ' + next.recipient.name + '.',
        nextRecipient: next.recipient.name,
      });
    }
    return res.status(200).json({
      message: 'Offer passed. No other shelter can collect it in time, so the listing has expired.',
    });
  } catch (err) {
    handleError(res, err);
  }
};

// ── POST /api/offers/pickups/:listingId/rate ──────────────────────────────────
// Recipient only. After collecting, rate the food: was it fresh and as described?
// Body: { stars: 1-5, comment }. Each pickup can be rated once.
const rateFood = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing || !listing.acceptedBy || listing.acceptedBy.toString() !== req.orgId) {
      return res.status(404).json({ message: 'Pickup not found.' });
    }
    if (listing.status !== 'COLLECTED') {
      return res.status(400).json({ message: 'You can rate the food after the kitchen confirms the pickup.' });
    }
    if (listing.ratingOfFood && listing.ratingOfFood.stars) {
      return res.status(400).json({ message: 'You have already rated this food.' });
    }
    const stars = Number(req.body && req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Choose 1 to 5 stars.' });
    }

    listing.ratingOfFood = { stars, comment: String((req.body && req.body.comment) || '').slice(0, 200), at: new Date() };
    await listing.save();
    res.status(200).json({ message: 'Thank you. Your rating helps other shelters.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid pickup ID format.' });
    }
    handleError(res, err);
  }
};

module.exports = { getMyOffers, getMyPickups, acceptOffer, passOffer, rateFood };
