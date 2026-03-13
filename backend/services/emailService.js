// services/emailService.js
// All email templates for NGO Events Platform
const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransporter({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await createTransporter().sendMail({
      from: `"NGO Events Platform" <${process.env.EMAIL_USER}>`,
      to, subject, html, attachments,
    });
    console.log(`📧 Email sent to ${to} — ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

const getAdminEmails = async () => {
  const User = require('../models/User');
  return User.find({ role: 'admin', isActive: true }).select('email name');
};

// ── Shared HTML helpers ────────────────────────────────────
const wrap = (content) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="background:#0f172a;padding:24px 32px;text-align:center">
    <span style="font-size:32px">🌍</span>
    <h2 style="color:#22d3ee;margin:8px 0 0;font-size:20px;font-weight:700">NGO Events Platform</h2>
  </div>
  <div style="padding:32px;background:#ffffff">${content}</div>
  <div style="background:#f1f5f9;padding:16px 32px;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">Automated notification — NGO Events Platform</p>
  </div>
</div>`;

const badge = (text, color) =>
  `<span style="display:inline-block;background:${color}22;color:${color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid ${color}44">${text}</span>`;

const row = (label, value) =>
  `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;width:140px;border-bottom:1px solid #f1f5f9">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9">${value}</td>
  </tr>`;

const table = (rows) =>
  `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0">${rows}</table>`;

const btn = (text, url, color = '#22d3ee') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:${color === '#22d3ee' ? '#0f172a' : '#ffffff'};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:16px">${text}</a>`;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── USER EMAILS ────────────────────────────────────────────

// Email to event creator when their event is approved
const sendApprovalEmail = (user, event) => sendEmail({
  to:      user.email,
  subject: `✅ Your event "${event.title}" has been approved!`,
  html: wrap(`
    <h2 style="color:#0f172a;margin:0 0 8px">Your Event is Live! ✅</h2>
    <p style="color:#475569;margin:0 0 16px">Great news! Your event has been approved and is now visible to volunteers.</p>
    ${table(
      row('Event',    `<strong>${event.title}</strong>`) +
      row('Date',     fmtDate(event.date)) +
      row('Location', event.location) +
      row('Status',   badge('Approved & Live', '#22c55e'))
    )}
    ${btn('View Event', process.env.CLIENT_URL || 'http://localhost:3000', '#22c55e')}
  `),
});

// Email to participant when their event is cancelled
const sendEventCancelledEmail = (user, event) => sendEmail({
  to:      user.email,
  subject: `⚠️ Event Cancelled: "${event.title}"`,
  html: wrap(`
    <h2 style="color:#0f172a;margin:0 0 8px">Event Cancelled ⚠️</h2>
    <p style="color:#475569;margin:0 0 16px">We regret to inform you that an event you registered for has been cancelled.</p>
    ${table(
      row('Event',   `<strong>${event.title}</strong>`) +
      row('Date',    fmtDate(event.date)) +
      row('Reason',  event.cancelReason || 'No reason provided') +
      row('Status',  badge('Cancelled', '#ef4444'))
    )}
    <p style="color:#94a3b8;font-size:13px;margin-top:16px">We apologize for any inconvenience. Please check our platform for other upcoming events.</p>
    ${btn('Browse Events', process.env.CLIENT_URL || 'http://localhost:3000', '#22d3ee')}
  `),
});

// Welcome email to new user
const sendWelcomeEmail = (user) => sendEmail({
  to:      user.email,
  subject: 'Welcome to NGO Events! 🌍',
  html: wrap(`
    <h2 style="color:#0f172a;margin:0 0 8px">Welcome, ${user.name}! 👋</h2>
    <p style="color:#475569">You have successfully joined the NGO Events Platform. Start exploring and joining events in your community.</p>
    ${btn('Browse Events', process.env.CLIENT_URL || 'http://localhost:3000')}
  `),
});

// Certificate email with PDF attachment
const sendCertificateEmail = (user, event, pdfBuffer) => sendEmail({
  to:      user.email,
  subject: `🏆 Your certificate for "${event.title}"`,
  html: wrap(`
    <h2 style="color:#0f172a;margin:0 0 8px">Certificate Ready! 🏆</h2>
    <p style="color:#475569">Thank you for participating in <strong>${event.title}</strong>. Your certificate is attached.</p>
    ${table(
      row('Event', event.title) +
      row('Date',  fmtDate(event.date))
    )}
    <p style="color:#94a3b8;font-size:12px">Scan the QR code on the certificate to verify authenticity.</p>
  `),
  attachments: [{
    filename:    `certificate-${event.title.replace(/\s+/g, '-')}.pdf`,
    content:     pdfBuffer,
    contentType: 'application/pdf',
  }],
});

// ── ADMIN EMAILS ───────────────────────────────────────────

// 1. New event submitted → email all admins
const sendAdminNewEventEmail = async (user, event) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `📋 New Event Pending Approval — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Action Required', '#f59e0b')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">New Event Needs Your Review</h2>
        <p style="color:#475569;margin:0 0 16px">A new event has been submitted and is waiting for your approval.</p>
        ${table(
          row('Title',    `<strong>${event.title}</strong>`) +
          row('Category', event.category) +
          row('Date',     fmtDate(event.date)) +
          row('Location', event.location) +
          row('Capacity', `${event.maxParticipants} max participants`) +
          row('By',       `${user.name} (${user.email})`) +
          row('Status',   badge('Pending Approval', '#f59e0b'))
        )}
        ${btn('Review & Approve', process.env.CLIENT_URL || 'http://localhost:3000', '#f59e0b')}
      `),
    }).catch(console.error);
  }
};

// 2. Event approved → notify other admins
const sendAdminApprovalNoticeEmail = async (approverAdmin, event) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    if (admin.email === approverAdmin.email) continue; // skip the one who approved
    sendEmail({
      to:      admin.email,
      subject: `✅ Event Approved — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Approved', '#22c55e')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Now Live</h2>
        ${table(
          row('Event',       `<strong>${event.title}</strong>`) +
          row('Date',        fmtDate(event.date)) +
          row('Location',    event.location) +
          row('Approved By', `${approverAdmin.name}`) +
          row('Status',      badge('Live', '#22c55e'))
        )}
        ${btn('View Event', process.env.CLIENT_URL || 'http://localhost:3000', '#22c55e')}
      `),
    }).catch(console.error);
  }
};

// 3. Event cancelled by admin
const sendAdminCancelEmail = async (admin, event) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({
      to:      a.email,
      subject: `⚠️ Event Cancelled — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Cancelled', '#ef4444')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Cancelled</h2>
        ${table(
          row('Event',        `<strong>${event.title}</strong>`) +
          row('Date',         fmtDate(event.date)) +
          row('Cancelled By', admin.name) +
          row('Reason',       event.cancelReason || 'No reason provided') +
          row('At',           new Date().toLocaleString())
        )}
      `),
    }).catch(console.error);
  }
};

// 4. Event deleted
const sendAdminEventDeletedEmail = async (admin, event) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({
      to:      a.email,
      subject: `🗑️ Event Deleted — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Deleted', '#ef4444')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Permanently Deleted</h2>
        ${table(
          row('Event',      `<strong>${event.title}</strong>`) +
          row('Date',       fmtDate(event.date)) +
          row('Deleted By', admin.name) +
          row('At',         new Date().toLocaleString())
        )}
      `),
    }).catch(console.error);
  }
};

// 5. User registers for event — includes participant form details
const sendAdminRegistrationEmail = async (user, event, details = {}) => {
  const admins = await getAdminEmails();
  const detailRows = [
    details.fullName     ? row('Full Name',   `<strong>${details.fullName}</strong>`)                              : '',
    details.phone        ? row('Phone',       details.phone)                                                       : '',
    details.age          ? row('Age',         details.age)                                                         : '',
    details.gender       ? row('Gender',      details.gender)                                                      : '',
    details.address      ? row('Address',     details.address)                                                     : '',
    details.organization ? row('Organisation',details.organization)                                                : '',
    details.experience   ? row('Experience',  `<em>${details.experience}</em>`)                                    : '',
    details.motivation   ? row('Motivation',  `<em>${details.motivation}</em>`)                                    : '',
    (details.emergencyContact?.name || details.emergencyContact?.phone)
      ? row('Emergency Contact',
          `${details.emergencyContact?.name || '—'} · ${details.emergencyContact?.phone || '—'}`)
      : '',
  ].filter(Boolean).join('');

  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `🎫 New Registration — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('New Registration', '#22d3ee')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">A Volunteer Registered</h2>
        <p style="color:#475569;font-size:13px;margin:0 0 16px">
          Account: <strong>${user.name}</strong> (${user.email})
        </p>
        ${table(
          row('Event',  `<strong>${event.title}</strong>`) +
          row('Date',   fmtDate(event.date)) +
          row('Slots',  `${event.currentParticipants + 1} / ${event.maxParticipants}`)
        )}
        ${detailRows ? `
          <p style="color:#0f172a;font-weight:600;font-size:13px;margin:20px 0 8px">Registration Form Details</p>
          ${table(detailRows)}
        ` : ''}
        ${btn('View Participants', process.env.CLIENT_URL || 'http://localhost:3000')}
      `),
    }).catch(console.error);
  }
};

// 6. User cancels registration
const sendAdminCancellationEmail = async (user, event) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `❌ Registration Cancelled — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Cancelled', '#ef4444')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Volunteer Cancelled Registration</h2>
        ${table(
          row('Volunteer', `<strong>${user.name}</strong>`) +
          row('Email',     user.email) +
          row('Event',     `<strong>${event.title}</strong>`) +
          row('Date',      fmtDate(event.date))
        )}
      `),
    }).catch(console.error);
  }
};

// 7. Feedback submitted
const STAR_COLS = ['', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];
const ELABELS  = { '😞': 'Poor', '😐': 'Average', '🙂': 'Good', '😊': 'Great', '🤩': 'Excellent' };

const sendAdminFeedbackEmail = async (user, event, feedback) => {
  const admins = await getAdminEmails();
  const stars  = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `💬 New Feedback — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('New Feedback', '#818cf8')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Feedback Received</h2>
        ${table(
          row('Volunteer',  `<strong>${user.name}</strong> (${user.email})`) +
          row('Event',      `<strong>${event.title}</strong>`) +
          row('Rating',     `<span style="color:${STAR_COLS[feedback.rating]};font-size:18px">${stars}</span> (${feedback.rating}/5)`) +
          row('Experience', `${feedback.emoji} ${ELABELS[feedback.emoji] || ''}`) +
          (feedback.comment ? row('Comment', `<em>"${feedback.comment}"</em>`) : '') +
          row('Submitted',  new Date().toLocaleString())
        )}
        ${btn('View Analytics', `${process.env.CLIENT_URL || 'http://localhost:3000'}/analytics`, '#818cf8')}
      `),
    }).catch(console.error);
  }
};

// 8. Certificate generated
const sendAdminCertificateEmail = async (user, event, certificateId) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `🏆 Certificate Issued — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Certificate Issued', '#f59e0b')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Certificate Generated</h2>
        ${table(
          row('Volunteer', `<strong>${user.name}</strong>`) +
          row('Email',     user.email) +
          row('Event',     `<strong>${event.title}</strong>`) +
          row('Cert ID',   `<code style="font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${certificateId}</code>`) +
          row('At',        new Date().toLocaleString())
        )}
      `),
    }).catch(console.error);
  }
};

// 9. New user registered
const sendAdminUserRegisteredEmail = async (user) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `👤 New Volunteer Joined — ${user.name}`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('New User', '#818cf8')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">New Volunteer Registered</h2>
        ${table(
          row('Name',  `<strong>${user.name}</strong>`) +
          row('Email', user.email) +
          row('Org',   user.organization || '—') +
          row('At',    new Date().toLocaleString())
        )}
      `),
    }).catch(console.error);
  }
};

// 10. Event auto-completed by cron
const sendAdminEventCompletedEmail = async (event, participantCount) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({
      to:      admin.email,
      subject: `🎉 Event Auto-Completed — "${event.title}"`,
      html: wrap(`
        <div style="margin-bottom:16px">${badge('Auto-Completed', '#22c55e')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Marked as Completed</h2>
        <p style="color:#475569;margin:0 0 16px">This event passed its scheduled date and was automatically completed by the system.</p>
        ${table(
          row('Event',        `<strong>${event.title}</strong>`) +
          row('Date',         fmtDate(event.date)) +
          row('Participants', `${participantCount} marked as attended`) +
          row('Completed At', new Date().toLocaleString()) +
          row('Status',       badge('Completed', '#22c55e'))
        )}
        ${btn('View Analytics', `${process.env.CLIENT_URL || 'http://localhost:3000'}/analytics`, '#22c55e')}
      `),
    }).catch(console.error);
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApprovalEmail,
  sendCertificateEmail,
  sendEventCancelledEmail,
  sendAdminNewEventEmail,
  sendAdminApprovalNoticeEmail,
  sendAdminCancelEmail,
  sendAdminEventDeletedEmail,
  sendAdminRegistrationEmail,
  sendAdminCancellationEmail,
  sendAdminFeedbackEmail,
  sendAdminCertificateEmail,
  sendAdminUserRegisteredEmail,
  sendAdminEventCompletedEmail,
};
