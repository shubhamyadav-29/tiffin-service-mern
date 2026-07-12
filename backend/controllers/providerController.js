const asyncHandler = require('express-async-handler');
const Provider = require('../models/Provider');
const Menu = require('../models/Menu');
const Subscription = require('../models/Subscription');

// @desc    Get all approved & active providers (public browse) with search/filter
// @route   GET /api/providers?city=&foodType=&minPrice=&maxPrice=&minRating=
// @access  Public
const getProviders = asyncHandler(async (req, res) => {
  const { city, foodType, minPrice, maxPrice, minRating, search } = req.query;

  const filter = { approvalStatus: 'approved', isActive: true };

  if (city) filter['address.city'] = new RegExp(city, 'i');
  if (foodType) filter.foodType = foodType;
  if (minRating) filter.avgRating = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    filter['pricing.monthly'] = {};
    if (minPrice) filter['pricing.monthly'].$gte = Number(minPrice);
    if (maxPrice) filter['pricing.monthly'].$lte = Number(maxPrice);
  }
  if (search) filter.businessName = new RegExp(search, 'i');

  const providers = await Provider.find(filter).sort({ avgRating: -1 });
  res.json(providers);
});

// @desc    Get single provider detail (with weekly menu)
// @route   GET /api/providers/:id
// @access  Public
const getProviderById = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('user', 'name email');
  if (!provider) {
    res.status(404);
    throw new Error('Provider not found');
  }
  const menus = await Menu.find({ provider: provider._id });
  res.json({ provider, menus });
});

// @desc    Get logged-in provider's own profile
// @route   GET /api/providers/me/profile
// @access  Private/Provider
const getMyProviderProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }
  res.json(provider);
});

// @desc    Update provider business profile
// @route   PUT /api/providers/me/profile
// @access  Private/Provider
const updateMyProviderProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }

  const fields = ['businessName', 'description', 'foodType', 'deliveryAreas', 'address', 'contactNumber', 'pricing'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) provider[field] = req.body[field];
  });

  const updated = await provider.save();
  res.json(updated);
});

// @desc    Upload/replace provider profile image
// @route   PUT /api/providers/me/profile-image
// @access  Private/Provider
const updateProfileImage = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No image file uploaded');
  }
  provider.profileImage = req.file.location; // S3 URL
  await provider.save();
  res.json({ profileImage: provider.profileImage });
});

// @desc    Upload gallery images (food photos)
// @route   POST /api/providers/me/gallery
// @access  Private/Provider
const addGalleryImages = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No image files uploaded');
  }
  const urls = req.files.map((f) => f.location);
  provider.galleryImages.push(...urls);
  await provider.save();
  res.json({ galleryImages: provider.galleryImages });
});

// @desc    View bookings/subscriptions for this provider
// @route   GET /api/providers/me/bookings
// @access  Private/Provider
const getMyProviderBookings = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }
  const bookings = await Subscription.find({ provider: provider._id })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Accept a paid booking/subscription request (activates it)
// @route   PUT /api/providers/me/bookings/:id/status
// @access  Private/Provider
// NOTE: Providers can only ACCEPT a paid booking, not reject it. Since payment has already
// been captured via Razorpay and there is no refund flow built yet, allowing a reject here
// would leave the customer's money stuck with no way to get it back. If a provider genuinely
// cannot fulfil an order, the customer can cancel it themselves from their dashboard.
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // only 'active' (accept) is allowed
  if (status !== 'active') {
    res.status(400);
    throw new Error("Providers can only accept a paid booking - rejection is disabled because payments are non-refundable in this system. Ask the customer to cancel from their dashboard if needed.");
  }

  const provider = await Provider.findOne({ user: req.user._id });
  const subscription = await Subscription.findOne({ _id: req.params.id, provider: provider._id });

  if (!subscription) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (subscription.paymentStatus !== 'paid') {
    res.status(400);
    throw new Error('This booking cannot be actioned until the customer completes payment');
  }
  if (subscription.status !== 'pending') {
    res.status(400);
    throw new Error('This booking has already been actioned');
  }

  subscription.status = status;
  await subscription.save();
  res.json(subscription);
});

module.exports = {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  updateProfileImage,
  addGalleryImages,
  getMyProviderBookings,
  updateBookingStatus,
};
