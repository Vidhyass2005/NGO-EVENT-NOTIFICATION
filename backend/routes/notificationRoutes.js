// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getNotifications);
router.put('/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
