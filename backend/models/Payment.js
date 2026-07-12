const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String }, // set only after payment attempt
    razorpaySignature: { type: String },
    amount: { type: Number, required: true }, // in rupees (not paise)
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, default: '' }, // e.g. card, upi, netbanking - from Razorpay
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    receiptNumber: { type: String, required: true, unique: true },
    receiptUrl: { type: String, default: '' }, // S3 URL for the generated PDF receipt
    transactionDate: { type: Date },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
