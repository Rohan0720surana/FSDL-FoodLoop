const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Donor reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    foodType: {
      type: String,
      enum: ['VEG', 'NON_VEG', 'BAKERY', 'PACKAGED'],
      required: [true, 'Food type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'MATCHED', 'COLLECTED', 'EXPIRED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', ListingSchema);
