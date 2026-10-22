/**
 * cascade.js – moving an offer down the ranked list of shelters.
 *
 * offerToNextShelter  re-scores the shelters still waiting (time has passed,
 *                     so some may no longer make it) and asks the best one.
 * housekeeping        run before reading data: expires listings whose deadline
 *                     has passed, and moves on from shelters that did not reply
 *                     within the reply window.
 */

const Offer = require('../models/Offer');
const Listing = require('../models/Listing');
const Organisation = require('../models/Organisation');
const { matchScore } = require('./matching');
const { refreshDailyCapacity } = require('./capacity');

// how long a shelter has to accept or pass before the offer moves on
const REPLY_MINUTES = 10;

/**
 * Re-scores every PENDING offer of this listing with the time left now,
 * drops shelters that can no longer take it, renumbers the rest by score and
 * makes the best one active. If nobody is left, the listing expires.
 *
 * Returns the newly active offer (populated with recipient name) or null.
 */
const offerToNextShelter = async (listingId, now = Date.now()) => {
  const listing = await Listing.findById(listingId);
  if (!listing || listing.status !== 'MATCHED') return null;

  const donor = await Organisation.findById(listing.donor).select('lat lng');
  const listingWithCoords = {
    ...listing.toObject(),
    _donorLat: donor ? donor.lat : 0,
    _donorLng: donor ? donor.lng : 0,
  };

  const waiting = await Offer.find({ listing: listing._id, status: 'PENDING' }).populate('recipient');

  // shelters already asked keep their rank; the rest are numbered after them
  const asked = await Offer.countDocuments({ listing: listing._id, status: { $ne: 'PENDING' } });

  const stillPossible = [];
  for (const offer of waiting) {
    const recipient = offer.recipient ? await refreshDailyCapacity(offer.recipient) : null;
    const result = recipient && recipient.verified ? matchScore(listingWithCoords, recipient, now) : null;

    if (!result) {
      // too far for the time left, or no room any more
      offer.status = 'EXPIRED';
      offer.active = false;
      await offer.save();
    } else {
      offer.score = result.score;
      offer.breakdown = result.breakdown;
      offer.km = result.km;
      offer.driveMinutes = result.driveMinutes;
      stillPossible.push(offer);
    }
  }

  stillPossible.sort((a, b) => b.score - a.score);

  for (let i = 0; i < stillPossible.length; i++) {
    const offer = stillPossible[i];
    offer.rank = asked + i + 1;
    offer.active = i === 0;
    if (i === 0) offer.activeSince = new Date(now);
    await offer.save();
  }

  if (stillPossible.length === 0) {
    listing.status = 'EXPIRED';
    await listing.save();
    return null;
  }
  return stillPossible[0];
};

/**
 * Keeps the data honest before it is shown:
 *  1. listings past their deadline that nobody accepted → EXPIRED
 *  2. an active offer older than the reply window → LAPSED, move to the next shelter
 */
const housekeeping = async (now = Date.now()) => {
  const nowDate = new Date(now);

  // 1. deadline passed
  const overdue = await Listing.find({
    status: { $in: ['OPEN', 'MATCHED'] },
    pickupDeadline: { $lt: nowDate },
  }).select('_id');
  if (overdue.length > 0) {
    const ids = overdue.map((l) => l._id);
    await Listing.updateMany({ _id: { $in: ids } }, { status: 'EXPIRED' });
    await Offer.updateMany({ listing: { $in: ids }, status: 'PENDING' }, { status: 'EXPIRED', active: false });
  }

  // 2. no reply within the window
  const cutoff = new Date(now - REPLY_MINUTES * 60 * 1000);
  const silent = await Offer.find({
    status: 'PENDING',
    active: true,
    $or: [{ activeSince: { $lt: cutoff } }, { activeSince: null, createdAt: { $lt: cutoff } }],
  });
  for (const offer of silent) {
    // only lapse it if it is still the active one (another request may have handled it)
    const lapsed = await Offer.findOneAndUpdate(
      { _id: offer._id, status: 'PENDING', active: true },
      { status: 'LAPSED', active: false },
      { new: true }
    );
    if (lapsed) await offerToNextShelter(lapsed.listing, now);
  }
};

module.exports = { REPLY_MINUTES, offerToNextShelter, housekeeping };
