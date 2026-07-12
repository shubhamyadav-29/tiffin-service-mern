const express = require('express');
const router = express.Router();
const { getMenusByProvider, upsertMyMenu, deleteMyMenu, uploadMealImage } = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/me', protect, authorize('provider'), upsertMyMenu);
router.delete('/me/:day', protect, authorize('provider'), deleteMyMenu);
router.put('/me/:day/:mealType/image', protect, authorize('provider'), upload.single('image'), uploadMealImage);

router.get('/:providerId', getMenusByProvider); // public - view a provider's weekly menu

module.exports = router;
