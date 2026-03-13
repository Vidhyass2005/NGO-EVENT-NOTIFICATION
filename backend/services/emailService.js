// services/emailService.js — All email templates (8 admin + 3 user)
const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransporter({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await createTransporter().sendMail({
      from: `"NGO Events" <${process.env.EMAIL_USER}>`, to, subject, html, attachments
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
};

const getAdminEmails = async () => {
  const User = require('../models/User');
  return User.find({ role: 'admin', isActive: true }).select('email name');
};

// ─── SHARED HELPERS ──────────────────────────────────────
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
  `<tr><td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;width:140px">${label}</td><td style="padding:8px 12px;font-size:13px;color:#1e293b">${value}</td></tr>`;

const table = (rows) =>
  `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0">${rows}</table>`;

const btn = (text, url, color = '#22d3ee') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:${color==='#22d3ee'?'#0f172a':'#ffffff'};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:16px">${text}</a>`;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

// ─── USER EMAILS ─────────────────────────────────────────

const sendWelcomeEmail = (user) => sendEmail({
  to: user.email, subject: 'Welcome to NGO Events! 🌍',
  html: wrap(`<h2 style="color:#0f172a;margin:0 0 8px">Welcome, ${user.name}! 👋</h2>
    <p style="color:#475569">You've joined the NGO Events Platform. Start exploring events in your community.</p>
    ${btn('Browse Events', process.env.CLIENT_URL)}`)
});

const sendApprovalEmail = (user, event) => sendEmail({
  to: user.email, subject: `✅ Your event "${event.title}" has been approved!`,
  html: wrap(`<h2 style="color:#0f172a;margin:0 0 8px">Event Approved! ✅</h2>
    <p style="color:#475569">Your event is now live and visible to all volunteers.</p>
    ${table(row('Event', `<strong>${event.title}</strong>`) + row('Date', fmtDate(event.date)) + row('Location', event.location) + row('Status', badge('Approved','#22c55e')))}
    ${btn('View Event', process.env.CLIENT_URL)}`)
});

const sendCertificateEmail = (user, event, pdfBuffer) => sendEmail({
  to: user.email, subject: `🏆 Your certificate for "${event.title}"`,
  html: wrap(`<h2 style="color:#0f172a;margin:0 0 8px">Your Certificate is Ready! 🏆</h2>
    <p style="color:#475569">Thank you for participating in <strong>${event.title}</strong>. Your certificate is attached.</p>
    ${table(row('Event', event.title) + row('Date', fmtDate(event.date)))}
    <p style="color:#94a3b8;font-size:12px">Scan the QR code on the certificate to verify authenticity.</p>`),
  attachments: [{ filename: `certificate-${event.title.replace(/\s+/g,'-')}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
});

// ─── ADMIN EMAIL 1: New event created ───────────────────
const sendAdminNewEventEmail = async (user, event) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({ to: admin.email, subject: `📋 New Event Pending Approval — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Action Required','#f59e0b')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">New Event Submitted</h2>
        <p style="color:#475569">A new event is waiting for your approval.</p>
        ${table(row('Title',`<strong>${event.title}</strong>`) + row('Category',event.category) + row('Date',fmtDate(event.date)) + row('Location',event.location) + row('Capacity',`${event.maxParticipants} max`) + row('By',`${user.name} (${user.email})`) + row('Status',badge('Pending','#f59e0b')))}
        ${btn('Review Event', process.env.CLIENT_URL, '#f59e0b')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 2: User registers ──────────────────────
const sendAdminRegistrationEmail = async (user, event, details = {}) => {
  const admins = await getAdminEmails();
  const detailRows = [
    details.fullName     ? row('Full Name',    `<strong>${details.fullName}</strong>`) : '',
    details.phone        ? row('Phone',        details.phone) : '',
    details.age          ? row('Age',          details.age) : '',
    details.gender       ? row('Gender',       details.gender) : '',
    details.address      ? row('Address',      details.address) : '',
    details.organization ? row('Organisation', details.organization) : '',
    details.experience   ? row('Experience',   `<em>${details.experience}</em>`) : '',
    details.motivation   ? row('Motivation',   `<em>${details.motivation}</em>`) : '',
    (details.emergencyContact?.name || details.emergencyContact?.phone)
      ? row('Emergency Contact', `${details.emergencyContact?.name || '—'} · ${details.emergencyContact?.phone || '—'}`)
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
          row('Event', `<strong>${event.title}</strong>`) +
          row('Date',  fmtDate(event.date)) +
          row('Slots', `${event.currentParticipants + 1} / ${event.maxParticipants}`)
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

// ─── ADMIN EMAIL 3: User cancels registration ───────────
const sendAdminCancellationEmail = async (user, event) => {
  const admins = await getAdminEmails();
  for (const admin of admins) {
    sendEmail({ to: admin.email, subject: `❌ Registration Cancelled — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Cancelled','#ef4444')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Volunteer Cancelled Registration</h2>
        ${table(row('Volunteer',`<strong>${user.name}</strong>`) + row('Email',user.email) + row('Event',`<strong>${event.title}</strong>`) + row('Event Date',fmtDate(event.date)) + row('Remaining',`${Math.max(0,event.currentParticipants-1)} / ${event.maxParticipants}`))}
        ${btn('View Event', process.env.CLIENT_URL, '#ef4444')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 4: Feedback submitted ──────────────────
const ELABELS = { '😞':'Poor','😐':'Average','🙂':'Good','😊':'Great','🤩':'Excellent' };
const SCOL    = ['','#ef4444','#f97316','#f59e0b','#84cc16','#22c55e'];

const sendAdminFeedbackEmail = async (user, event, feedback) => {
  const admins  = await getAdminEmails();
  const stars   = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
  for (const admin of admins) {
    sendEmail({ to: admin.email, subject: `💬 New Feedback — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('New Feedback','#818cf8')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Feedback Submitted</h2>
        ${table(row('Volunteer',`<strong>${user.name}</strong>`) + row('Email',user.email) + row('Event',`<strong>${event.title}</strong>`) + row('Stars',`<span style="color:${SCOL[feedback.rating]};font-size:18px">${stars}</span> (${feedback.rating}/5)`) + row('Experience',`<span style="font-size:20px">${feedback.emoji}</span> ${ELABELS[feedback.emoji]||''}`) + (feedback.comment ? row('Comment',`<em>"${feedback.comment}"</em>`) : '') + row('Submitted', new Date().toLocaleString()))}
        ${btn('View Analytics', `${process.env.CLIENT_URL}/analytics`, '#818cf8')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 5: Event approved ──────────────────────
const sendAdminApprovalNoticeEmail = async (admin, event) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    if (a.email === admin.email) continue;
    sendEmail({ to: a.email, subject: `✅ Event Approved — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Approved','#22c55e')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Now Live</h2>
        ${table(row('Event',`<strong>${event.title}</strong>`) + row('Date',fmtDate(event.date)) + row('Location',event.location) + row('Approved By',`${admin.name} (${admin.email})`) + row('Status',badge('Live','#22c55e')))}
        ${btn('View Event', process.env.CLIENT_URL, '#22c55e')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 6: Event deleted ───────────────────────
const sendAdminEventDeletedEmail = async (admin, event) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({ to: a.email, subject: `🗑️ Event Deleted — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Deleted','#ef4444')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Permanently Deleted</h2>
        ${table(row('Event',`<strong>${event.title}</strong>`) + row('Date',fmtDate(event.date)) + row('Deleted By',`${admin.name}`) + row('At', new Date().toLocaleString()))}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 7: Certificate generated ───────────────
const sendAdminCertificateEmail = async (user, event, certificateId) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({ to: a.email, subject: `🏆 Certificate Generated — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Certificate','#f59e0b')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Certificate Issued</h2>
        ${table(row('Volunteer',`<strong>${user.name}</strong>`) + row('Email',user.email) + row('Event',`<strong>${event.title}</strong>`) + row('Cert ID',`<code style="font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px">${certificateId}</code>`) + row('At', new Date().toLocaleString()))}
        ${btn('View Analytics', `${process.env.CLIENT_URL}/analytics`, '#f59e0b')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 8: New user signed up ──────────────────
const sendAdminUserRegisteredEmail = async (user) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({ to: a.email, subject: `👤 New User Registered — ${user.name}`,
      html: wrap(`<div style="margin-bottom:20px">${badge('New User','#818cf8')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">New Volunteer Joined</h2>
        ${table(row('Name',`<strong>${user.name}</strong>`) + row('Email',user.email) + row('Org',user.organization||'—') + row('Role',badge('Volunteer','#818cf8')) + row('At', new Date().toLocaleString()))}
        ${btn('View Users', process.env.CLIENT_URL, '#818cf8')}`)
    }).catch(console.error);
  }
};

// ─── ADMIN EMAIL 9: Event auto-completed ────────────────
const sendAdminEventCompletedEmail = async (event, participantCount) => {
  const admins = await getAdminEmails();
  for (const a of admins) {
    sendEmail({ to: a.email, subject: `🎉 Event Auto-Completed — "${event.title}"`,
      html: wrap(`<div style="margin-bottom:20px">${badge('Auto-Completed','#22c55e')}</div>
        <h2 style="color:#0f172a;margin:0 0 8px">Event Marked as Completed</h2>
        <p style="color:#475569">This event passed its scheduled date and has been automatically marked as completed.</p>
        ${table(row('Event',`<strong>${event.title}</strong>`) + row('Date',fmtDate(event.date)) + row('Participants',participantCount) + row('Completed At', new Date().toLocaleString()) + row('Status',badge('Completed','#22c55e')))}
        ${btn('View Analytics', `${process.env.CLIENT_URL}/analytics`, '#22c55e')}`)
    }).catch(console.error);
  }
};

module.exports = {
  sendEmail, sendWelcomeEmail, sendApprovalEmail, sendCertificateEmail,
  sendAdminNewEventEmail, sendAdminRegistrationEmail, sendAdminCancellationEmail,
  sendAdminFeedbackEmail, sendAdminApprovalNoticeEmail, sendAdminEventDeletedEmail,
  sendAdminCertificateEmail, sendAdminUserRegisteredEmail, sendAdminEventCompletedEmail,
};
