/**
 * scripts/makeToken.js – Development / testing helper
 *
 * Generates a signed JWT for a named organisation so you can test
 * protected endpoints without going through the login flow.
 *
 * Usage:
 *   node scripts/makeToken.js "Sneh Sadan"
 *
 * Prints ONLY the token to stdout so it can be captured in a shell variable:
 *   TOKEN=$(node scripts/makeToken.js "Sneh Sadan")
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Organisation = require('../models/Organisation');

const name = process.argv[2];

if (!name) {
  process.stderr.write('Usage: node scripts/makeToken.js "<organisation name>"\n');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Case-insensitive substring match, same as a human would search
  const org = await Organisation.findOne({ name: new RegExp(name, 'i') });

  if (!org) {
    process.stderr.write(`No organisation found matching: "${name}"\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const token = jwt.sign({ id: org._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  // Print token only — nothing else — so shell capture works cleanly
  console.log(token);

  await mongoose.disconnect();
};

run().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
