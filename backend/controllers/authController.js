const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Organisation = require('../models/Organisation');
const { todayString } = require('../utils/capacity');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Sign a JWT for the given organisation. The token carries its id and type,
 * so routes can check "is this a donor?" without another database lookup.
 */
const signToken = (org) =>
  jwt.sign({ id: org._id, type: org.type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Strip passwordHash from a Mongoose document and return a plain object
 * with only the public fields.
 */
const publicFields = (org) => {
  const obj = org.toObject();
  delete obj.passwordHash;
  return obj;
};

const isNumber = (v) => typeof v === 'number' && !isNaN(v);

// ── POST /api/auth/register ────────────────────────────────────────────────────
// Donors and recipients register through separate forms; each sends its own fields.
// Only the fields listed here are saved, so nobody can sign up as "verified".
const register = async (req, res) => {
  try {
    const b = req.body || {};

    if (b.type !== 'DONOR' && b.type !== 'RECIPIENT') {
      return res.status(400).json({ message: 'Choose whether you are a donor or a recipient.' });
    }
    if (!b.password || String(b.password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!isNumber(b.lat) || !isNumber(b.lng)) {
      return res.status(400).json({ message: 'Choose your area so we know where you are.' });
    }

    const data = {
      name: b.name,
      type: b.type,
      category: b.category,
      email: b.email,
      contactName: b.contactName,
      phone: b.phone,
      address: b.address,
      locality: b.locality,
      lat: b.lat,
      lng: b.lng,
    };

    if (b.type === 'DONOR') {
      data.fssaiLicence = b.fssaiLicence || '';
    } else {
      // only the four food types the matching engine understands
      const foodTypes = Array.isArray(b.foodTypesAccepted) ? b.foodTypesAccepted : [];
      data.foodTypesAccepted = foodTypes.filter((t) => Organisation.FOOD_TYPES.includes(t));
      if (data.foodTypesAccepted.length === 0) {
        return res.status(400).json({ message: 'Choose at least one type of food you can accept.' });
      }

      const capacity = Number(b.capacityPerDay);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
        return res.status(400).json({ message: 'Capacity must be a whole number of meals between 1 and 5000.' });
      }
      const radius = Number(b.serviceRadiusKm);
      if (isNaN(radius) || radius < 1 || radius > 50) {
        return res.status(400).json({ message: 'Service radius must be between 1 and 50 km.' });
      }

      data.capacityPerDay = capacity;
      data.remainingCapacityToday = capacity; // full room on the first day
      data.capacityResetOn = todayString();
      data.serviceRadiusKm = radius;
      // verified and reliabilityScore keep their defaults (false, 0.5)
    }

    // Hash password — salt rounds = 12 is a good production default
    data.passwordHash = await bcrypt.hash(String(b.password), 12);

    const org = await Organisation.create(data);

    res.status(201).json({
      token: signToken(org),
      organisation: publicFields(org),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An organisation with that email already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash — it is excluded by default (select: false)
    const org = await Organisation.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');

    // Never reveal which field was wrong
    const GENERIC_ERROR = 'Invalid email or password.';

    if (!org) {
      return res.status(401).json({ message: GENERIC_ERROR });
    }

    const passwordMatch = await bcrypt.compare(String(password), org.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: GENERIC_ERROR });
    }

    res.status(200).json({
      token: signToken(org),
      organisation: publicFields(org),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
