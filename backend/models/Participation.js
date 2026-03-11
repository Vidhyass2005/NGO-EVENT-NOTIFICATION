// models/Participation.js
const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  user:                 { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  event:                { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status:               { type: String, enum: ['registered','attended','cancelled'], default: 'registered' },
  registeredAt:         { type: Date,    default: Date.now },
  attendedAt:           { type: Date },
  certificateGenerated: { type: Boolean, default: false },
  certificateId:        { type: String },
  feedback: {
    rating:      { type: Number, min: 1, max: 5 },
    emoji:       { type: String },
    comment:     { type: String, default: '' },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

participationSchema.index({ user: 1, event: 1 }, { unique: true });
module.exports = mongoose.model('Participation', participationSchema);
