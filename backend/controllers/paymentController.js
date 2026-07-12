const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { generateAndUploadReceipt } = require('../utils/generateReceipt');
const { sendEmail, bookingConfirmationTemplate, paymentFailedTemplate } = require('../utils/sendEmail');

const generateReceiptNumber = () => `RCPT-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

// @desc    Create a Razorpay order for a subscription (also used to retry a failed payment)
// @route   POST /api/payments/create-order
// @access  Private/User
const createOrder = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.body;

  const subscription = await Subscription.findOne({ _id: subscriptionId, user: req.user._id });
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  if (subscription.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('This subscription is already paid for');
  }

  // Razorpay expects the amount in the smallest currency unit (paise for INR)
  const amountInPaise = Math.round(subscription.price * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `sub_${subscription.subscriptionId}`,
    notes: {
      subscriptionId: subscription.subscriptionId,
      userId: req.user._id.toString(),
    },
  });

  const payment = await Payment.create({
    user: req.user._id,
    subscription: subscription._id,
    razorpayOrderId: order.id,
    amount: subscription.price,
    currency: 'INR',
    status: 'created',
    receiptNumber: generateReceiptNumber(),
  });

  res.status(201).json({
    orderId: order.id,
    amount: amountInPaise,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment._id,
    subscription,
  });
});

// @desc    Verify a Razorpay payment signature after checkout succeeds, then activate the subscription
// @route   POST /api/payments/verify
// @access  Private/User
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification fields');
  }

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  // CRITICAL: never trust the frontend's claim that payment succeeded - always verify
  // the HMAC-SHA256 signature ourselves using the Razorpay key secret.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed';
    await payment.save();
    res.status(400);
    throw new Error('Payment verification failed. Please try again.');
  }

  // Signature is valid - fetch payment method details from Razorpay for our records
  let paymentMethod = 'unknown';
  try {
    const rpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    paymentMethod = rpPayment.method || 'unknown';
  } catch (e) {
    console.error('Could not fetch Razorpay payment method:', e.message);
  }

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paymentMethod = paymentMethod;
  payment.status = 'paid';
  payment.transactionDate = new Date();
  await payment.save();

  const subscription = await Subscription.findById(payment.subscription).populate('provider', 'businessName');
  subscription.paymentStatus = 'paid';
  subscription.status = 'pending'; // now awaiting the provider's accept/reject
  subscription.payment = payment._id;
  await subscription.save();

  // Generate a PDF receipt and upload it to S3 (non-blocking for the response if it fails)
  try {
    const receiptUrl = await generateAndUploadReceipt({
      receiptNumber: payment.receiptNumber,
      subscriptionId: subscription.subscriptionId,
      transactionDate: payment.transactionDate,
      customerName: req.user.name,
      providerName: subscription.provider.businessName,
      planType: subscription.planType,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      currency: payment.currency,
    });
    payment.receiptUrl = receiptUrl;
    await payment.save();
  } catch (e) {
    console.error('Receipt generation/upload failed:', e.message);
  }

  sendEmail({
    to: req.user.email,
    subject: 'TiffinHub - Subscription Confirmed',
    html: bookingConfirmationTemplate({
      userName: req.user.name,
      businessName: subscription.provider.businessName,
      planType: subscription.planType,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      price: payment.amount,
      address: subscription.deliveryAddress,
      receiptNumber: payment.receiptNumber,
    }),
  });

  res.json({ success: true, subscription, payment });
});

// @desc    Record a failed/abandoned payment attempt (called from the Razorpay checkout "failed" handler)
// @route   POST /api/payments/failure
// @access  Private/User
const recordPaymentFailure = asyncHandler(async (req, res) => {
  const { razorpay_order_id, reason } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id });
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  payment.status = 'failed';
  payment.failureReason = reason || 'Payment was not completed';
  await payment.save();

  const subscription = await Subscription.findById(payment.subscription).populate('provider', 'businessName');
  // subscription stays pending_payment / unpaid so the user can retry
  if (subscription) {
    subscription.paymentStatus = 'failed';
    await subscription.save();

    sendEmail({
      to: req.user.email,
      subject: 'TiffinHub - Payment Unsuccessful',
      html: paymentFailedTemplate({
        userName: req.user.name,
        businessName: subscription.provider?.businessName || 'the provider',
        amount: payment.amount,
      }),
    });
  }

  res.json({ success: true, payment });
});

// @desc    Get logged-in user's payment history
// @route   GET /api/payments/me
// @access  Private/User
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate({ path: 'subscription', populate: { path: 'provider', select: 'businessName' } })
    .sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = { createOrder, verifyPayment, recordPaymentFailure, getMyPayments };
