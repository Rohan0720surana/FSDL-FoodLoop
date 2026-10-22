const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing reference is required'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Recipient reference is required'],
    },
    score: {
      type: Number,
      required: [true, 'Matching score is required'],
    },
    rank: {
      type: Number,
      required: [true, 'Rank is required'],
    },
    // PENDING  waiting in line (or being asked, if active)
    // ACCEPTED the shelter is coming
    // PASSED   the shelter said no
    // LAPSED   the shelter did not reply in time, so it moved on
    // EXPIRED  someone else accepted, or the shelter can no longer make it
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PASSED', 'LAPSED', 'EXPIRED'],
      default: 'PENDING',
    },
    active: {
      type: Boolean,
      default: false,
    },
    // when this shelter started being asked (for the reply window)
    activeSince: {
      type: Date,
    },
    km: { type: Number },
    driveMinutes: { type: Number },
    breakdown: {
      time: { type: Number },
      proximity: { type: Number },
      capacity: { type: Number },
      foodType: { type: Number },
      reliability: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', OfferSchema);
