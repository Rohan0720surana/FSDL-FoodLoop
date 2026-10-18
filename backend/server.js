require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes          = require('./routes/authRoutes');
const organisationRoutes  = require('./routes/organisationRoutes');
const listingRoutes       = require('./routes/listingRoutes');

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

// Listing CRUD
app.use('/api/listings', listingRoutes);

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
