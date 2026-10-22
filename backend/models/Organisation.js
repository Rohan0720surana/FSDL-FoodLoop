const mongoose = require('mongoose');

const FOOD_TYPES = ['VEG', 'NON_VEG', 'BAKERY', 'PACKAGED'];

const OrganisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['DONOR', 'RECIPIENT', 'ADMIN'],   // ADMIN accounts are only created by the seed script
      required: [true, 'Organisation type is required'],
    },
    // what kind of organisation, e.g. "College canteen" or "Old-age home"
    category: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never returned in queries unless explicitly asked
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
    },

    // ── donor only ──
    fssaiLicence: {
      type: String,
      trim: true,
      default: '',
    },

    // ── recipient only ──
    foodTypesAccepted: {
      type: [{ type: String, enum: FOOD_TYPES }],
      default: [],
    },
    capacityPerDay: {
      type: Number,
      default: 0,
      min: [0, 'Capacity cannot be negative'],
    },
    remainingCapacityToday: {
      type: Number,
      default: 0,
      min: [0, 'Remaining capacity cannot be negative'],
    },
    // the day remainingCapacityToday was last reset, as "YYYY-MM-DD"
    capacityResetOn: {
      type: String,
      default: '',
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
    },
    reliabilityScore: {
      type: Number,
      default: 0.5,
    },
    // only verified recipients receive offers; set by FoodLoop, never by the user
    verified: {
      type: Boolean,
      default: false,
    },
    // set by an admin who checked the shelter and turned it down
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

OrganisationSchema.statics.FOOD_TYPES = FOOD_TYPES;

module.exports = mongoose.model('Organisation', OrganisationSchema);
