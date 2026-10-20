# FoodLoop

Surplus food from Mumbai's kitchens, matched to the shelters and community kitchens that can collect it before the pickup deadline.

Restaurants, canteens, hotels and banquet halls post what's left at closing time. FoodLoop scores every nearby recipient organisation on five factors and sends **one ranked offer at a time**. If a recipient passes, the offer cascades to the next one. The recipient's own staff collect the food, so there is no delivery rider.

Built as the mini project for the Full Stack Development Lab (MERN stack).

---

## How matching works

When a donor posts a listing, every eligible recipient is scored:

| Factor                                                  | Weight |
| ------------------------------------------------------- | ------ |
| Time feasibility (can they arrive before the deadline?) | 35%    |
| Proximity                                               | 25%    |
| Capacity fit                                            | 20%    |
| Food type                                               | 10%    |
| Reliability                                             | 10%    |

The highest-scoring recipient gets the offer first. If they **pass** (or the offer lapses), it cascades to the next recipient in ranked order. If they **accept**, the listing is assigned and the donor sees who is coming to collect.

## Features

- Donor and recipient registration and login with JWT authentication
- Donors post, view and manage surplus food listings
- Weighted matching engine that ranks recipient organisations per listing
- Offer accept / pass cascade
- Recipient dashboard with ranked offers and score breakdowns
- Map view of live shelters (Leaflet + OpenStreetMap)
- Frontend served directly from the Express server

## Tech stack

| Layer    | Tools                                                    |
| -------- | -------------------------------------------------------- |
| Frontend | HTML, CSS, JavaScript, Leaflet, OpenStreetMap            |
| Backend  | Node.js, Express.js                                      |
| Database | MongoDB with Mongoose                                    |
| Auth     | JSON Web Tokens (`jsonwebtoken`), password hashing with `bcryptjs` |
| Other    | `cors`, `dotenv`, `nodemon` (dev)                        |

## Project structure

```
FSDL-FoodLoop/
├── backend/
│   ├── server.js            # Express app, middleware, static serving
│   ├── config/db.js         # MongoDB connection
│   ├── routes/              # auth, organisations, listings, offers
│   └── package.json
├── frontend/                # donor, recipient, login, register and map pages
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Install

```bash
git clone https://github.com/Rohan0720surana/FSDL-FoodLoop.git
cd FSDL-FoodLoop/backend
npm install
```

### 2. Configure environment

Create a `.env` file inside `backend/`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodloop
JWT_SECRET=replace_with_a_long_random_string
```

### 3. Run

```bash
npm run dev     # development, auto-restarts with nodemon
# or
npm start       # production
```

Open http://localhost:5000. The Express server serves the frontend pages and the API from the same origin.

## API overview

All API routes are under `/api`.

| Prefix               | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `GET /api/health`    | Health check, returns `{ "status": "ok" }`           |
| `/api/auth`          | Register and log in (returns a JWT)                  |
| `/api/organisations` | Organisation CRUD (donors and recipients)            |
| `/api/listings`      | Listing CRUD and matching                            |
| `/api/offers`        | Recipient accept / pass on an offer                  |

Protected routes expect an `Authorization: Bearer <token>` header. Unknown routes return a JSON 404, and malformed JSON returns a 400 with a clear message.

## Security notes

- Passwords are hashed with bcrypt before storage.
- The server blocks requests to `/backend` and to any dotfile path (such as `.env` or `.git`) when serving static files.
- Keep `.env` out of version control.

## Status and limitations

- Distances on the map are estimates (straight-line distance x 1.3 for roads, at a time-of-day city speed), not live routing or traffic.
- Seed and demo data are for Mumbai.
- No payment, delivery or notification services are included.

## Future work

- Real road routing and live traffic via a routing API
- Push or SMS notifications for new offers
- Donor and recipient impact reports

## Team

- Ayman Shaikh · [GitHub](https://github.com/aymanchamp-sudo)
- Rohan Surana · [GitHub](https://github.com/Rohan0720surana)
