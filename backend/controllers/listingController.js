const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Organisation = require('../models/Organisation');
const { matchScore } = require('../utils/matching');

// Minimum lead-time before pickup deadline (30 minutes in ms)
const MIN_DEADLINE_MS = 30 * 60 * 1000;

/**
 * Validates the business rules that Mongoose schema validators cannot express:
 *   • quantity must be a positive number
 *   • pickupDeadline must be at least 30 minutes in the future
 *
 * Returns an error message string, or null if everything is valid.
 */
const validateListingFields = ({ quantity, pickupDeadline }) => {
  if (quantity !== undefined) {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return 'quantity must be a positive number.';
    }
  }

  if (pickupDeadline !== undefined) {
    const deadline = new Date(pickupDeadline);
    if (isNaN(deadline.getTime())) {
      return 'pickupDeadline must be a valid date.';
    }
    if (deadline.getTime() - Date.now() < MIN_DEADLINE_MS) {
      return 'pickupDeadline must be at least 30 minutes in the future.';
    }
  }

  return null;
};

// ── POST /api/listings ─────────────────────────────────────────────────────────
const createListing = async (req, res) => {
  try {
    // Business-rule validation before hitting the DB
    const validationError = validateListingFields(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = await Listing.create(req.body);
    res.status(201).json(listing);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/listings ──────────────────────────────────────────────────────────
const getAllListings = async (req, res) => {
  try {
    // Newest first; populate donor name for convenience
    const listings = await Listing.find()
      .sort({ createdAt: -1 })
      .populate('donor', 'name type locality');
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/listings/:id ──────────────────────────────────────────────────────
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'donor',
      'name type locality'
    );
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    res.status(200).json(listing);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /api/listings/:id ──────────────────────────────────────────────────────
const updateListing = async (req, res) => {
  try {
    // Re-run business-rule validation on any fields being updated
    const validationError = validateListingFields(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    res.status(200).json(listing);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /api/listings/:id ───────────────────────────────────────────────────
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    res.status(200).json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/listings/:id/match ──────────────────────────────────────────────
const matchListing = async (req, res) => {
  try {
    // 1. Load the listing
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // 2. Only the listing's donor may trigger matching
    if (listing.donor.toString() !== req.orgId) {
      return res.status(403).json({ message: 'Not authorised — you do not own this listing.' });
    }

    // 3. Listing must be OPEN and have no existing offers
    if (listing.status !== 'OPEN') {
      return res.status(400).json({ message: 'Listing is not OPEN and cannot be matched.' });
    }
    const existingOffers = await Offer.countDocuments({ listing: listing._id });
    if (existingOffers > 0) {
      return res.status(400).json({ message: 'Offers already exist for this listing.' });
    }

    // 4. Load donor coordinates
    const donor = await Organisation.findById(listing.donor).select('lat lng');
    if (!donor) {
      return res.status(500).json({ message: 'Donor organisation not found.' });
    }

    // 5. Load all verified recipients
    const recipients = await Organisation.find({ type: 'RECIPIENT', verified: true });

    // 6. Score each recipient – attach donor coords to listing for the utility
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

    // 7. No eligible recipients
    if (scored.length === 0) {
      return res.status(200).json({
        message: 'No recipient can take this listing right now',
        offers: [],
      });
    }

    // 8. Create Offer documents
    const offerDocs = await Offer.insertMany(
      scored.map(({ recipient, score, breakdown, km, driveMinutes }, i) => ({
        listing: listing._id,
        recipient: recipient._id,
        rank: i + 1,
        score,
        breakdown,
        status: 'PENDING',
        active: i === 0, // only rank-1 is active
      }))
    );

    // 9. Flip listing status to MATCHED
    listing.status = 'MATCHED';
    await listing.save();

    // 10. Build response payload (offers sorted by rank, enriched with recipient info)
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
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  matchListing,
};
