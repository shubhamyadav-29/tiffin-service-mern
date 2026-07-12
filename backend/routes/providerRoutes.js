const express = require('express');
const router = express.Router();
const {
  getProviders,
  getProviderById,
  getMyProviderProfile,
  updateMyProviderProfile,
  updateProfileImage,
  addGalleryImages,
  getMyProviderBookings,
  updateBookingStatus,
} = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', getProviders);

// Private/Provider - specific /me/* routes MUST be registered before the /:id route below,
// otherwise Express would treat "me" as an :id param and never reach these handlers.
router.get('/me/profile', protect, authorize('provider'), getMyProviderProfile);
router.put('/me/profile', protect, authorize('provider'), updateMyProviderProfile);
router.put('/me/profile-image', protect, authorize('provider'), upload.single('image'), updateProfileImage);
router.post('/me/gallery', protect, authorize('provider'), upload.array('images', 6), addGalleryImages);
router.get('/me/bookings', protect, authorize('provider'), getMyProviderBookings);
router.put('/me/bookings/:id/status', protect, authorize('provider'), updateBookingStatus);

// Public - kept last since :id is a catch-all
router.get('/:id', getProviderById);

module.exports = router;
