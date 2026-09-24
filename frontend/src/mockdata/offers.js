// Mock data for the static, no-backend mockups (Friday first-round review).
// Shapes mirror the real Mongoose schemas so wiring up the API later is a drop-in swap.

const now = Date.now();
const min = 60 * 1000;

export const foodTypeMeta = {
  VEG: { label: "Veg", icon: "bi-egg-fill" },
  NON_VEG: { label: "Non-veg", icon: "bi-egg-fried" },
  VEGAN: { label: "Vegan", icon: "bi-flower1" },
  BAKERY: { label: "Bakery", icon: "bi-cup-hot" },
  PACKAGED: { label: "Packaged", icon: "bi-box-seam" },
};

export function urgencyFromDeadline(deadlineMs) {
  const minsLeft = (deadlineMs - Date.now()) / min;
  if (minsLeft < 15) return "critical";
  if (minsLeft < 60) return "urgent";
  if (minsLeft < 180) return "moderate";
  return "ample";
}

export const mockOffers = [
  {
    id: "off_1",
    listing: {
      description: "Vegetable biryani + dal",
      foodType: "VEG",
      quantity: 48,
      quantityUnit: "MEALS",
      pickupDeadline: now + 134 * min,
      donorOrgName: "St. Xavier's College Canteen",
    },
    distanceKm: 2.3,
    matchReason: "Close by · fits your capacity",
    subscores: { urgency: 0.82, proximity: 0.77, capacity: 0.95, typeMatch: 1.0, reliability: 0.71 },
    rank: 1,
  },
  {
    id: "off_2",
    listing: {
      description: "Assorted bakery surplus — bread, pastries",
      foodType: "BAKERY",
      quantity: 30,
      quantityUnit: "MEALS",
      pickupDeadline: now + 42 * min,
      donorOrgName: "Blue Oven Bakery",
    },
    distanceKm: 4.1,
    matchReason: "Fits your capacity · accepted food type",
    subscores: { urgency: 0.51, proximity: 0.59, capacity: 0.7, typeMatch: 0.6, reliability: 0.68 },
    rank: 2,
  },
  {
    id: "off_3",
    listing: {
      description: "Wedding catering surplus — mixed veg thali",
      foodType: "VEG",
      quantity: 120,
      quantityUnit: "MEALS",
      pickupDeadline: now + 11 * min,
      donorOrgName: "Grand Regency Banquets",
    },
    distanceKm: 1.1,
    matchReason: "Very close · large batch, high urgency",
    subscores: { urgency: 0.31, proximity: 0.89, capacity: 0.4, typeMatch: 1.0, reliability: 0.9 },
    rank: 3,
  },
];

export const mockPlatformStats = {
  mealsRedistributed: 2847,
  mealsRedistributedDelta: 12,
  activeDonors: 34,
  activeRecipients: 51,
  avgTimeToMatchMin: 8.4,
};

export const simulationStrategies = ["BROADCAST", "NEAREST", "WEIGHTED_GREEDY", "HUNGARIAN_OPTIMAL"];

export const strategyLabels = {
  BROADCAST: "Broadcast",
  NEAREST: "Nearest-neighbour",
  WEIGHTED_GREEDY: "Weighted-Greedy (proposed)",
  HUNGARIAN_OPTIMAL: "Hungarian-Optimal",
};

export const mockSimulationResults = [
  { strategy: "BROADCAST", redistributionRate: 54.2, expiryWasteRate: 45.8, avgPickupDistanceKm: 6.7, avgTimeToMatchSec: 612, rank1AcceptanceRate: 38.1, executionTimeMs: 4 },
  { strategy: "NEAREST", redistributionRate: 68.9, expiryWasteRate: 31.1, avgPickupDistanceKm: 3.1, avgTimeToMatchSec: 401, rank1AcceptanceRate: 55.4, executionTimeMs: 9 },
  { strategy: "WEIGHTED_GREEDY", redistributionRate: 84.6, expiryWasteRate: 15.4, avgPickupDistanceKm: 3.6, avgTimeToMatchSec: 247, rank1AcceptanceRate: 71.2, executionTimeMs: 12 },
  { strategy: "HUNGARIAN_OPTIMAL", redistributionRate: 89.3, expiryWasteRate: 10.7, avgPickupDistanceKm: 3.9, avgTimeToMatchSec: 198, rank1AcceptanceRate: 76.5, executionTimeMs: 1840 },
];

export const mockTimeToMatchHistogram = [
  { bucket: "0-2m", BROADCAST: 3, NEAREST: 6, WEIGHTED_GREEDY: 14, HUNGARIAN_OPTIMAL: 18 },
  { bucket: "2-5m", BROADCAST: 9, NEAREST: 18, WEIGHTED_GREEDY: 31, HUNGARIAN_OPTIMAL: 34 },
  { bucket: "5-10m", BROADCAST: 21, NEAREST: 29, WEIGHTED_GREEDY: 28, HUNGARIAN_OPTIMAL: 26 },
  { bucket: "10-20m", BROADCAST: 34, NEAREST: 27, WEIGHTED_GREEDY: 17, HUNGARIAN_OPTIMAL: 14 },
  { bucket: ">20m", BROADCAST: 33, NEAREST: 20, WEIGHTED_GREEDY: 10, HUNGARIAN_OPTIMAL: 8 },
];
