const express = require('express');
const router = express.Router();
const { getMyAddress, upsertMyAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/me', protect, authorize('user'), getMyAddress);
router.put('/me', protect, authorize('user'), upsertMyAddress);

module.exports = router;
