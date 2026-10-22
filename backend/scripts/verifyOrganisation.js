/**
 * scripts/verifyOrganisation.js – approve a shelter that signed up on the website
 *
 * New recipients start unverified and get no offers until FoodLoop checks them.
 *
 * Usage (inside backend/):
 *   npm run verify                         lists shelters waiting for verification
 *   npm run verify -- contact@shelter.org  verifies that shelter
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Organisation = require('../models/Organisation');

const email = process.argv[2];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  if (!email) {
    const waiting = await Organisation.find({ type: 'RECIPIENT', verified: false }).select('name email locality');
    if (waiting.length === 0) {
      console.log('No shelters are waiting for verification.');
    } else {
      console.log('Shelters waiting for verification:');
      waiting.forEach((o) => console.log('  ' + o.email + '  (' + o.name + ', ' + o.locality + ')'));
      console.log('Verify one with: npm run verify -- <email>');
    }
  } else {
    const org = await Organisation.findOneAndUpdate(
      { email: email.toLowerCase().trim(), type: 'RECIPIENT' },
      { verified: true },
      { new: true }
    );
    console.log(org ? 'Verified ' + org.name + '. It will now receive offers.' : 'No shelter found with email ' + email);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Error: ' + err.message);
  await mongoose.disconnect();
  process.exit(1);
});
