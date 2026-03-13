// models/Participation.js
const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

  participantDetails: {
    fullName:     { type: String, default: '' },
    phone:        { type: String, default: '' },
    age:          { type: Number },
    gender:       { type: String, enum: ['Male','Female','Other','Prefer not to say'], default: 'Prefer not to say' },
    address:      { type: String, default: '' },
    organization: { type: String, default: '' },
    experience:   { type: String, default: '' },
    motivation:   { type: String, default: '' },
    emergencyContact: {
      name:  { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },

  status:               { type: String, enum: ['registered','attended','cancelled'], default: 'registered' },
  registeredAt:         { type: Date,   default: Date.now },
  attendedAt:           { type: Date },
  certificateGenerated: { type: Boolean, default: false },
  certificateId:        { type: String },

  feedback: {
    rating:      { type: Number, min: 1, max: 5 },
    emoji:       { type: String },
    comment:     { type: String, default: '' },
    submittedAt: { type: Date },
  },
}, { timestamps: true });

participationSchema.index({ user: 1, event: 1 }, { unique: true });
module.exports = mongoose.model('Participation', participationSchema);