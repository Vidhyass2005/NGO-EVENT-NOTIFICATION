// controllers/eventController.js
const Event         = require('../models/Event');
const User          = require('../models/User');
const Participation = require('../models/Participation');
const Notification  = require('../models/Notification');
const {
  sendAdminNewEventEmail, sendAdminApprovalNoticeEmail,
  sendAdminEventDeletedEmail, sendApprovalEmail
} = require('../services/emailService');

const getEvents = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20, all } = req.query;
    const query = {};
    if (status) query.status = status;
    else if (!(req.user?.role === 'admin' && all === 'true')) query.status = { $in: ['approved','completed'] };
    if (category) query.category = category;
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: 1 })
      .skip((page-1)*limit).limit(Number(limit));
    const total = await Event.countDocuments(query);
    res.json({ success: true, events, total });
  } catch (err) { next(err); }
};

const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy','name email organization');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

const createEvent = async (req, res, next) => {
  try {
    const event  = await Event.create({ ...req.body, createdBy: req.user._id });
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      const notif = await Notification.create({ recipient: admin._id, title: 'New Event Pending Approval', message: `"${event.title}" needs your review.`, type: 'event_created', relatedEvent: event._id });
      req.io.to(`user_${admin._id}`).emit('notification', notif);
    }
    sendAdminNewEventEmail(req.user, event).catch(console.error);
    res.status(201).json({ success: true, event });
  } catch (err) { next(err); }
};

const approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user._id }, { new: true }).populate('createdBy','name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const notif = await Notification.create({ recipient: event.createdBy._id, title: '✅ Event Approved!', message: `Your event "${event.title}" is now live.`, type: 'event_approved', relatedEvent: event._id });
    req.io.to(`user_${event.createdBy._id}`).emit('notification', notif);
    req.io.emit('event_update', { type: 'new_event', event });
    sendApprovalEmail(event.createdBy, event).catch(console.error);
    sendAdminApprovalNoticeEmail(req.user, event).catch(console.error);
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

const cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    event.status       = 'cancelled';
    event.cancelReason = req.body.reason || 'Cancelled';
    await event.save();
    const participations = await Participation.find({ event: event._id }).populate('user');
    for (const p of participations) {
      const notif = await Notification.create({ recipient: p.user._id, title: '⚠️ Event Cancelled', message: `"${event.title}" has been cancelled.`, type: 'event_cancelled', relatedEvent: event._id });
      req.io.to(`user_${p.user._id}`).emit('notification', notif);
    }
    req.io.emit('event_update', { type: 'event_cancelled', eventId: event._id });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

// Admin manually marks event as completed
const completeEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Only approved events can be completed' });
    event.status = 'completed';
    await event.save();
    // Mark all registered participants as attended
    const parts = await Participation.find({ event: event._id, status: 'registered' });
    for (const p of parts) {
      p.status     = 'attended';
      p.attendedAt = new Date();
      await p.save();
      const notif = await Notification.create({ recipient: p.user, title: '🎉 Event Completed!', message: `"${event.title}" is completed. Download your certificate!`, type: 'event_approved', relatedEvent: event._id });
      req.io.to(`user_${p.user}`).emit('notification', notif);
    }
    req.io.emit('event_update', { type: 'event_completed', eventId: event._id });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) { next(err); }
};

const deleteEvent = async (req, res, next) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (deletedEvent) sendAdminEventDeletedEmail(req.user, deletedEvent).catch(console.error);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const byCategory = await Event.aggregate([
      { $match: { status: { $in: ['approved','completed'] } } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalParticipants: { $sum: '$currentParticipants' } } },
      { $sort: { count: -1 } }
    ]);
    const byMonth = await Event.aggregate([
      { $match: { status: { $in: ['approved','completed'] } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, count: { $sum: 1 }, participants: { $sum: '$currentParticipants' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 }
    ]);
    const totalEvents        = await Event.countDocuments({ status: { $in: ['approved','completed'] } });
    const totalParticipations= await require('../models/Participation').countDocuments();
    const totalUsers         = await require('../models/User').countDocuments({ role: 'user' });
    const pendingApprovals   = await Event.countDocuments({ status: 'pending' });
    const completedEvents    = await Event.countDocuments({ status: 'completed' });
    res.json({ success: true, analytics: { byCategory, byMonth, totalEvents, totalParticipations, totalUsers, pendingApprovals, completedEvents } });
  } catch (err) { next(err); }
};

module.exports = { getEvents, getEvent, createEvent, approveEvent, cancelEvent, completeEvent, updateEvent, deleteEvent, getAnalytics };
