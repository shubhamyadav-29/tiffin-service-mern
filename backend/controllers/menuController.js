const asyncHandler = require('express-async-handler');
const Menu = require('../models/Menu');
const Provider = require('../models/Provider');

// @desc    Get weekly menu for a provider (public)
// @route   GET /api/menus/:providerId
// @access  Public
const getMenusByProvider = asyncHandler(async (req, res) => {
  const menus = await Menu.find({ provider: req.params.providerId });
  res.json(menus);
});

// @desc    Create or update a day's menu (upsert) for the logged-in provider
// @route   POST /api/menus/me
// @access  Private/Provider
const upsertMyMenu = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }

  const { day, breakfast, lunch, dinner } = req.body;
  if (!day) {
    res.status(400);
    throw new Error('Day is required');
  }

  const menu = await Menu.findOneAndUpdate(
    { provider: provider._id, day },
    { $set: { breakfast, lunch, dinner } },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(menu);
});

// @desc    Delete a day's menu
// @route   DELETE /api/menus/me/:day
// @access  Private/Provider
const deleteMyMenu = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) {
    res.status(404);
    throw new Error('Provider profile not found');
  }

  await Menu.findOneAndDelete({ provider: provider._id, day: req.params.day });
  res.json({ message: `Menu for ${req.params.day} removed` });
});

// @desc    Upload image for a specific meal (breakfast/lunch/dinner) of a day
// @route   PUT /api/menus/me/:day/:mealType/image
// @access  Private/Provider
const uploadMealImage = asyncHandler(async (req, res) => {
  const { day, mealType } = req.params;
  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
    res.status(400);
    throw new Error('Invalid meal type');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No image file uploaded');
  }

  const provider = await Provider.findOne({ user: req.user._id });
  const menu = await Menu.findOne({ provider: provider._id, day });
  if (!menu) {
    res.status(404);
    throw new Error('Menu for this day not found. Create it first.');
  }

  menu[mealType].image = req.file.location;
  await menu.save();
  res.json(menu);
});

module.exports = { getMenusByProvider, upsertMyMenu, deleteMyMenu, uploadMealImage };
