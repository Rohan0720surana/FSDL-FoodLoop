const mongoose = require('mongoose');

const OrganisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['DONOR', 'RECIPIENT'],
      required: [true, 'Organisation type is required'],
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
    foodTypesAccepted: {
      type: [String],
      default: [],
    },
    capacityPerDay: {
      type: Number,
      default: 0,
    },
    remainingCapacityToday: {
      type: Number,
      default: 0,
    },
    serviceRadiusKm: {
      type: Number,
      default: 15,
    },
    reliabilityScore: {
      type: Number,
      default: 0.5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organisation', OrganisationSchema);
