const Listing = require('../models/Listing');
const Organisation = require('../models/Organisation');
const { housekeeping } = require('../utils/cascade');

// Assumption shown on the impact page: one meal is about 400 g of food.
const KG_PER_MEAL = 0.4;
const TIMEZONE = 'Asia/Kolkata';

// ── GET /api/stats ─────────────────────────────────────────────────────────────
// Public. Live numbers for the home page, counted from the database.
const getStats = async (req, res) => {
  try {
    await housekeeping();

    const [collected, shelters, donors, listingsPosted, expired, accepted] = await Promise.all([
      Listing.find({ status: 'COLLECTED' }).select('quantity').lean(),
      Organisation.countDocuments({ type: 'RECIPIENT', verified: true }),
      Organisation.countDocuments({ type: 'DONOR' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'EXPIRED' }),
      Listing.find({ acceptedAt: { $ne: null } }).select('createdAt acceptedAt').lean(),
    ]);

    let mealsCollected = 0;
    collected.forEach((l) => { mealsCollected += l.quantity; });

    // average minutes from posting the food to a shelter accepting it
    let averageMinutesToAccept = null;
    if (accepted.length > 0) {
      let total = 0;
      accepted.forEach((l) => { total += (new Date(l.acceptedAt) - new Date(l.createdAt)) / 60000; });
      averageMinutesToAccept = Math.round((total / accepted.length) * 10) / 10;
    }

    // of the listings that are finished, how many were collected
    const finished = collected.length + expired;
    const collectionRate = finished > 0 ? Math.round((collected.length / finished) * 100) : null;

    res.status(200).json({
      mealsCollected,
      pickupsCompleted: collected.length,
      listingsPosted,
      shelters,
      donors,
      averageMinutesToAccept,
      collectionRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/stats/impact ──────────────────────────────────────────────────────
// Public. Everything on the impact page, built with MongoDB aggregation pipelines.
const getImpact = async (req, res) => {
  try {
    await housekeeping();

    const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);

    const [daily, byFoodType, outcomes, topDonors, topShelters, totals] = await Promise.all([
      // meals collected on each of the last 14 days
      Listing.aggregate([
        { $match: { status: 'COLLECTED', collectedAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt', timezone: TIMEZONE } },
          meals: { $sum: '$quantity' },
          pickups: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
      ]),

      // meals collected by food type
      Listing.aggregate([
        { $match: { status: 'COLLECTED' } },
        { $group: { _id: '$foodType', meals: { $sum: '$quantity' }, pickups: { $sum: 1 } } },
        { $sort: { meals: -1 } },
      ]),

      // how every finished listing ended
      Listing.aggregate([
        { $match: { status: { $in: ['COLLECTED', 'EXPIRED'] } } },
        { $group: { _id: '$status', count: { $sum: 1 }, meals: { $sum: '$quantity' } } },
      ]),

      // kitchens that gave the most food, with their name from the organisations collection
      Listing.aggregate([
        { $match: { status: 'COLLECTED' } },
        { $group: { _id: '$donor', meals: { $sum: '$quantity' }, pickups: { $sum: 1 }, rating: { $avg: '$ratingOfFood.stars' } } },
        { $sort: { meals: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'organisations', localField: '_id', foreignField: '_id', as: 'org' } },
        { $unwind: '$org' },
        { $project: { _id: 0, name: '$org.name', locality: '$org.locality', meals: 1, pickups: 1, rating: 1 } },
      ]),

      // shelters that collected the most food
      Listing.aggregate([
        { $match: { status: 'COLLECTED' } },
        { $group: { _id: '$acceptedBy', meals: { $sum: '$quantity' }, pickups: { $sum: 1 }, rating: { $avg: '$ratingOfShelter.stars' } } },
        { $sort: { meals: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'organisations', localField: '_id', foreignField: '_id', as: 'org' } },
        { $unwind: '$org' },
        { $project: { _id: 0, name: '$org.name', locality: '$org.locality', meals: 1, pickups: 1, rating: 1 } },
      ]),

      // all-time totals
      Listing.aggregate([
        { $match: { status: 'COLLECTED' } },
        { $group: { _id: null, meals: { $sum: '$quantity' }, pickups: { $sum: 1 } } },
      ]),
    ]);

    // fill in days with no pickups so the chart has all 14 days
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const row = daily.find((r) => r._id === key);
      days.push({ date: key, meals: row ? row.meals : 0, pickups: row ? row.pickups : 0 });
    }

    const collected = outcomes.find((o) => o._id === 'COLLECTED') || { count: 0, meals: 0 };
    const expired = outcomes.find((o) => o._id === 'EXPIRED') || { count: 0, meals: 0 };
    const total = totals[0] || { meals: 0, pickups: 0 };
    const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

    res.status(200).json({
      kgPerMeal: KG_PER_MEAL,
      totalMeals: total.meals,
      totalPickups: total.pickups,
      foodSavedKg: Math.round(total.meals * KG_PER_MEAL),
      collected: { listings: collected.count, meals: collected.meals },
      expired: { listings: expired.count, meals: expired.meals },
      collectionRate: collected.count + expired.count > 0
        ? Math.round((collected.count / (collected.count + expired.count)) * 100) : null,
      daily: days,
      byFoodType: byFoodType.map((r) => ({ foodType: r._id, meals: r.meals, pickups: r.pickups })),
      topDonors: topDonors.map((r) => ({ ...r, rating: round1(r.rating) })),
      topShelters: topShelters.map((r) => ({ ...r, rating: round1(r.rating) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getImpact };
