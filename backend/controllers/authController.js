const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Organisation = require('../models/Organisation');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Sign a JWT for the given organisation id.
 * Expires in 24 h (hard-coded here; JWT_EXPIRES_IN in .env is for future use).
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });

/**
 * Strip passwordHash from a Mongoose document and return a plain object
 * with only the public fields.
 */
const publicFields = (org) => {
  const obj = org.toObject();
  delete obj.passwordHash;
  return obj;
};

// ── POST /api/auth/register ────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, type, email, password, locality, lat, lng, ...rest } = req.body;

    // Basic presence check (Mongoose validators will catch missing required fields
    // anyway, but this gives a cleaner 400 before touching the DB)
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    // Hash password — salt rounds = 12 is a good production default
    const passwordHash = await bcrypt.hash(password, 12);

    const org = await Organisation.create({
      name,
      type,
      email,
      passwordHash,
      locality,
      lat,
      lng,
      ...rest,           // optional fields (foodTypesAccepted, capacityPerDay, …)
    });

    const token = signToken(org._id);

    res.status(201).json({
      token,
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash — it is excluded by default (select: false)
    const org = await Organisation.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    // Use a constant-time comparison; never reveal which field was wrong
    const GENERIC_ERROR = 'Invalid email or password.';

    if (!org) {
      return res.status(401).json({ message: GENERIC_ERROR });
    }

    const passwordMatch = await bcrypt.compare(password, org.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: GENERIC_ERROR });
    }

    const token = signToken(org._id);

    res.status(200).json({
      token,
      organisation: publicFields(org),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login };
