/**
 * matching.js – FoodLoop matching-engine utilities
 *
 * distanceKm  – Haversine great-circle distance × 1.3 road-distance factor
 * matchScore  – Scores a (listing, recipient) pair; returns null if the
 *               recipient must be filtered out.
 */

const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 20; // used for driveMinutes estimate

// ── Haversine ────────────────────────────────────────────────────────────────

/**
 * Returns the estimated road distance in km between two lat/lng points,
 * rounded to one decimal place.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = EARTH_RADIUS_KM * c;

  return Math.round(straightLine * ROAD_FACTOR * 10) / 10;
};

// ── matchScore ───────────────────────────────────────────────────────────────

/**
 * Scores a listing against a single recipient organisation.
 *
 * @param {object} listing   – Mongoose Listing document (plain object ok)
 * @param {object} recipient – Mongoose Organisation document (plain object ok)
 * @param {number} [now]     – Unix timestamp in ms; defaults to Date.now()
 * @returns {{ score: number, km: number, driveMinutes: number,
 *             breakdown: { time, proximity, capacity, foodType, reliability } }
 *           | null}         – null means the recipient is filtered out
 */
const matchScore = (listing, recipient, now = Date.now()) => {
  // ── Hard filters ────────────────────────────────────────────────────────────

  // 1. Food type compatibility
  if (!recipient.foodTypesAccepted.includes(listing.foodType)) {
    return null;
  }

  // 2. Remaining capacity
  if (listing.quantity > recipient.remainingCapacityToday) {
    return null;
  }

  // 3. Service radius
  const km = distanceKm(
    listing._donorLat,
    listing._donorLng,
    recipient.lat,
    recipient.lng
  );
  if (km > recipient.serviceRadiusKm) {
    return null;
  }

  // 4. Time feasibility
  const driveMinutes = Math.round((km / AVG_SPEED_KMH) * 60);
  const minutesLeft = (new Date(listing.pickupDeadline).getTime() - now) / 60000;
  if (driveMinutes > minutesLeft) {
    return null;
  }

  // ── Sub-scores (clamped 0–1) ─────────────────────────────────────────────

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const sub = {
    time: clamp(1 - driveMinutes / minutesLeft),          // weight 0.35
    proximity: clamp(1 - km / recipient.serviceRadiusKm), // weight 0.25
    capacity: clamp(listing.quantity / recipient.remainingCapacityToday), // weight 0.20
    foodType: 1,                                           // weight 0.10
    reliability: clamp(recipient.reliabilityScore),        // weight 0.10
  };

  const weightedSum =
    sub.time * 0.35 +
    sub.proximity * 0.25 +
    sub.capacity * 0.20 +
    sub.foodType * 0.10 +
    sub.reliability * 0.10;

  const score = Math.round(100 * weightedSum);

  const breakdown = {
    time: Math.round(sub.time * 100) / 100,
    proximity: Math.round(sub.proximity * 100) / 100,
    capacity: Math.round(sub.capacity * 100) / 100,
    foodType: Math.round(sub.foodType * 100) / 100,
    reliability: Math.round(sub.reliability * 100) / 100,
  };

  return { score, km, driveMinutes, breakdown };
};

module.exports = { distanceKm, matchScore };
