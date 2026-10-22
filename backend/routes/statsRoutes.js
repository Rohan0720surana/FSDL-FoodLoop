const express = require('express');
const router = express.Router();

const { getStats, getImpact } = require('../controllers/statsController');

// GET    /api/stats          live numbers for the home page (public)
router.get('/', getStats);

// GET    /api/stats/impact   charts and top lists for the impact page (public)
router.get('/impact', getImpact);

module.exports = router;
