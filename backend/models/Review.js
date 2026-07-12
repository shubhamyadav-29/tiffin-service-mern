const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }, // admin moderation
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, subscription: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
