// controllers/participationController.js
// Register/unregister, attendance, history, and feedback

const Participation = require('../models/Participation');
const Event         = require('../models/Event');
const Notification  = require('../models/Notification');
const {
  sendAdminNewEventEmail,
  sendAdminRegistrationEmail,
  sendAdminCancellationEmail,
  sendAdminFeedbackEmail,
} = require('../services/emailService');

// POST /api/participation/register/:eventId
const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('createdBy', 'name email');
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Event not open for registration' });
    if (event.currentParticipants >= event.maxParticipants)
      return res.status(400).json({ success: false, message: 'Event is full' });

    const existing = await Participation.findOne({ user: req.user._id, event: event._id });
    if (existing)
      return res.status(409).json({ success: false, message: 'Already registered' });

    const participation = await Participation.create({ user: req.user._id, event: event._id });
    await Event.findByIdAndUpdate(event._id, { $inc: { currentParticipants: 1 } });

    // Real-time attendance update
    req.io.to(`event_${event._id}`).emit('attendance_update', {
      eventId: event._id,
      currentParticipants: event.currentParticipants + 1
    });

    // In-app notification to user
    const notif = await Notification.create({
      recipient: req.user._id,
      title: '🎫 Registered!',
      message: `You are registered for "${event.title}".`,
      type: 'registration',
      relatedEvent: event._id
    });
    req.io.to(`user_${req.user._id}`).emit('notification', notif);

    // ✉️ Admin email: new registration
    sendAdminRegistrationEmail(req.user, event).catch(console.error);

    res.status(201).json({ success: true, participation });
  } catch (err) { next(err); }
};

// DELETE /api/participation/unregister/:eventId
const unregisterFromEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    const p = await Participation.findOneAndDelete({ user: req.user._id, event: req.params.eventId });
    if (!p)
      return res.status(404).json({ success: false, message: 'Registration not found' });

    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { currentParticipants: -1 } });

    // ✉️ Admin email: cancellation
    sendAdminCancellationEmail(req.user, event).catch(console.error);

    res.json({ success: true, message: 'Unregistered successfully' });
  } catch (err) { next(err); }
};

// PUT /api/participation/attend/:participationId  (admin)
const markAttendance = async (req, res, next) => {
  try {
    const p = await Participation.findByIdAndUpdate(
      req.params.participationId,
      { status: 'attended', attendedAt: new Date() },
      { new: true }
    );
    if (!p)
      return res.status(404).json({ success: false, message: 'Participation not found' });
    res.json({ success: true, participation: p });
  } catch (err) { next(err); }
};

// POST /api/participation/feedback/:eventId
// Only works if status === 'attended'
const submitFeedback = async (req, res, next) => {
  try {
    const { rating, emoji, comment } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    if (!emoji)
      return res.status(400).json({ success: false, message: 'Emoji experience is required' });

    const participation = await Participation.findOne({
      user:  req.user._id,
      event: req.params.eventId,
    }).populate('event', 'title date location category');

    if (!participation)
      return res.status(404).json({ success: false, message: 'You are not registered for this event' });
    if (participation.status !== 'attended')
      return res.status(403).json({ success: false, message: 'Feedback is only available for attended events' });
    if (participation.feedback?.rating)
      return res.status(409).json({ success: false, message: 'Feedback already submitted' });

    participation.feedback = { rating, emoji, comment: comment || '', submittedAt: new Date() };
    await participation.save();

    // ✉️ Admin email: feedback received
    sendAdminFeedbackEmail(req.user, participation.event, participation.feedback).catch(console.error);

    res.json({ success: true, message: 'Feedback submitted! Thank you 🙏', participation });
  } catch (err) { next(err); }
};

// GET /api/participation/my-history
const getMyHistory = async (req, res, next) => {
  try {
    const history = await Participation.find({ user: req.user._id })
      .populate('event', 'title date location category status')
      .sort('-registeredAt');
    res.json({ success: true, history });
  } catch (err) { next(err); }
};

// GET /api/participation/event/:eventId  (admin)
const getEventParticipants = async (req, res, next) => {
  try {
    const participants = await Participation.find({ event: req.params.eventId })
      .populate('user', 'name email organization');
    res.json({ success: true, count: participants.length, participants });
  } catch (err) { next(err); }
};

// GET /api/participation/feedback/:eventId  (admin - see all feedback for an event)
const getEventFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Participation.find({
      event: req.params.eventId,
      'feedback.rating': { $exists: true }
    }).populate('user', 'name email');

    const total = feedbacks.length;
    const avgRating = total
      ? (feedbacks.reduce((s, p) => s + p.feedback.rating, 0) / total).toFixed(1)
      : 0;

    res.json({ success: true, total, avgRating, feedbacks });
  } catch (err) { next(err); }
};

module.exports = {
  registerForEvent,
  unregisterFromEvent,
  markAttendance,
  submitFeedback,
  getMyHistory,
  getEventParticipants,
  getEventFeedback,
};
