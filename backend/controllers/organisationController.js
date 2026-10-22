const Organisation = require('../models/Organisation');
const { todayString, refreshDailyCapacity } = require('../utils/capacity');
const { averageRatings } = require('../utils/ratings');

const handleError = (res, err) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid organisation ID format.' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// ── GET /api/organisations ─────────────────────────────────────────────────────
// Public. Verified shelters only, with fields that are safe to show on the map
// (no email, phone or password).
const getAllOrganisations = async (req, res) => {
  try {
    const safeFields = [
      '_id', 'name', 'type', 'category', 'locality', 'lat', 'lng',
      'foodTypesAccepted', 'capacityPerDay', 'remainingCapacityToday',
      'serviceRadiusKm', 'reliabilityScore', 'capacityResetOn',
    ].join(' ');

    const organisations = await Organisation.find({ type: 'RECIPIENT', verified: true })
      .select(safeFields)
      .sort({ name: 1 })
      .lean();

    // a shelter not yet seen today still has its full daily room
    const today = todayString();
    organisations.forEach((o) => {
      if (o.capacityResetOn !== today) o.remainingCapacityToday = o.capacityPerDay;
      delete o.capacityResetOn;
    });

    res.status(200).json(organisations);
  } catch (err) {
    handleError(res, err);
  }
};

// ── GET /api/organisations/me ──────────────────────────────────────────────────
// Logged in. The caller's own organisation, with today's capacity.
const getMe = async (req, res) => {
  try {
    const org = await refreshDailyCapacity(await Organisation.findById(req.orgId));
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }
    // how others have rated me: kitchens rate shelters' punctuality, shelters rate kitchens' food
    const result = org.toObject();
    if (org.type === 'DONOR') {
      result.rating = (await averageRatings('ratingOfFood', 'donor', [org._id]))[org._id.toString()] || null;
    } else if (org.type === 'RECIPIENT') {
      result.rating = (await averageRatings('ratingOfShelter', 'acceptedBy', [org._id]))[org._id.toString()] || null;
    }
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

// ── PUT /api/organisations/me ──────────────────────────────────────────────────
// Logged in. Update your own contact details. Fields like verified, type and
// reliabilityScore can never be changed by the user.
const updateMe = async (req, res) => {
  try {
    const org = await Organisation.findById(req.orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }

    const allowed = ['name', 'category', 'contactName', 'phone', 'address', 'locality', 'lat', 'lng'];
    if (org.type === 'DONOR') allowed.push('fssaiLicence');
    if (org.type === 'RECIPIENT') allowed.push('foodTypesAccepted', 'capacityPerDay', 'serviceRadiusKm');

    allowed.forEach((field) => {
      if (req.body && req.body[field] !== undefined) org[field] = req.body[field];
    });
    await org.save();
    res.status(200).json(org);
  } catch (err) {
    handleError(res, err);
  }
};

// ── DELETE /api/organisations/me ───────────────────────────────────────────────
// Logged in. Deletes your own account.
const deleteMe = async (req, res) => {
  try {
    const org = await Organisation.findByIdAndDelete(req.orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation not found.' });
    }
    res.status(200).json({ message: 'Account deleted.' });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { getAllOrganisations, getMe, updateMe, deleteMe };
