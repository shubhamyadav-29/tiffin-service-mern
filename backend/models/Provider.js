const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    foodType: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Jain', 'Veg & Non-Veg'],
      required: true,
    },
    deliveryAreas: [{ type: String }],
    address: {
      street: String,
      area: String,
      city: String,
      pincode: String,
    },
    contactNumber: { type: String, required: true },
    profileImage: { type: String, default: '' },
    galleryImages: [{ type: String }],
    pricing: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
    },
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

providerSchema.index({ 'address.city': 1, foodType: 1 });

module.exports = mongoose.model('Provider', providerSchema);
