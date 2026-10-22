const path = require('path');
// load backend/.env even when the server is started from another folder
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes          = require('./routes/authRoutes');
const organisationRoutes  = require('./routes/organisationRoutes');
const listingRoutes       = require('./routes/listingRoutes');
const offerRoutes         = require('./routes/offerRoutes');
const statsRoutes         = require('./routes/statsRoutes');
const adminRoutes         = require('./routes/adminRoutes');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth (register / login)
app.use('/api/auth', authRoutes);

// Organisation CRUD
app.use('/api/organisations', organisationRoutes);

// Listing CRUD + matching
app.use('/api/listings', listingRoutes);

// Offer handling (recipient accept / pass)
app.use('/api/offers', offerRoutes);

// Live numbers for the home page and the impact page
app.use('/api/stats', statsRoutes);

// Admin: verify or reject shelters
app.use('/api/admin', adminRoutes);

// ── Security middleware ────────────────────────────────────────────────────────
// Prevent access to /backend directory or any hidden files (.env, .git, etc.)
app.use((req, res, next) => {
  const normalizedPath = req.path.replace(/\\/g, '/');
  const lower = normalizedPath.toLowerCase();

  if (lower.startsWith('/backend')) {
    return res.status(404).json({ message: 'Route not found' });
  }

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => segment.startsWith('.'))) {
    return res.status(404).json({ message: 'Route not found' });
  }

  next();
});

// ── Static files ───────────────────────────────────────────────────────────────
// Serve frontend files from repository root
app.use(express.static(path.join(__dirname, '..'), { dotfiles: 'deny', index: 'index.html' }));

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('Missing MONGO_URI or JWT_SECRET. Copy backend/.env.example to backend/.env and fill it in.');
    process.exit(1);
  }
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
