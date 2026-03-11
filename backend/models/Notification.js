// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true },
  message:      { type: String, required: true },
  type: {
    type: String,
    enum: ['event_created','event_approved','event_cancelled','registration','certificate_ready','system'],
    default: 'system'
  },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  isRead:       { type: Boolean, default: false },
  readAt:       { type: Date }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
