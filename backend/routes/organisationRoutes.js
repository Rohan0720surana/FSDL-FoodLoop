const express = require('express');
const router = express.Router();

const {
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
} = require('../controllers/organisationController');
const { protect } = require('../middleware/authMiddleware');

// GET    /api/organisations
router.get('/', getAllOrganisations);

// GET    /api/organisations/:id
router.get('/:id', getOrganisationById);

// PUT    /api/organisations/:id  (protected)
router.put('/:id', protect, updateOrganisation);

// DELETE /api/organisations/:id  (protected)
router.delete('/:id', protect, deleteOrganisation);

module.exports = router;
