const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Organisation = require('../models/Organisation');
const { matchScore } = require('../utils/matching');
const { refreshDailyCapacity } = require('../utils/capacity');
const { REPLY_MINUTES, housekeeping } = require('../utils/cascade');
const { averageRatings } = require('../utils/ratings');
const mongoose = require('mongoose');

// Minimum lead-time before pickup deadline (30 minutes in ms)
const MIN_DEADLINE_MS = 30 * 60 * 1000;
// Cooked food should not wait longer than this (12 hours in ms)
const MAX_DEADLINE_MS = 12 * 60 * 60 * 1000;

const FOOD_TYPES = ['VEG', 'NON_VEG', 'BAKERY', 'PACKAGED'];

/**
 * Checks the fields a donor may set. Returns an error message, or null if fine.
 * When `partial` is true (an update), missing fields are allowed.
 */
const validateListingFields = (body, partial) => {
  const { description, foodType, quantity, pickupDeadline } = body;

  if (!partial || description !== undefined) {
    if (!description || !String(description).trim()) return 'Enter what the food is.';
  }
  if (!partial || foodType !== undefined) {
    if (!FOOD_TYPES.includes(foodType)) return 'Choose a valid food type.';
  }
  if (!partial || quantity !== undefined) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) return 'Quantity must be a whole number of meals above 0.';
  }
  if (!partial || pickupDeadline !== undefined) {
    const deadline = new Date(pickupDeadline);
    if (isNaN(deadline.getTime())) return 'pickupDeadline must be a valid date.';
    const ahead = deadline.getTime() - Date.now();
    if (ahead < MIN_DEADLINE_MS) return 'The pickup deadline must be at least 30 minutes from now.';
    if (ahead > MAX_DEADLINE_MS) return 'Cooked food should be collected within 12 hours.';
  }
  return null;
};

// Loads a listing and checks the logged-in donor owns it.
// Sends the error response itself and returns null if not allowed.
const loadOwnListing = async (req, res, extraSelect) => {
  const query = Listing.findById(req.params.id);
  if (extraSelect) query.select(extraSelect);
  const listing = await query;
  if (!listing) {
    res.status(404).json({ message: 'Listing not found.' });
    return null;
  }
  if (listing.donor.toString() !== req.orgId) {
    res.status(403).json({ message: 'Not authorised — you do not own this listing.' });
    return null;
  }
  return listing;
};

const handleError = (res, err, what) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ' + what + ' ID format.' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// ── POST /api/listings ─────────────────────────────────────────────────────────
// Donor only. The donor is always the logged-in organisation, never taken from the body.
const createListing = async (req, res) => {
  try {
    const validationError = validateListingFields(req.body || {}, false);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = await Listing.create({
      donor: req.orgId,
      description: String(req.body.description).trim(),
      foodType: req.body.foodType,
      quantity: Number(req.body.quantity),
      pickupDeadline: new Date(req.body.pickupDeadline),
    });
    res.status(201).json(listing);
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── GET /api/listings/mine ─────────────────────────────────────────────────────
// Donor only. The donor's listings, newest first, with who accepted each one.
const getMyListings = async (req, res) => {
  try {
    await housekeeping();
    const listings = await Listing.find({ donor: req.orgId })
      .sort({ createdAt: -1 })
      .populate('acceptedBy', 'name locality contactName phone')
      .lean();

    // for food still being offered, say which shelter is being asked right now
    const matchedIds = listings.filter((l) => l.status === 'MATCHED').map((l) => l._id);
    const activeOffers = await Offer.find({ listing: { $in: matchedIds }, status: 'PENDING', active: true })
      .populate('recipient', 'name locality')
      .lean();
    listings.forEach((l) => {
      const offer = activeOffers.find((o) => o.listing.toString() === l._id.toString());
      if (offer) {
        const since = new Date(offer.activeSince || offer.createdAt).getTime();
        l.activeOffer = {
          shelter: offer.recipient ? offer.recipient.name : 'a shelter',
          locality: offer.recipient ? offer.recipient.locality : '',
          score: offer.score,
          rank: offer.rank,
          replyBy: new Date(since + REPLY_MINUTES * 60 * 1000),
        };
      }
    });
    // how other kitchens rated each shelter that accepted my food
    const shelterIds = listings.filter((l) => l.acceptedBy).map((l) => l.acceptedBy._id);
    const punctuality = await averageRatings('ratingOfShelter', 'acceptedBy', shelterIds);
    listings.forEach((l) => {
      if (l.acceptedBy) l.acceptedBy.rating = punctuality[l.acceptedBy._id.toString()] || null;
    });

    res.status(200).json(listings);
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── GET /api/listings/:id/offers ───────────────────────────────────────────────
// Donor only (owner). Offers for a listing sorted by rank, with shelter info.
const getListingOffers = async (req, res) => {
  try {
    await housekeeping();
    const listing = await loadOwnListing(req, res);
    if (!listing) return;
    const offers = await Offer.find({ listing: listing._id })
      .sort({ rank: 1 })
      .populate('recipient', 'name locality contactName phone');
    res.status(200).json(offers);
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── GET /api/listings/:id ──────────────────────────────────────────────────────
// Donor only (owner).
const getListingById = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res);
    if (!listing) return;
    res.status(200).json(listing);
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── PUT /api/listings/:id ──────────────────────────────────────────────────────
// Donor only (owner), and only before matching has started.
const updateListing = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res);
    if (!listing) return;
    if (listing.status !== 'OPEN') {
      return res.status(400).json({ message: 'A listing can only be edited before it is offered to shelters.' });
    }

    const validationError = validateListingFields(req.body || {}, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // only these fields may change; status, donor and codes are never taken from the body
    ['description', 'foodType', 'quantity', 'pickupDeadline'].forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });
    await listing.save();
    res.status(200).json(listing);
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── DELETE /api/listings/:id ───────────────────────────────────────────────────
// Donor only (owner). Cancels a listing that no shelter has accepted yet.
const deleteListing = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res);
    if (!listing) return;
    if (listing.status === 'ACCEPTED' || listing.status === 'COLLECTED') {
      return res.status(400).json({ message: 'A shelter has already accepted this food, so it cannot be cancelled here. Please call them.' });
    }
    await Offer.deleteMany({ listing: listing._id });
    await listing.deleteOne();
    res.status(200).json({ message: 'Listing cancelled.' });
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── POST /api/listings/:id/match ──────────────────────────────────────────────
// Donor only (owner). Scores every verified shelter and offers the food to the best one.
const matchListing = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res);
    if (!listing) return;

    // Listing must be OPEN and have no existing offers
    if (listing.status !== 'OPEN') {
      return res.status(400).json({ message: 'Listing is not OPEN and cannot be matched.' });
    }
    const existingOffers = await Offer.countDocuments({ listing: listing._id });
    if (existingOffers > 0) {
      return res.status(400).json({ message: 'Offers already exist for this listing.' });
    }

    const donor = await Organisation.findById(listing.donor).select('lat lng');
    if (!donor) {
      return res.status(500).json({ message: 'Donor organisation not found.' });
    }

    // All verified shelters, with today's capacity
    const recipients = await Organisation.find({ type: 'RECIPIENT', verified: true });
    for (const r of recipients) {
      await refreshDailyCapacity(r);
    }

    // Score each shelter – attach donor coords to the listing for the utility
    const now = Date.now();
    const listingWithCoords = {
      ...listing.toObject(),
      _donorLat: donor.lat,
      _donorLng: donor.lng,
    };

    const scored = recipients
      .map((r) => {
        const result = matchScore(listingWithCoords, r, now);
        if (!result) return null;
        return { recipient: r, ...result };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return res.status(200).json({
        message: 'No shelter can collect this food in time. Try a later deadline or fewer meals.',
        offers: [],
      });
    }

    const offerDocs = await Offer.insertMany(
      scored.map(({ recipient, score, breakdown, km, driveMinutes }, i) => ({
        listing: listing._id,
        recipient: recipient._id,
        rank: i + 1,
        score,
        breakdown,
        km,
        driveMinutes,
        status: 'PENDING',
        active: i === 0, // only rank 1 is asked first
        activeSince: i === 0 ? new Date(now) : undefined,
      }))
    );

    listing.status = 'MATCHED';
    listing.matchedAt = new Date(now);
    await listing.save();

    const responseOffers = offerDocs.map((offer, i) => ({
      _id: offer._id,
      rank: offer.rank,
      score: offer.score,
      active: offer.active,
      status: offer.status,
      breakdown: offer.breakdown,
      km: scored[i].km,
      driveMinutes: scored[i].driveMinutes,
      recipient: {
        _id: scored[i].recipient._id,
        name: scored[i].recipient.name,
        locality: scored[i].recipient.locality,
      },
    }));

    return res.status(201).json({ offers: responseOffers });
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── POST /api/listings/:id/collect ────────────────────────────────────────────
// Donor only (owner). The shelter's staff show their 4-digit code at the kitchen;
// the donor types it in to confirm the food was handed over.
const collectListing = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res, '+handoverCode');
    if (!listing) return;
    if (listing.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Only food that a shelter has accepted can be marked as collected.' });
    }

    const code = String((req.body && req.body.code) || '').trim();
    if (code !== listing.handoverCode) {
      return res.status(400).json({ message: 'Wrong handover code. Ask the shelter staff to show their 4-digit code.' });
    }

    listing.status = 'COLLECTED';
    listing.collectedAt = new Date();
    await listing.save();

    // a shelter that turns up and collects becomes a little more reliable
    const shelter = await Organisation.findById(listing.acceptedBy);
    if (shelter) {
      shelter.reliabilityScore = Math.min(1, Math.round((shelter.reliabilityScore * 0.9 + 0.1) * 100) / 100);
      await shelter.save();
    }

    const result = listing.toObject();
    delete result.handoverCode;
    res.status(200).json({ message: 'Pickup confirmed. Thank you!', listing: result });
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── POST /api/listings/:id/rate ───────────────────────────────────────────────
// Donor only (owner). After the pickup, rate the shelter: did they come on time?
// Body: { stars: 1-5, comment }. Each listing can be rated once.
const rateShelter = async (req, res) => {
  try {
    const listing = await loadOwnListing(req, res);
    if (!listing) return;
    if (listing.status !== 'COLLECTED') {
      return res.status(400).json({ message: 'You can rate the shelter after the food is collected.' });
    }
    if (listing.ratingOfShelter && listing.ratingOfShelter.stars) {
      return res.status(400).json({ message: 'You have already rated this pickup.' });
    }
    const stars = Number(req.body && req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Choose 1 to 5 stars.' });
    }

    listing.ratingOfShelter = { stars, comment: String((req.body && req.body.comment) || '').slice(0, 200), at: new Date() };
    await listing.save();

    // the rating nudges the shelter's reliability: 5 stars pulls it up, 1 star pulls it down
    const shelter = await Organisation.findById(listing.acceptedBy);
    if (shelter) {
      shelter.reliabilityScore = Math.round((shelter.reliabilityScore * 0.9 + (stars / 5) * 0.1) * 100) / 100;
      await shelter.save();
    }
    res.status(200).json({ message: 'Thank you for rating ' + (shelter ? shelter.name : 'the shelter') + '.' });
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

// ── GET /api/listings/insights ────────────────────────────────────────────────
// Donor only. Looks at the donor's past listings (MongoDB aggregation) and says
// when they usually have surplus, e.g. "On Fridays you usually post about 45 meals around 10 pm".
const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

const getInsights = async (req, res) => {
  try {
    const donorId = new mongoose.Types.ObjectId(req.orgId);
    const byDay = await Listing.aggregate([
      { $match: { donor: donorId } },
      { $group: {
        _id: { $dayOfWeek: { date: '$createdAt', timezone: 'Asia/Kolkata' } },   // 1 = Sunday … 7 = Saturday
        listings: { $sum: 1 },
        averageMeals: { $avg: '$quantity' },
        averageHour: { $avg: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } } },
        foodTypes: { $push: '$foodType' },
      } },
      { $sort: { listings: -1, averageMeals: -1 } },
    ]);

    const total = byDay.reduce((sum, d) => sum + d.listings, 0);
    const describe = (d) => {
      // the most common food type on that day
      const counts = {};
      d.foodTypes.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
      const usualType = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const hour = Math.round(d.averageHour);
      return {
        day: DAY_NAMES[d._id - 1],
        listings: d.listings,
        averageMeals: Math.round(d.averageMeals),
        usualHour: hour,
        usualTime: (hour % 12 || 12) + (hour < 12 ? ' am' : ' pm'),
        usualFoodType: usualType,
      };
    };

    // today's day number in India time (1 = Sunday, the same numbering as $dayOfWeek)
    const indiaNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayNumber = indiaNow.getUTCDay() + 1;
    const todayRow = byDay.find((d) => d._id === todayNumber);

    res.status(200).json({
      totalListings: total,
      // only predict a day once there are at least 2 listings on it
      today: todayRow && todayRow.listings >= 2 ? describe(todayRow) : null,
      busiestDay: byDay.length > 0 && byDay[0].listings >= 2 ? describe(byDay[0]) : null,
      days: byDay.map(describe),
    });
  } catch (err) {
    handleError(res, err, 'listing');
  }
};

module.exports = {
  rateShelter,
  getInsights,
  createListing,
  getMyListings,
  getListingOffers,
  getListingById,
  updateListing,
  deleteListing,
  matchListing,
  collectListing,
};
