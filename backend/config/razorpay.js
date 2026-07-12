const Razorpay = require('razorpay');

// Razorpay client - Test Mode keys come from the dashboard (Settings > API Keys)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
