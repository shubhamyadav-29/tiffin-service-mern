const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, recordPaymentFailure, getMyPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/create-order', protect, authorize('user'), createOrder);
router.post('/verify', protect, authorize('user'), verifyPayment);
router.post('/failure', protect, authorize('user'), recordPaymentFailure);
router.get('/me', protect, authorize('user'), getMyPayments);

module.exports = router;
