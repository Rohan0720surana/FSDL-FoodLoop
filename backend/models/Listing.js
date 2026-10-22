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
      min: [1, 'Quantity must be at least 1'],
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
    },
    // OPEN → MATCHED (offer sent) → ACCEPTED (a shelter is coming) → COLLECTED
    // or EXPIRED when nobody can take it before the deadline
    status: {
      type: String,
      enum: ['OPEN', 'MATCHED', 'ACCEPTED', 'COLLECTED', 'EXPIRED'],
      default: 'OPEN',
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      default: null,
    },
    // 4-digit code the shelter shows at the kitchen; hidden from the donor
    handoverCode: {
      type: String,
      select: false,
    },
    // after the pickup each side rates the other (1 to 5 stars, once)
    ratingOfShelter: {            // given by the donor: did the shelter come on time?
      stars: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 200 },
      at: { type: Date },
    },
    ratingOfFood: {               // given by the shelter: was the food fresh and as described?
      stars: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 200 },
      at: { type: Date },
    },
    matchedAt: { type: Date },
    acceptedAt: { type: Date },
    collectedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', ListingSchema);
