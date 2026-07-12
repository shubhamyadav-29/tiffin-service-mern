const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');
const Provider = require('../models/Provider');
const Address = require('../models/Address');

const PLAN_DAYS = { daily: 1, weekly: 7, monthly: 30 };

// @desc    Create a subscription in "pending_payment" state (before Razorpay checkout)
// @route   POST /api/subscriptions
// @access  Private/User
const createSubscription = asyncHandler(async (req, res) => {
  const { providerId, planType, mealTypes, startDate, customDurationDays } = req.body;

  const provider = await Provider.findById(providerId);
  if (!provider || provider.approvalStatus !== 'approved') {
    res.status(404);
    throw new Error('Provider not available for booking');
  }

  // The user must have a saved delivery address before subscribing
  const savedAddress = await Address.findOne({ user: req.user._id });
  if (!savedAddress) {
    res.status(400);
    throw new Error('Please add a delivery address before subscribing');
  }

  let price;
  let durationDays;

  if (planType === 'custom') {
    durationDays = Number(customDurationDays);
    if (!durationDays || durationDays < 1) {
      res.status(400);
      throw new Error('Please provide a valid number of days for a custom plan');
    }
    // Custom plans are priced off the provider's daily rate
    if (!provider.pricing.daily) {
      res.status(400);
      throw new Error('This provider does not support custom plans');
    }
    price = provider.pricing.daily * durationDays;
  } else {
    price = provider.pricing[planType];
    durationDays = PLAN_DAYS[planType];
    if (!price || !durationDays) {
      res.status(400);
      throw new Error('Invalid plan type for this provider');
    }
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);

  const subscription = await Subscription.create({
    user: req.user._id,
    provider: provider._id,
    planType,
    customDurationDays: planType === 'custom' ? durationDays : undefined,
    mealTypes: mealTypes && mealTypes.length ? mealTypes : ['lunch'],
    startDate: start,
    endDate: end,
    price,
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    deliveryAddress: {
      fullName: savedAddress.fullName,
      mobileNumber: savedAddress.mobileNumber,
      houseNumber: savedAddress.houseNumber,
      street: savedAddress.street,
      area: savedAddress.area,
      city: savedAddress.city,
      state: savedAddress.state,
      pincode: savedAddress.pincode,
      landmark: savedAddress.landmark,
      deliveryInstructions: savedAddress.deliveryInstructions,
    },
  });

  res.status(201).json(subscription);
});

// @desc    Get logged-in user's subscriptions (booking history)
// @route   GET /api/subscriptions/me
// @access  Private/User
const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id })
    .populate('provider', 'businessName profileImage address avgRating')
    .populate('payment')
    .sort({ createdAt: -1 });
  res.json(subscriptions);
});

// @desc    Get a single subscription (for the review/payment pages)
// @route   GET /api/subscriptions/:id
// @access  Private/User
const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id })
    .populate('provider', 'businessName profileImage address contactNumber')
    .populate('payment');
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  res.json(subscription);
});

// @desc    Pause a subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private/User
const pauseSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  if (subscription.status !== 'active') {
    res.status(400);
    throw new Error('Only active subscriptions can be paused');
  }
  subscription.status = 'paused';
  subscription.pausedFrom = new Date();
  await subscription.save();
  res.json(subscription);
});

// @desc    Resume a paused subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private/User
const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  if (subscription.status !== 'paused') {
    res.status(400);
    throw new Error('Only paused subscriptions can be resumed');
  }

  if (subscription.pausedFrom) {
    const pausedMs = Date.now() - new Date(subscription.pausedFrom).getTime();
    subscription.endDate = new Date(new Date(subscription.endDate).getTime() + pausedMs);
    subscription.pausedFrom = undefined;
  }

  subscription.status = 'active';
  await subscription.save();
  res.json(subscription);
});

// @desc    Cancel a subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private/User
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  if (['cancelled', 'completed'].includes(subscription.status)) {
    res.status(400);
    throw new Error('Subscription is already cancelled or completed');
  }
  subscription.status = 'cancelled';
  await subscription.save();
  res.json(subscription);
});

module.exports = {
  createSubscription,
  getMySubscriptions,
  getSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
};
