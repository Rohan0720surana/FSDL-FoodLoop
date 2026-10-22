const express = require('express');
const router = express.Router();

const { getOrganisations, verifyOrganisation, rejectOrganisation } = require('../controllers/adminController');
const { protect, onlyFor } = require('../middleware/authMiddleware');

// every admin route needs a logged-in ADMIN account
router.use(protect, onlyFor('ADMIN'));

// GET    /api/admin/organisations              all donors and shelters
router.get('/organisations', getOrganisations);

// POST   /api/admin/organisations/:id/verify   shelter starts getting offers
router.post('/organisations/:id/verify', verifyOrganisation);

// POST   /api/admin/organisations/:id/reject   { reason }
router.post('/organisations/:id/reject', rejectOrganisation);

module.exports = router;
