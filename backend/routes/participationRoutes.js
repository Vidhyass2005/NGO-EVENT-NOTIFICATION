// routes/participationRoutes.js
const express = require('express');
const router  = express.Router();
const {
  registerForEvent,
  unregisterFromEvent,
  markAttendance,
  submitFeedback,
  getMyHistory,
  getEventParticipants,
  getEventFeedback,
} = require('../controllers/participationController');
const { protect }    = require('../middleware/authMiddleware');
const { adminOnly }  = require('../middleware/adminMiddleware');

router.use(protect);

router.get('/my-history',                getMyHistory);
router.post('/register/:eventId',        registerForEvent);
router.delete('/unregister/:eventId',    unregisterFromEvent);
router.post('/feedback/:eventId',        submitFeedback);          // ← NEW
router.put('/attend/:participationId',   adminOnly, markAttendance);
router.get('/event/:eventId',            adminOnly, getEventParticipants);
router.get('/feedback/event/:eventId',   adminOnly, getEventFeedback); // ← NEW

module.exports = router;
