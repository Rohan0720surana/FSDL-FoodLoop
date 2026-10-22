/**
 * ratings.js – average star ratings, worked out with a MongoDB aggregation.
 *
 * averageRatings('ratingOfFood', 'donor', [ids])
 *   → { "<donorId>": { average: 4.6, count: 12 }, ... }
 *   how shelters rated each kitchen's food
 *
 * averageRatings('ratingOfShelter', 'acceptedBy', [ids])
 *   → how kitchens rated each shelter's punctuality
 */

const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const averageRatings = async (ratingField, groupField, ids) => {
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await Listing.aggregate([
    { $match: { [groupField]: { $in: objectIds }, [ratingField + '.stars']: { $gte: 1 } } },
    { $group: { _id: '$' + groupField, average: { $avg: '$' + ratingField + '.stars' }, count: { $sum: 1 } } },
  ]);

  const result = {};
  rows.forEach((r) => {
    result[r._id.toString()] = { average: Math.round(r.average * 10) / 10, count: r.count };
  });
  return result;
};

module.exports = { averageRatings };
