const express = require('express');
const router = express.Router();

const { getMyOffers, acceptOffer, passOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

// GET    /api/offers/mine          (protected)
router.get('/mine', protect, getMyOffers);

// POST   /api/offers/:id/accept    (protected)
router.post('/:id/accept', protect, acceptOffer);

// POST   /api/offers/:id/pass      (protected)
router.post('/:id/pass', protect, passOffer);

module.exports = router;
