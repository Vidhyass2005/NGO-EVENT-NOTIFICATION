// controllers/notificationController.js
// Fetch, mark read, delete notifications

const Notification = require('../models/Notification');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('relatedEvent', 'title').sort('-createdAt').limit(30);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { next(err); }
};

// PUT /api/notifications/read
const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const query = { recipient: req.user._id };
    if (ids && ids !== 'all') query._id = { $in: ids };
    await Notification.updateMany(query, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
