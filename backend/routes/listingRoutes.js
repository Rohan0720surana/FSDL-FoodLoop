const express = require('express');
const router = express.Router();

const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  matchListing,
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// POST   /api/listings           (protected)
router.post('/', protect, createListing);

// POST   /api/listings/:id/match (protected)
router.post('/:id/match', protect, matchListing);

// GET    /api/listings            (public)
router.get('/', getAllListings);

// GET    /api/listings/:id        (public)
router.get('/:id', getListingById);

// PUT    /api/listings/:id        (protected)
router.put('/:id', protect, updateListing);

// DELETE /api/listings/:id        (protected)
router.delete('/:id', protect, deleteListing);

module.exports = router;
