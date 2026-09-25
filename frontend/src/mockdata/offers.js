// Mock data for the static, no-backend mockups (Friday first-round review).
// Shapes mirror the real Mongoose schemas so wiring up the API later is a drop-in swap.

import { donorOrgs, recipientOrgs } from "./orgs";
import { trip } from "../utils/geo";

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
      description: "Veg biryani + dal",
      foodType: "VEG",
      quantity: 48,
      quantityUnit: "MEALS",
      pickupDeadline: now + 134 * min,
      donorId: "d1",
      donorOrgName: "St. Xavier's College Canteen",
      donorLocality: "Dhobi Talao",
    },
    matchReason: "Close by · fits your capacity",
    subscores: { urgency: 0.82, proximity: 0.77, capacity: 0.95, typeMatch: 1.0, reliability: 0.71 },
    rank: 1,
  },
  {
    id: "off_2",
    listing: {
      description: "Irani bun-maska + pastries, closing-time surplus",
      foodType: "BAKERY",
      quantity: 30,
      quantityUnit: "MEALS",
      pickupDeadline: now + 42 * min,
      donorId: "d2",
      donorOrgName: "Yazdani Irani Bakery",
      donorLocality: "Fort",
    },
    matchReason: "Fits your capacity · accepted food type",
    subscores: { urgency: 0.6, proximity: 0.66, capacity: 0.75, typeMatch: 0.6, reliability: 0.7 },
    rank: 2,
  },
  {
    id: "off_3",
    listing: {
      description: "Paneer tikka trays, wedding function leftover",
      foodType: "VEG",
      quantity: 45,
      quantityUnit: "MEALS",
      pickupDeadline: now + 68 * min,
      donorId: "d3",
      donorOrgName: "Regency Banquet Hall",
      donorLocality: "Andheri West",
    },
    matchReason: "Very close · large batch, high urgency",
    subscores: { urgency: 0.31, proximity: 0.89, capacity: 0.4, typeMatch: 1.0, reliability: 0.9 },
    rank: 3,
  },
  {
    id: "off_4",
    listing: {
      description: "Assorted vegetable sandwiches, café closing surplus",
      foodType: "PACKAGED",
      quantity: 18,
      quantityUnit: "MEALS",
      pickupDeadline: now + 260 * min,
      donorId: "d5",
      donorOrgName: "Konkan Spice Caterers",
      donorLocality: "Powai",
    },
    matchReason: "Plenty of time · easy batch to plan around",
    subscores: { urgency: 0.92, proximity: 0.48, capacity: 0.85, typeMatch: 0.6, reliability: 0.75 },
    rank: 4,
  },
];

// Distances are worked out from the real coordinates of each kitchen and of
// Sneh Sadan Balgram (Dadar), the recipient whose inbox this is.
const me = recipientOrgs.find((r) => r.id === "r2");
for (const o of mockOffers) {
  const t = trip(donorOrgs.find((d) => d.id === o.listing.donorId), me);
  o.distanceKm = t.km;
  o.etaMin = t.min;
}

export const mockPlatformStats = {
  mealsRedistributed: 2847,
  mealsRedistributedDelta: 12,
  activeDonors: 34,
  activeRecipients: 51,
  avgTimeToMatchMin: 8.4,
};
