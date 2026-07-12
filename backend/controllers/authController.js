const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Provider = require('../models/Provider');
const generateToken = require('../utils/generateToken');
const { sendEmail, registrationEmailTemplate } = require('../utils/sendEmail');

// @desc    Register a new user or provider
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address, businessName, foodType, contactNumber, deliveryAreas, pricing } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const requestedRole = role === 'provider' ? 'provider' : 'user'; // admin accounts are never self-registered

  const user = await User.create({ name, email, password, phone, role: requestedRole, address });

  if (requestedRole === 'provider') {
    await Provider.create({
      user: user._id,
      businessName,
      foodType,
      contactNumber: contactNumber || phone,
      deliveryAreas: deliveryAreas || [],
      address,
      pricing: pricing || {},
    });
  }

  sendEmail({
    to: user.email,
    subject: 'Welcome to TiffinHub',
    html: registrationEmailTemplate(user.name),
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc    Login user/provider/admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact support.');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { registerUser, loginUser, getMe };
