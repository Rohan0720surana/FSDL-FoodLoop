const express = require('express');
const router = express.Router();

const { getAllOrganisations, getMe, updateMe, deleteMe } = require('../controllers/organisationController');
const { protect } = require('../middleware/authMiddleware');

// GET    /api/organisations      verified shelters for the map (public)
router.get('/', getAllOrganisations);

// GET / PUT / DELETE /api/organisations/me   your own account (logged in)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);

module.exports = router;
