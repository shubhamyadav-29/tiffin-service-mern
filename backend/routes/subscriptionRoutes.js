const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getMySubscriptions,
  getSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('user'), createSubscription);
router.get('/me', protect, authorize('user'), getMySubscriptions);
router.get('/:id', protect, authorize('user'), getSubscriptionById);
router.put('/:id/pause', protect, authorize('user'), pauseSubscription);
router.put('/:id/resume', protect, authorize('user'), resumeSubscription);
router.put('/:id/cancel', protect, authorize('user'), cancelSubscription);

module.exports = router;
