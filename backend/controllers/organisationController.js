const Organisation = require('../models/Organisation');

// ── POST /api/organisations  (internal helper — also called by auth register) ──
const createOrganisation = async (req, res) => {
  try {
    const org = await Organisation.create(req.body);
    res.status(201).json(org);
  } catch (err) {
    // Duplicate email → MongoDB error code 11000
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An organisation with that email already exists.' });
    }
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/organisations ─────────────────────────────────────────────────────
const getAllOrganisations = async (req, res) => {
  try {
    const organisations = await Organisation.find();
    res.status(200).json(organisations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── GET /api/organisations/:id ─────────────────────────────────────────────────
const getOrganisationById = async (req, res) => {
  try {
    const org = await Organisation.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }
    res.status(200).json(org);
  } catch (err) {
    // Invalid ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid organisation ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── PUT /api/organisations/:id ─────────────────────────────────────────────────
const updateOrganisation = async (req, res) => {
  try {
    // runValidators: true → Mongoose schema validators run on update as well
    // new: true         → return the updated document, not the original
    const org = await Organisation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }
    res.status(200).json(org);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid organisation ID format.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An organisation with that email already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── DELETE /api/organisations/:id ──────────────────────────────────────────────
const deleteOrganisation = async (req, res) => {
  try {
    const org = await Organisation.findByIdAndDelete(req.params.id);
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }
    res.status(200).json({ message: 'Organisation deleted successfully.' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid organisation ID format.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createOrganisation,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
};
