const express = require('express');
const router = express.Router();
const { getProviderReviews, createReview, moderateReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/:providerId', getProviderReviews);
router.post('/', protect, authorize('user'), createReview);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);

module.exports = router;
