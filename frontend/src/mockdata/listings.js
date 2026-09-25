// St. Xavier's College Canteen's own listings — Donor Dashboard (D01) and donor map.
// Every listing is collected from the canteen itself.

const now = Date.now();
const min = 60 * 1000;

export const myListings = [
  {
    id: "lst_1",
    description: "Veg biryani + dal, freshly prepared",
    foodType: "VEG",
    quantity: 48,
    quantityUnit: "MEALS",
    pickupAddress: "St. Xavier's College Canteen, Dhobi Talao",
    pickupDeadline: now + 134 * min,
    status: "OFFERED",
    offersDispatched: 1,
    heldBy: "Sneh Sadan Balgram",
  },
  {
    id: "lst_2",
    description: "Paneer tikka trays, college fest leftover",
    foodType: "VEG",
    quantity: 22,
    quantityUnit: "MEALS",
    pickupAddress: "St. Xavier's College Canteen, Dhobi Talao",
    pickupDeadline: now + 47 * min,
    status: "ACCEPTED",
    offersDispatched: 2,
    heldBy: "Sneh Sadan Balgram",
    handoverCode: "4827",
  },
  {
    id: "lst_3",
    description: "Chicken curry + rice, staff lunch surplus",
    foodType: "NON_VEG",
    quantity: 65,
    quantityUnit: "MEALS",
    pickupAddress: "St. Xavier's College Canteen, Dhobi Talao",
    pickupDeadline: now + 9 * min,
    status: "OFFERED",
    offersDispatched: 3,
    heldBy: "Kripa Foundation Food Bank",
  },
  {
    id: "lst_4",
    description: "Pav + buns, bakery counter surplus",
    foodType: "BAKERY",
    quantity: 18,
    quantityUnit: "MEALS",
    pickupAddress: "St. Xavier's College Canteen, Dhobi Talao",
    pickupDeadline: now + 220 * min,
    status: "RANKING",
    offersDispatched: 0,
    heldBy: null,
  },
];

export const donorStats = {
  activeListings: myListings.length,
  mealsThisMonth: 612,
  completionRate: 91,
};
