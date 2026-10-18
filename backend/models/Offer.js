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
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PASSED', 'EXPIRED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', OfferSchema);
