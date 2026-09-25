// Simulation & Evaluation module (A05/A06) — comparative results across matching strategies

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
