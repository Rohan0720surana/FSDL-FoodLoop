require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes          = require('./routes/authRoutes');
const organisationRoutes  = require('./routes/organisationRoutes');
const listingRoutes       = require('./routes/listingRoutes');
const offerRoutes         = require('./routes/offerRoutes');

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
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
