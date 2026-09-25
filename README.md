# FoodLoop

Surplus food from Mumbai's kitchens, matched to the shelters and community kitchens that can
collect it before the pickup deadline.

Restaurants, canteens, hotels and banquet halls post what's left at closing time. FoodLoop scores
every nearby recipient organisation on five factors and sends one ranked offer at a time. If a
recipient passes, the offer cascades to the next one. The recipient's own staff collect the food.
There is no delivery rider.

| Factor | Weight |
|---|---|
| Time feasibility (can they arrive before the deadline?) | 35% |
| Proximity | 25% |
| Capacity fit | 20% |
| Food type | 10% |
| Reliability | 10% |

## Status

This is the first-round frontend: static React pages running on mock Mumbai data in
`frontend/src/mockdata/`. The Node/Express/MongoDB backend comes next.

Distances on the maps are estimates: straight-line distance × 1.3 for roads, at a time-of-day
city speed (`frontend/src/utils/geo.js`). Road routing and live traffic need a routing API and
belong to the backend phase.

## Pages

| Route | Page |
|---|---|
| `/` | Landing |
| `/login`, `/register`, `/register/details`, `/pending` | Account |
| `/donor` | Donor dashboard: tonight's listings and incoming pickups |
| `/donor/listings/new` | Post surplus food, with a live preview of who can take it |
| `/donor/map` | Who is coming to collect, and the handover code |
| `/donor/impact` | Monthly impact report |
| `/recipient` | Recipient dashboard: ranked offers and the current pickup |
| `/recipient/offers` | Offer inbox with score breakdowns |
| `/recipient/map` | Pickup route, Google Maps hand-off, live location |
| `/recipient/impact` | Meals received this month |
| `/admin/simulation` | Weighted-Greedy vs. baseline strategies |

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` produces a static site in `frontend/dist/`.

## Stack

React 19 + Vite, Bootstrap 5, React Router, Recharts, Leaflet with OpenStreetMap tiles.
