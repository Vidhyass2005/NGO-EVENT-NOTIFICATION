// controllers/eventController.js
const Event         = require('../models/Event');
const User          = require('../models/User');
const Participation = require('../models/Participation');
const Notification  = require('../models/Notification');
const {
  sendAdminNewEventEmail,
  sendAdminApprovalNoticeEmail,
  sendAdminEventDeletedEmail,
  sendAdminCancelEmail,
  sendApprovalEmail,
  sendEventCancelledEmail,
} = require('../services/emailService');

// ─── GET ALL EVENTS ───────────────────────────────────────
const getEvents = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20, all } = req.query;
    const query = {};
    if (status) query.status = status;
    else if (!(req.user?.role === 'admin' && all === 'true'))
      query.status = { $in: ['approved', 'completed'] };
    if (category) query.category = category;
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Event.countDocuments(query);
    res.json({ success: true, events, total });
  } catch (err) { next(err); }
};

// ─── GET SINGLE EVENT ─────────────────────────────────────
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email organization');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── CREATE EVENT ─────────────────────────────────────────
// Pushes real-time notification to ALL admins + sends email to admins
const createEvent = async (req, res, next) => {
  try {
    const event  = await Event.create({ ...req.body, createdBy: req.user._id });
    const admins = await User.find({ role: 'admin', isActive: true });

    for (const admin of admins) {
      // 1. Save notification to DB
      const notif = await Notification.create({
        recipient:    admin._id,
        title:        '📋 New Event Pending Approval',
        message:      `"${event.title}" was submitted by ${req.user.name} and needs your review.`,
        type:         'event_created',
        relatedEvent: event._id,
      });
      // 2. Push in real-time via Socket.io
      req.io.to(`user_${admin._id}`).emit('notification', notif);
    }

    // 3. Email all admins
    sendAdminNewEventEmail(req.user, event).catch(console.error);

    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── APPROVE EVENT ────────────────────────────────────────
// Pushes real-time notification to event creator + emails creator
const approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // 1. Save notification to DB for creator
    const notif = await Notification.create({
      recipient:    event.createdBy._id,
      title:        '✅ Your Event is Approved!',
      message:      `"${event.title}" is now live. Volunteers can register now.`,
      type:         'event_approved',
      relatedEvent: event._id,
    });

    // 2. Push in real-time to creator
    req.io.to(`user_${event.createdBy._id}`).emit('notification', notif);

    // 3. Broadcast event update so all users' home page refreshes
    req.io.emit('event_update', { type: 'new_event', event });

    // 4. Email creator that their event was approved
    sendApprovalEmail(event.createdBy, event).catch(console.error);

    // 5. Notify other admins via email
    sendAdminApprovalNoticeEmail(req.user, event).catch(console.error);

    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── CANCEL EVENT (admin can cancel anytime) ──────────────
// Admin can cancel pending, approved events at any time
// Notifies all registered participants in real-time
const cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Only admin OR the creator can cancel
    const isAdmin   = req.user.role === 'admin';
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator)
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this event' });

    // Admin can cancel any status; creator can only cancel pending
    if (!isAdmin && event.status !== 'pending')
      return res.status(400).json({ success: false, message: 'You can only withdraw pending events' });

    event.status       = 'cancelled';
    event.cancelReason = req.body.reason || 'Cancelled by admin';
    await event.save();

    // Notify all registered participants
    const participations = await Participation.find({ event: event._id, status: 'registered' })
      .populate('user', 'name email');

    for (const p of participations) {
      // 1. DB notification
      const notif = await Notification.create({
        recipient:    p.user._id,
        title:        '⚠️ Event Cancelled',
        message:      `"${event.title}" has been cancelled. Reason: ${event.cancelReason}`,
        type:         'event_cancelled',
        relatedEvent: event._id,
      });
      // 2. Real-time push
      req.io.to(`user_${p.user._id}`).emit('notification', notif);
      // 3. Email each participant
      sendEventCancelledEmail(p.user, event).catch(console.error);
    }

    // Notify the event creator if admin is cancelling someone else's event
    if (isAdmin && !isCreator) {
      const creator = await User.findById(event.createdBy);
      if (creator) {
        const notif = await Notification.create({
          recipient:    creator._id,
          title:        '⚠️ Your Event Was Cancelled',
          message:      `"${event.title}" was cancelled by an admin. Reason: ${event.cancelReason}`,
          type:         'event_cancelled',
          relatedEvent: event._id,
        });
        req.io.to(`user_${creator._id}`).emit('notification', notif);
      }
    }

    // Broadcast UI update
    req.io.emit('event_update', { type: 'event_cancelled', eventId: event._id });

    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── COMPLETE EVENT (admin manually marks complete) ───────
const completeEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Only approved events can be completed' });

    event.status = 'completed';
    await event.save();

    // Mark all registered participants as attended + notify them
    const parts = await Participation.find({ event: event._id, status: 'registered' });
    for (const p of parts) {
      p.status     = 'attended';
      p.attendedAt = new Date();
      await p.save();
      const notif = await Notification.create({
        recipient:    p.user,
        title:        '🎉 Event Completed!',
        message:      `"${event.title}" is completed. You can now download your certificate!`,
        type:         'event_approved',
        relatedEvent: event._id,
      });
      req.io.to(`user_${p.user}`).emit('notification', notif);
    }

    req.io.emit('event_update', { type: 'event_completed', eventId: event._id });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── UPDATE EVENT ─────────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// ─── DELETE EVENT ─────────────────────────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (deleted) sendAdminEventDeletedEmail(req.user, deleted).catch(console.error);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
};

// ─── ANALYTICS ────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const byCategory = await Event.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalParticipants: { $sum: '$currentParticipants' } } },
      { $sort: { count: -1 } }
    ]);
    const byMonth = await Event.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, count: { $sum: 1 }, participants: { $sum: '$currentParticipants' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    const totalEvents         = await Event.countDocuments({ status: { $in: ['approved', 'completed'] } });
    const totalParticipations = await require('../models/Participation').countDocuments();
    const totalUsers          = await require('../models/User').countDocuments({ role: 'user' });
    const pendingApprovals    = await Event.countDocuments({ status: 'pending' });
    const completedEvents     = await Event.countDocuments({ status: 'completed' });
    res.json({ success: true, analytics: { byCategory, byMonth, totalEvents, totalParticipations, totalUsers, pendingApprovals, completedEvents } });
  } catch (err) { next(err); }
};

module.exports = {
  getEvents, getEvent, createEvent, approveEvent,
  cancelEvent, completeEvent, updateEvent, deleteEvent, getAnalytics,
};
