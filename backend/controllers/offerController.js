const Offer = require('../models/Offer');
const Listing = require('../models/Listing');
const Organisation = require('../models/Organisation');

// ── GET /api/offers/mine ───────────────────────────────────────────────────────
const getMyOffers = async (req, res) => {
  try {
    const offers = await Offer.find({
      recipient: req.orgId,
      status: 'PENDING',
      active: true,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'listing',
        select: 'description foodType quantity pickupDeadline donor',
        populate: { path: 'donor', select: 'name locality' },
      });

    res.status(200).json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/offers/:id/accept ────────────────────────────────────────────────
const acceptOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('listing');
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.recipient.toString() !== req.orgId) {
      return res.status(403).json({ message: 'Not authorised — this offer is not yours.' });
    }

    if (!offer.active || offer.status !== 'PENDING') {
      return res.status(400).json({ message: 'Offer is not active or is no longer pending.' });
    }

    if (new Date(offer.listing.pickupDeadline).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Pickup deadline has already passed.' });
    }

    // Accept this offer
    offer.status = 'ACCEPTED';
    offer.active = false;
    await offer.save();

    // Expire every other PENDING offer for the same listing
    await Offer.updateMany(
      { listing: offer.listing._id, _id: { $ne: offer._id }, status: 'PENDING' },
      { status: 'EXPIRED', active: false }
    );

    // Deduct from recipient's remaining capacity
    await Organisation.findByIdAndUpdate(req.orgId, {
      $inc: { remainingCapacityToday: -offer.listing.quantity },
    });

    return res.status(200).json({ message: 'Offer accepted', offer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid offer ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/offers/:id/pass ──────────────────────────────────────────────────
const passOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('listing');
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.recipient.toString() !== req.orgId) {
      return res.status(403).json({ message: 'Not authorised — this offer is not yours.' });
    }

    if (!offer.active || offer.status !== 'PENDING') {
      return res.status(400).json({ message: 'Offer is not active or is no longer pending.' });
    }

    // Mark this offer as PASSED
    offer.status = 'PASSED';
    offer.active = false;
    await offer.save();

    // Find the next eligible offer (lowest rank still PENDING)
    const next = await Offer.findOne({
      listing: offer.listing._id,
      status: 'PENDING',
      _id: { $ne: offer._id },
    })
      .sort({ rank: 1 })
      .populate('recipient', 'name');

    if (next) {
      next.active = true;
      await next.save();
      return res.status(200).json({
        message: 'Offer passed to next recipient',
        nextRecipient: next.recipient.name,
      });
    }

    // No more recipients — expire the listing
    await Listing.findByIdAndUpdate(offer.listing._id, { status: 'EXPIRED' });

    return res.status(200).json({
      message: 'No more recipients available, listing expired',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid offer ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMyOffers, acceptOffer, passOffer };
