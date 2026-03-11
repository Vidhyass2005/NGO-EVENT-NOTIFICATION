// routes/eventRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getEvents, getEvent, createEvent, approveEvent,
  cancelEvent, completeEvent, updateEvent, deleteEvent, getAnalytics
} = require('../controllers/eventController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/analytics',       protect,             getAnalytics);
router.get('/',                protect,             getEvents);
router.get('/:id',             protect,             getEvent);
router.post('/',               protect,             createEvent);
router.put('/:id',             protect,             updateEvent);
router.put('/:id/approve',     protect, adminOnly,  approveEvent);
router.put('/:id/complete',    protect, adminOnly,  completeEvent);
router.put('/:id/cancel',      protect,             cancelEvent);
router.delete('/:id',          protect, adminOnly,  deleteEvent);

module.exports = router;
