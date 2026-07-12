const mongoose = require('mongoose');
const crypto = require('crypto');

// Snapshot of the delivery address at the time of booking (kept even if the user's
// saved Address document changes later, so provider/order history stays accurate).
const deliveryAddressSnapshot = new mongoose.Schema(
  {
    fullName: String,
    mobileNumber: String,
    houseNumber: String,
    street: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    deliveryInstructions: String,
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: { type: String, unique: true, index: true }, // human-readable public ID, e.g. SUB-8F3K2A
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    planType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
    },
    customDurationDays: { type: Number }, // only used when planType === 'custom'
    mealTypes: [{ type: String, enum: ['breakfast', 'lunch', 'dinner'] }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'pending', 'active', 'paused', 'cancelled', 'completed', 'rejected'],
      default: 'pending_payment', // subscription is created first, then paid for, then provider accepts
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed'],
      default: 'unpaid',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    deliveryAddress: deliveryAddressSnapshot,
    pausedFrom: { type: Date },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate a short, human-readable subscription ID before first save
subscriptionSchema.pre('validate', function (next) {
  if (!this.subscriptionId) {
    this.subscriptionId = `SUB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
