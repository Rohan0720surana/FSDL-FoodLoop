const Listing = require('../models/Listing');

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

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
};
