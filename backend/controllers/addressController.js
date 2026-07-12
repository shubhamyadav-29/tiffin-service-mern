const asyncHandler = require('express-async-handler');
const Address = require('../models/Address');

// @desc    Get logged-in user's saved delivery address
// @route   GET /api/addresses/me
// @access  Private/User
const getMyAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ user: req.user._id });
  res.json(address); // null is a valid response - means no address saved yet
});

// @desc    Create or update the logged-in user's delivery address (one per user)
// @route   PUT /api/addresses/me
// @access  Private/User
const upsertMyAddress = asyncHandler(async (req, res) => {
  const {
    fullName, mobileNumber, houseNumber, street, area,
    city, state, pincode, landmark, deliveryInstructions,
  } = req.body;

  if (!fullName || !mobileNumber || !houseNumber || !street || !area || !city || !state || !pincode) {
    res.status(400);
    throw new Error('All required address fields must be filled');
  }
  if (!/^\d{6}$/.test(pincode)) {
    res.status(400);
    throw new Error('PIN code must be exactly 6 digits');
  }
  if (!/^\d{10}$/.test(mobileNumber)) {
    res.status(400);
    throw new Error('Mobile number must be exactly 10 digits');
  }

  const address = await Address.findOneAndUpdate(
    { user: req.user._id },
    { fullName, mobileNumber, houseNumber, street, area, city, state, pincode, landmark, deliveryInstructions },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(address);
});

module.exports = { getMyAddress, upsertMyAddress };
