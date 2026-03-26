// services/certificateService.js
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

const generateCertificate = async ({ userName, eventTitle, eventDate, eventLocation, certificateId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size:          'A4',
        layout:        'landscape',
        margin:        0,
        autoFirstPage: true,
      });

      const buffers = [];
      doc.on('data',  chunk => buffers.push(chunk));
      doc.on('end',   ()    => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;

      // Background
      doc.rect(0, 0, W, H).fill('#0a0f1e');
      doc.circle(0, 0, 300).fill('#0e2a3a');
      doc.circle(W, H, 280).fill('#0e1f2e');

      // Outer border
      doc.rect(18, 18, W - 36, H - 36).lineWidth(2).stroke('#22d3ee');

      // Inner border
      doc.rect(26, 26, W - 52, H - 52).lineWidth(0.4).stroke('#1e3a4a');

      // Top & bottom accent bars
      doc.rect(18, 18, W - 36, 5).fill('#22d3ee');
      doc.rect(18, H - 23, W - 36, 5).fill('#22d3ee');

      // Corner dots
      [[40,40],[W-40,40],[40,H-40],[W-40,H-40]].forEach(([x,y]) => {
        doc.circle(x, y, 4).fill('#22d3ee');
      });

      // Header
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#22d3ee')
         .text('🌍  NGO EVENTS PLATFORM', 0, 46, { align: 'center', characterSpacing: 3 });

      // Divider
      doc.moveTo(W*0.35, 70).lineTo(W*0.65, 70).lineWidth(0.5).stroke('#1e4a5a');

      // Main title
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#f0f9ff')
         .text('CERTIFICATE', 0, 82, { align: 'center', characterSpacing: 8 });
      doc.font('Helvetica').fontSize(10).fillColor('#38bdf8')
         .text('OF  PARTICIPATION', 0, 116, { align: 'center', characterSpacing: 6 });

      // Decorative line
      doc.moveTo(W*0.25, 140).lineTo(W*0.38, 140).lineWidth(0.5).stroke('#22d3ee');
      doc.circle(W*0.5, 140, 3).fill('#22d3ee');
      doc.moveTo(W*0.62, 140).lineTo(W*0.75, 140).lineWidth(0.5).stroke('#22d3ee');

      // Presented to
      doc.font('Helvetica').fontSize(11).fillColor('#94a3b8')
         .text('This certificate is proudly presented to', 0, 158, { align: 'center' });

      // Recipient name
      doc.font('Helvetica-Bold').fontSize(34).fillColor('#ffffff')
         .text(userName, 0, 178, { align: 'center' });

      // Name underline
      const nameWidth = Math.min(doc.widthOfString(userName) * 0.9, W * 0.55);
      doc.moveTo((W-nameWidth)/2, 222).lineTo((W+nameWidth)/2, 222).lineWidth(1).stroke('#22d3ee');

      // Body
      doc.font('Helvetica').fontSize(11).fillColor('#94a3b8')
         .text('for successfully participating in the event', 0, 234, { align: 'center' });

      // Event title
      doc.font('Helvetica-Bold').fontSize(17).fillColor('#38bdf8')
         .text(`" ${eventTitle} "`, 60, 256, { align: 'center', width: W-120, lineBreak: false });

      // Event details
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      doc.font('Helvetica').fontSize(10).fillColor('#64748b')
         .text(`📅  ${formattedDate}     📍  ${eventLocation}`, 0, 290, { align: 'center' });

      // Divider
      doc.moveTo(60, 318).lineTo(W-60, 318).lineWidth(0.3).stroke('#1e3a4a');

      // Signature (left)
      doc.moveTo(110, 355).lineTo(270, 355).lineWidth(0.7).stroke('#334155');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#94a3b8')
         .text('Authorized Signatory', 110, 361, { width: 160, align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor('#475569')
         .text('NGO Events Platform', 110, 374, { width: 160, align: 'center' });

      // Center seal
      doc.circle(W/2, 346, 32).lineWidth(1.5).stroke('#22d3ee');
      doc.circle(W/2, 346, 26).lineWidth(0.5).stroke('#1e4a5a');
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#22d3ee').text('VERIFIED',    W/2-16, 340);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#94a3b8').text('CERTIFICATE', W/2-20, 350);
      doc.font('Helvetica').fontSize(6).fillColor('#475569').text('NGO EVENTS',      W/2-14, 360);

      // QR code (right)
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 80, margin: 1,
        color: { dark: '#22d3ee', light: '#0a0f1e' },
      });
      const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      doc.image(qrBuffer, W-175, 328, { width: 60 });
      doc.font('Helvetica').fontSize(7).fillColor('#475569')
         .text('Scan to verify', W-175, 391, { width: 60, align: 'center' });

      // Certificate ID
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
         .text(`Certificate ID: ${certificateId}`, 0, H-40, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificate };