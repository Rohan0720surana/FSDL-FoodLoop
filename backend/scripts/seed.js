/**
 * scripts/seed.js – loads the FoodLoop demo data into an empty database
 *
 * Adds 2 donor kitchens, 5 verified shelters and 1 shelter waiting for
 * verification at their real Mumbai locations, an admin account, and four
 * weeks of past pickups (with passes, expired food and ratings) so the home,
 * impact and donor pages have real data to count.
 *
 * Usage (inside backend/):
 *   npm run seed              only works on an empty database
 *   npm run seed -- --reset   deletes ALL organisations, listings and offers first
 *
 * Demo logins (password for every shelter is shelter123):
 *   canteen@stxaviers.edu / canteen123      donor
 *   banquet@regency.test  / regency123      donor
 *   contact@snehsadan.org / shelter123      shelter
 *   admin@foodloop.test   / admin123        admin (verifies shelters)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Organisation = require('../models/Organisation');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const { todayString } = require('../utils/capacity');
const { matchScore } = require('../utils/matching');

const ALL_FOOD = ['VEG', 'NON_VEG', 'BAKERY', 'PACKAGED'];

const donors = [
  {
    name: "St. Xavier's College Canteen", category: 'College canteen',
    email: 'canteen@stxaviers.edu', password: 'canteen123',
    contactName: 'Priya Sharma', phone: '9820012345',
    address: '5, Mahapalika Marg, Dhobi Talao, Mumbai 400001',
    locality: 'Dhobi Talao', lat: 18.9497, lng: 72.8296,
    fssaiLicence: '11522998000123',
  },
  {
    name: 'Regency Banquet Hall', category: 'Banquet hall',
    email: 'banquet@regency.test', password: 'regency123',
    contactName: 'Imran Qureshi', phone: '9867054321',
    address: 'S. V. Road, Andheri West, Mumbai 400058',
    locality: 'Andheri West', lat: 19.1197, lng: 72.8464,
    fssaiLicence: '11519012000456',
  },
];

const shelters = [
  {
    name: 'Sneh Sadan Balgram', category: 'Orphanage',
    email: 'contact@snehsadan.org', contactName: 'Sister Mary Fernandes', phone: '9821100221',
    address: 'Gokhale Road, Dadar West, Mumbai 400028',
    locality: 'Dadar', lat: 19.0186, lng: 72.8430,
    foodTypesAccepted: ALL_FOOD, capacityPerDay: 80, serviceRadiusKm: 14, reliabilityScore: 0.9,
  },
  {
    name: 'Asha Deep Night Shelter', category: 'Night shelter',
    email: 'ashadeep@shelters.test', contactName: 'Ramesh Patil', phone: '9819200332',
    address: 'Near Bandra Station (East), Mumbai 400051',
    locality: 'Bandra East', lat: 19.0633, lng: 72.8411,
    foodTypesAccepted: ALL_FOOD, capacityPerDay: 60, serviceRadiusKm: 20, reliabilityScore: 0.8,
  },
  {
    name: 'Kripa Foundation Food Bank', category: 'NGO',
    email: 'kripa@shelters.test', contactName: 'Anita D’Souza', phone: '9833300443',
    address: 'Bandra Kurla Complex, Mumbai 400051',
    locality: 'BKC', lat: 19.0669, lng: 72.8679,
    foodTypesAccepted: ALL_FOOD, capacityPerDay: 120, serviceRadiusKm: 25, reliabilityScore: 0.7,
  },
  {
    name: 'Seva Sadan Community Kitchen', category: 'Community kitchen',
    email: 'sevasadan@shelters.test', contactName: 'Mohammed Shaikh', phone: '9867400554',
    address: 'L.B.S. Marg, Kurla West, Mumbai 400070',
    locality: 'Kurla', lat: 19.0726, lng: 72.8845,
    foodTypesAccepted: ALL_FOOD, capacityPerDay: 90, serviceRadiusKm: 22, reliabilityScore: 0.75,
  },
  {
    name: 'Prakash Old Age Home', category: 'Old-age home',
    email: 'prakash@shelters.test', contactName: 'Sunita Joshi', phone: '9892500665',
    address: 'Sion-Trombay Road, Chembur, Mumbai 400071',
    locality: 'Chembur', lat: 19.0522, lng: 72.9005,
    foodTypesAccepted: ['VEG', 'BAKERY', 'PACKAGED'], capacityPerDay: 25, serviceRadiusKm: 20, reliabilityScore: 0.95,
  },
];

// a shelter that signed up on the website and is waiting for an admin to check it
const pendingShelter = {
  name: 'Navjeevan Women\u2019s Shelter', category: 'Night shelter',
  email: 'navjeevan@shelters.test', contactName: 'Farida Khan', phone: '9930600776',
  address: 'Mahim Causeway, Mahim, Mumbai 400016',
  locality: 'Mahim', lat: 19.0410, lng: 72.8400,
  foodTypesAccepted: ['VEG', 'BAKERY'], capacityPerDay: 40, serviceRadiusKm: 10,
};

// what each kitchen usually gives away (used to build four weeks of history)
const menus = [
  // St. Xavier's: weekday evenings, mostly veg
  [['Veg biryani + dal', 'VEG'], ['Rajma chawal', 'VEG'], ['Pav bhaji', 'VEG'], ['Chole + rice', 'VEG'],
   ['Bread rolls and buns', 'BAKERY'], ['Egg curry + rice', 'NON_VEG']],
  // Regency: weekend nights after weddings, big quantities
  [['Wedding buffet: paneer, rice, rotis', 'VEG'], ['Mixed veg thali', 'VEG'], ['Chicken biryani', 'NON_VEG'],
   ['Pulao and raita', 'VEG'], ['Dal makhani + naan', 'VEG']],
];

// a small random-number generator with a fixed start, so every seed gives the same history
let seedValue = 20261021;
const random = () => {
  seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
  return seedValue / 2147483648;
};
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (low, high) => low + Math.floor(random() * (high - low + 1));

const run = async () => {
  const reset = process.argv.includes('--reset');
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Organisation.countDocuments();
  if (existing > 0 && !reset) {
    console.log('The database already has ' + existing + ' organisations, so nothing was added.');
    console.log('Run "npm run seed -- --reset" to delete everything and load the demo data again.');
    await mongoose.disconnect();
    return;
  }
  if (reset) {
    await Promise.all([Organisation.deleteMany({}), Listing.deleteMany({}), Offer.deleteMany({})]);
    console.log('Deleted all organisations, listings and offers.');
  }

  const today = todayString();

  const donorDocs = [];
  for (const d of donors) {
    const { password, ...fields } = d;
    donorDocs.push(await Organisation.create({
      ...fields, type: 'DONOR', passwordHash: await bcrypt.hash(password, 12),
    }));
  }

  const shelterHash = await bcrypt.hash('shelter123', 12);
  const shelterDocs = [];
  for (const s of shelters) {
    shelterDocs.push(await Organisation.create({
      ...s, type: 'RECIPIENT', verified: true, passwordHash: shelterHash,
      remainingCapacityToday: s.capacityPerDay, capacityResetOn: today,
    }));
  }

  // the pending shelter (not verified) and the admin
  await Organisation.create({
    ...pendingShelter, type: 'RECIPIENT', verified: false, passwordHash: shelterHash,
    remainingCapacityToday: pendingShelter.capacityPerDay, capacityResetOn: today,
  });
  await Organisation.create({
    name: 'FoodLoop Admin', type: 'ADMIN', email: 'admin@foodloop.test',
    passwordHash: await bcrypt.hash('admin123', 12), locality: 'Mumbai', lat: 19.05, lng: 72.865,
  });

  // four weeks of history: insert directly so the past dates are kept
  const DAY = 24 * 60 * 60 * 1000;
  let pickups = 0;
  let expired = 0;

  for (let daysAgo = 28; daysAgo >= 1; daysAgo--) {
    const day = new Date(Date.now() - daysAgo * DAY);
    const weekday = day.getDay();   // 0 = Sunday

    // [donor index, posts that day?, meals range, hour of day]
    const plans = [
      [0, weekday >= 1 && weekday <= 5 && random() < 0.8, weekday === 5 ? [50, 60] : [30, 48], 19],
      [1, (weekday === 0 || weekday >= 5) && random() < 0.85, [80, 120], 22],
    ];

    for (const [di, posts, range, hour] of plans) {
      if (!posts) continue;
      const donor = donorDocs[di];
      const [food, foodType] = pick(menus[di]);
      const meals = between(range[0], range[1]);

      const postedAt = new Date(day);
      postedAt.setHours(hour, between(0, 40), 0, 0);
      const deadline = new Date(postedAt.getTime() + 3 * 60 * 60 * 1000);

      // rank the shelters the way the server would have at that moment
      const listingForScore = { foodType, quantity: meals, pickupDeadline: deadline, _donorLat: donor.lat, _donorLng: donor.lng };
      const ranked = shelterDocs
        .map((s) => ({ shelter: s, result: matchScore(listingForScore, s, postedAt.getTime()) }))
        .filter((r) => r.result)
        .sort((a, b) => b.result.score - a.result.score);
      if (ranked.length === 0) continue;

      // what happened: usually #1 accepts, sometimes #1 passes first, now and then nobody collects
      const roll = random();
      const passesBeforeAccept = roll < 0.65 ? 0 : (roll < 0.9 ? 1 : -1);   // -1 means it expired
      const listingId = new mongoose.Types.ObjectId();
      let clock = postedAt.getTime() + 60 * 1000;
      const offers = [];
      let acceptedBy = null;
      let acceptedAt = null;
      let collectedAt = null;

      for (let r = 0; r < ranked.length; r++) {
        const { shelter, result } = ranked[r];
        const offer = {
          listing: listingId, recipient: shelter._id, score: result.score, rank: r + 1,
          km: result.km, driveMinutes: result.driveMinutes, breakdown: result.breakdown,
          active: false, createdAt: postedAt, __v: 0,
        };
        const asked = passesBeforeAccept === -1 ? r < 2 : r <= passesBeforeAccept;
        if (!asked || acceptedBy) {
          offer.status = 'EXPIRED';
          offer.updatedAt = new Date(clock);
        } else {
          offer.activeSince = new Date(clock);
          if (passesBeforeAccept === -1) {
            // nobody took it: the first said no, the second did not reply in time
            clock += (r === 0 ? between(3, 8) : 10) * 60 * 1000;
            offer.status = r === 0 ? 'PASSED' : 'LAPSED';
          } else if (r < passesBeforeAccept) {
            clock += between(2, 7) * 60 * 1000;
            offer.status = 'PASSED';
          } else {
            clock += between(2, 9) * 60 * 1000;
            offer.status = 'ACCEPTED';
            acceptedBy = shelter;
            acceptedAt = new Date(clock);
            collectedAt = new Date(clock + (result.driveMinutes + between(10, 25)) * 60 * 1000);
          }
          offer.updatedAt = new Date(clock);
        }
        offers.push(offer);
      }

      const listing = {
        _id: listingId, donor: donor._id, description: food, foodType, quantity: meals,
        pickupDeadline: deadline, matchedAt: postedAt, createdAt: postedAt, __v: 0,
      };
      if (acceptedBy) {
        Object.assign(listing, {
          status: 'COLLECTED', acceptedBy: acceptedBy._id, acceptedAt, collectedAt, updatedAt: collectedAt,
          handoverCode: String(between(1000, 9999)),
        });
        // most pickups get rated by both sides
        if (random() < 0.85) listing.ratingOfFood = { stars: random() < 0.75 ? 5 : 4, comment: '', at: collectedAt };
        if (random() < 0.85) listing.ratingOfShelter = { stars: random() < 0.6 ? 5 : (random() < 0.7 ? 4 : 3), comment: '', at: collectedAt };
        pickups++;
      } else {
        Object.assign(listing, { status: 'EXPIRED', updatedAt: deadline });
        expired++;
      }
      await Listing.collection.insertOne(listing);
      await Offer.collection.insertMany(offers);
    }
  }

  console.log('Added ' + donorDocs.length + ' donors, ' + shelterDocs.length + ' verified shelters, 1 shelter waiting ' +
    'for verification, an admin, ' + pickups + ' past pickups and ' + expired + ' expired listings.');
  console.log('Donor login:   canteen@stxaviers.edu / canteen123');
  console.log('Shelter login: contact@snehsadan.org / shelter123');
  console.log('Admin login:   admin@foodloop.test / admin123');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Seed failed: ' + err.message);
  await mongoose.disconnect();
  process.exit(1);
});
