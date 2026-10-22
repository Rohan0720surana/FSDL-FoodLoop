# FoodLoop

Surplus food from Mumbai's kitchens, matched to the shelters and community kitchens that can collect it before the pickup deadline.

Restaurants, canteens, hotels and banquet halls post what is left at closing time. FoodLoop scores every verified shelter on five factors and asks **one shelter at a time**, best first. The shelter has 10 minutes to reply. If it passes or does not reply, the remaining shelters are scored again with the time left and the best one is asked next. The shelter that accepts gets a 4-digit handover code; its own staff collect the food and the kitchen types the code in to confirm.

Full Stack Development Lab mini project · Rohan Surana, Ayman Shaikh

## Features

- **Separate registration** for donors (kitchen type, FSSAI licence) and recipients (food accepted, meals per day, travel radius); each field is checked as soon as you leave it
- **Ranked matching** on five factors, one shelter asked at a time, 10-minute reply window, re-scoring after every pass or missed reply
- **Handover code**: the shelter shows a 4-digit code, the kitchen types it in to confirm the pickup; printable pickup slip
- **Pickup timeline** for every listing: posted → asked → passed / no reply → accepted → collected
- **Admin verification**: new shelters get no food until an admin checks and verifies them (or turns them down with a reason)
- **Two-way ratings**: kitchens rate shelters' punctuality, shelters rate the food; ratings feed the reliability score
- **Surplus prediction**: "On Fridays you usually post about 55 meals around 7 pm", from the donor's own history
- **Impact page**: meals collected per day, food type split, collected vs expired, top kitchens and shelters (MongoDB aggregation)
- **Live map** of verified shelters, their travel radius and room left today

## Tech stack

| Layer    | Tools |
| -------- | ----- |
| Frontend | HTML, CSS, JavaScript (no framework), Leaflet + OpenStreetMap for the map |
| Backend  | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Login    | JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcryptjs` |
| Other    | `cors`, `dotenv`, `nodemon` (development) |

## How matching works

When a donor posts food, every verified shelter is first checked against four rules: it accepts that food type, it has room left today, the kitchen is inside its travel radius, and it can drive there before the deadline. The rest are scored out of 100:

| Factor   | Weight | How it is measured (0 to 1) |
| -------- | ------ | --------------------------- |
| Time     | 35%    | 1 − drive time ÷ time left |
| Distance | 25%    | 1 − distance ÷ the shelter's travel radius |
| Capacity | 20%    | meals ÷ room the shelter has left today |
| Food type | 10%   | 1 (it passed the food-type rule) |
| Reliability | 10% | the shelter's pickup record (goes up each time it collects) |

Distance is the straight-line (Haversine) distance × 1.3 for roads; drive time assumes 20 km/h. The code is in `backend/utils/matching.js` and `backend/utils/cascade.js`.

## Folder structure

```
FoodLoop-Basic/
├── index.html                  home page with live numbers from the database
├── register.html               choose donor or recipient
├── register-donor.html         donor registration form
├── register-recipient.html     recipient registration form
├── login.html
├── donor.html, donor.js        post food, see who it was offered to, confirm pickup
├── recipient.html, recipient.js  accept / pass offers, pickups with handover code
├── map.html                    verified shelters on a Leaflet map
├── impact.html                 meals saved, charts, top kitchens and shelters
├── admin.html, admin.js        verify or turn down new shelters
├── api.js                      server address, saved login, apiFetch()
├── areas.js                    Mumbai areas with their coordinates (register forms)
├── geo.js                      distance and drive time (map page)
├── register.js                 shared code for both register forms
├── style.css
├── images/
└── backend/
    ├── server.js               Express app, routes, serves the pages
    ├── config/db.js            MongoDB connection
    ├── models/                 Organisation, Listing, Offer
    ├── controllers/            auth, listing, offer, organisation, stats, admin
    ├── routes/
    ├── middleware/             protect (JWT check) and onlyFor (donor / recipient)
    ├── utils/                  matching, cascade (pass / lapse / expiry), capacity, ratings
    └── scripts/                seed, verifyOrganisation, makeToken
```

## Run it on your computer

You need Node.js and MongoDB Community Server running on the default port 27017.

```bash
cd backend
npm install
cp .env.example .env        # then put your own long random JWT_SECRET in .env
npm run seed                # loads the demo organisations and past pickups
npm run dev                 # or: npm start
```

Make a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Never commit `.env`.

Open **http://localhost:5000** (not the HTML file directly — the server serves the pages and the API together).

## Demo accounts (created by `npm run seed`)

| Organisation | Email | Password | Role |
| ------------ | ----- | -------- | ---- |
| St. Xavier's College Canteen, Dhobi Talao | canteen@stxaviers.edu | canteen123 | Donor |
| Regency Banquet Hall, Andheri West | banquet@regency.test | regency123 | Donor |
| Sneh Sadan Balgram, Dadar | contact@snehsadan.org | shelter123 | Recipient |
| FoodLoop Admin | admin@foodloop.test | admin123 | Admin (verifies shelters) |
| Asha Deep Night Shelter, Bandra East | ashadeep@shelters.test | shelter123 | Recipient |
| Kripa Foundation Food Bank, BKC | kripa@shelters.test | shelter123 | Recipient |
| Seva Sadan Community Kitchen, Kurla | sevasadan@shelters.test | shelter123 | Recipient |
| Prakash Old Age Home, Chembur (veg only) | prakash@shelters.test | shelter123 | Recipient |

To test a donor and a shelter side by side, use a normal window and a private window (the login is saved in the browser).

`npm run seed -- --reset` deletes everything and loads the demo data again.

## Verifying a new shelter

Shelters that register on the website start **unverified** and get no offers until an admin checks them on **admin.html** (log in as the admin). The same can be done from the command line:

```bash
npm run verify                        # list shelters waiting
npm run verify -- contact@shelter.org # verify one
```

## API

All routes start with `/api`. "Donor" / "Recipient" routes need `Authorization: Bearer <token>` from that kind of account.

| Method and path | Who | What it does |
| --------------- | --- | ------------ |
| POST /auth/register | anyone | register a donor or recipient (separate fields for each) |
| POST /auth/login | anyone | log in, returns a token |
| GET /organisations | anyone | verified shelters for the map (no emails or phone numbers) |
| GET / PUT / DELETE /organisations/me | logged in | your own account |
| GET /stats | anyone | live numbers for the home page |
| GET /stats/impact | anyone | charts and top lists for the impact page (aggregation) |
| GET /admin/organisations | admin | every organisation with listing / pickup counts |
| POST /admin/organisations/:id/verify | admin | shelter starts getting offers |
| POST /admin/organisations/:id/reject | admin | turn a shelter down with a reason |
| GET /listings/insights | donor | when this kitchen usually has surplus (aggregation by weekday) |
| POST /listings/:id/rate | donor (owner) | rate the shelter's punctuality after the pickup |
| POST /offers/pickups/:listingId/rate | recipient | rate the food after collecting it |
| POST /listings | donor | post surplus food |
| GET /listings/mine | donor | my listings, with who is being asked now |
| POST /listings/:id/match | donor (owner) | rank shelters and ask the best one |
| GET /listings/:id/offers | donor (owner) | everyone asked so far, by rank |
| POST /listings/:id/collect | donor (owner) | confirm pickup with the shelter's 4-digit code |
| GET / PUT / DELETE /listings/:id | donor (owner) | read, edit (before matching), cancel (before acceptance) |
| GET /offers/mine | recipient | offers waiting for my reply, with the reply deadline |
| GET /offers/pickups | recipient | food I accepted, with the handover code |
| POST /offers/:id/accept | recipient | take the food (checks room left today) |
| POST /offers/:id/pass | recipient | decline; re-scores and asks the next shelter |
