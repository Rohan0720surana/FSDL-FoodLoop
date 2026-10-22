const express = require('express');
const router = express.Router();

const { getMyOffers, getMyPickups, acceptOffer, passOffer, rateFood } = require('../controllers/offerController');
const { protect, onlyFor } = require('../middleware/authMiddleware');

// every offer route is for a logged-in recipient (shelter)
router.use(protect, onlyFor('RECIPIENT'));

// GET    /api/offers/mine          offers waiting for my reply
router.get('/mine', getMyOffers);

// GET    /api/offers/pickups       food I accepted, with the handover code
router.get('/pickups', getMyPickups);

// POST   /api/offers/pickups/:listingId/rate   rate the food after collecting it
router.post('/pickups/:listingId/rate', rateFood);

// POST   /api/offers/:id/accept
router.post('/:id/accept', acceptOffer);

// POST   /api/offers/:id/pass
router.post('/:id/pass', passOffer);

module.exports = router;
