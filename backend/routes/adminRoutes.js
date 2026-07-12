const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  getAllProviders,
  updateProviderApproval,
  getAllBookings,
  getReports,
  getAllReviews,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin')); // every route below is admin-only

router.get('/users', getAllUsers);
router.put('/users/:id/status', toggleUserStatus);
router.get('/providers', getAllProviders);
router.put('/providers/:id/approval', updateProviderApproval);
router.get('/bookings', getAllBookings);
router.get('/reports', getReports);
router.get('/reviews', getAllReviews);

module.exports = router;
