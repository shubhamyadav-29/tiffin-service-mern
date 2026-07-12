const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Subscription = require('../models/Subscription');
const Provider = require('../models/Provider');

// Recalculates a provider's avgRating & numReviews from all visible reviews
const recalcProviderRating = async (providerId) => {
  const stats = await Review.aggregate([
    { $match: { provider: providerId, isHidden: false } },
    { $group: { _id: '$provider', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
  ]);

  await Provider.findByIdAndUpdate(providerId, {
    avgRating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    numReviews: stats[0] ? stats[0].numReviews : 0,
  });
};

// @desc    Get all (visible) reviews for a provider
// @route   GET /api/reviews/:providerId
// @access  Public
const getProviderReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ provider: req.params.providerId, isHidden: false })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Add a review after a completed subscription
// @route   POST /api/reviews
// @access  Private/User
const createReview = asyncHandler(async (req, res) => {
  const { subscriptionId, rating, comment } = req.body;

  const subscription = await Subscription.findOne({ _id: subscriptionId, user: req.user._id });
  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }
  if (!['completed', 'cancelled', 'active'].includes(subscription.status)) {
    res.status(400);
    throw new Error('You can only review after your order has started');
  }
  if (subscription.isReviewed) {
    res.status(400);
    throw new Error('This subscription has already been reviewed');
  }

  const review = await Review.create({
    user: req.user._id,
    provider: subscription.provider,
    subscription: subscription._id,
    rating,
    comment,
  });

  subscription.isReviewed = true;
  await subscription.save();

  await recalcProviderRating(subscription.provider);

  res.status(201).json(review);
});

// @desc    Admin: hide/unhide a review
// @route   PUT /api/reviews/:id/moderate
// @access  Private/Admin
const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  review.isHidden = req.body.isHidden;
  await review.save();
  await recalcProviderRating(review.provider);
  res.json(review);
});

module.exports = { getProviderReviews, createReview, moderateReview };
