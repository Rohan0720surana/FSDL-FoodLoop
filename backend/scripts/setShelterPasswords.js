const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Organisation = require('../models/Organisation');

const SALT_ROUNDS = 12; // Same salt rounds as authController
const DEFAULT_PASSWORD = 'shelter123';

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  // Explicitly select passwordHash since it is select: false in the model.
  // Find all RECIPIENT organisations whose passwordHash does not start with "$2"
  const organisations = await Organisation.find({
    type: 'RECIPIENT',
    passwordHash: { $not: /^\$2/ },
  }).select('+passwordHash');

  if (organisations.length === 0) {
    console.log('No recipient organisations found with an unhashed password.');
    console.log('Updated 0 organisations.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  let updatedCount = 0;
  for (const org of organisations) {
    org.passwordHash = hashedPassword;
    await org.save();
    console.log(`${org.name}, ${org.email}`);
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} organisations.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Error updating shelter passwords:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
