// controllers/certificateController.js
// Generates PDF certificate for a user's event participation

const Participation = require('../models/Participation');
const Notification = require('../models/Notification');
const { generateCertificate } = require('../services/certificateService');
const { sendCertificateEmail, sendAdminCertificateEmail } = require('../services/emailService');
const crypto = require('crypto');

// POST /api/certificates/generate/:eventId
const generateUserCertificate = async (req, res, next) => {
  try {
    const participation = await Participation.findOne({ user: req.user._id, event: req.params.eventId })
      .populate('user', 'name email')
      .populate('event', 'title date location');
    if (!participation) return res.status(404).json({ success: false, message: 'You are not registered for this event' });
    const certificateId = crypto.randomUUID();
    const pdfBuffer = await generateCertificate({
      userName: participation.user.name,
      eventTitle: participation.event.title,
      eventDate: participation.event.date,
      eventLocation: participation.event.location,
      certificateId
    });
    participation.certificateGenerated = true;
    participation.certificateId = certificateId;
    await participation.save();
    sendCertificateEmail(participation.user, participation.event, pdfBuffer).catch(console.error);
    sendAdminCertificateEmail(participation.user, participation.event, certificateId).catch(console.error);
    const notif = await Notification.create({ recipient: req.user._id, title: '🏆 Certificate Ready!', message: `Your certificate for "${participation.event.title}" has been generated.`, type: 'certificate_ready', relatedEvent: participation.event._id });
    req.io.to(`user_${req.user._id}`).emit('notification', notif);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// GET /api/certificates/my
const getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Participation.find({ user: req.user._id, certificateGenerated: true })
      .populate('event', 'title date location category');
    res.json({ success: true, certificates: certs });
  } catch (err) { next(err); }
};

// GET /api/certificates/verify/:certificateId  (public)
const verifyCertificate = async (req, res, next) => {
  try {
    const p = await Participation.findOne({ certificateId: req.params.certificateId })
      .populate('user', 'name').populate('event', 'title date location');
    if (!p) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, valid: true, certificate: { holder: p.user.name, event: p.event.title, date: p.event.date, location: p.event.location } });
  } catch (err) { next(err); }
};

module.exports = { generateUserCertificate, getMyCertificates, verifyCertificate };
