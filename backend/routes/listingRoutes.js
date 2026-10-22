const express = require('express');
const router = express.Router();

const {
  createListing,
  getMyListings,
  getListingOffers,
  getListingById,
  updateListing,
  deleteListing,
  matchListing,
  collectListing,
  rateShelter,
  getInsights,
} = require('../controllers/listingController');
const { protect, onlyFor } = require('../middleware/authMiddleware');

// every listing route is for a logged-in donor
router.use(protect, onlyFor('DONOR'));

// POST   /api/listings               post surplus food
router.post('/', createListing);

// GET    /api/listings/mine          my listings, newest first
router.get('/mine', getMyListings);

// GET    /api/listings/insights      when I usually have surplus (from my past listings)
router.get('/insights', getInsights);

// POST   /api/listings/:id/match     rank shelters and offer it to the best one
router.post('/:id/match', matchListing);

// POST   /api/listings/:id/collect   confirm pickup with the shelter's handover code
router.post('/:id/collect', collectListing);

// POST   /api/listings/:id/rate      rate the shelter after the pickup
router.post('/:id/rate', rateShelter);

// GET    /api/listings/:id/offers    who has been asked, by rank
router.get('/:id/offers', getListingOffers);

// GET / PUT / DELETE /api/listings/:id   (owner only)
router.get('/:id', getListingById);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
