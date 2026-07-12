const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Subscription = require('../models/Subscription');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

// @desc    Get all users (customers)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password');
  res.json(users);
});

// @desc    Activate/deactivate a user account
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ _id: user._id, isActive: user.isActive });
});

// @desc    Get all providers (any approval status)
// @route   GET /api/admin/providers?status=pending
// @access  Private/Admin
const getAllProviders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.approvalStatus = req.query.status;
  const providers = await Provider.find(filter).populate('user', 'name email phone isActive');
  res.json(providers);
});

// @desc    Approve or reject a provider registration
// @route   PUT /api/admin/providers/:id/approval
// @access  Private/Admin
const updateProviderApproval = asyncHandler(async (req, res) => {
  const { approvalStatus } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(approvalStatus)) {
    res.status(400);
    throw new Error("approvalStatus must be 'approved' or 'rejected'");
  }
  const provider = await Provider.findById(req.params.id);
  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }
  provider.approvalStatus = approvalStatus;
  await provider.save();
  res.json(provider);
});

// @desc    Get all bookings/subscriptions across the platform
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Subscription.find()
    .populate('user', 'name email')
    .populate('provider', 'businessName')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Platform analytics summary
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
  const [totalUsers, totalProviders, pendingProviders, totalBookings, activeSubscriptions, revenueAgg] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Provider.countDocuments({ approvalStatus: 'approved' }),
      Provider.countDocuments({ approvalStatus: 'pending' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

  res.json({
    totalUsers,
    totalProviders,
    pendingProviders,
    totalBookings,
    activeSubscriptions,
    totalRevenue: revenueAgg[0]?.total || 0,
  });
});

// @desc    Moderate (hide/unhide) reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name')
    .populate('provider', 'businessName')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

module.exports = {
  getAllUsers,
  toggleUserStatus,
  getAllProviders,
  updateProviderApproval,
  getAllBookings,
  getReports,
  getAllReviews,
};
