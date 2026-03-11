// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:               { type: String, required: true, trim: true },
  description:         { type: String, required: true },
  date:                { type: Date,   required: true },
  endDate:             { type: Date },
  location:            { type: String, required: true },
  category: {
    type: String,
    enum: ['Education','Health','Environment','Community','Fundraiser','Workshop','Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['pending','approved','cancelled','completed'],
    default: 'pending'
  },
  maxParticipants:     { type: Number, default: 100 },
  currentParticipants: { type: Number, default: 0 },
  createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelReason:        { type: String, default: '' },
  imageUrl:            { type: String, default: '' },
  tags:                [String]
}, { timestamps: true });

eventSchema.index({ date: 1, status: 1 });
module.exports = mongoose.model('Event', eventSchema);
