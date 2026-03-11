// services/certificateService.js
// Generates a styled PDF certificate using PDFKit
// Embeds a QR code for verification

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const generateCertificate = async ({ userName, eventTitle, eventDate, eventLocation, certificateId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;

      // Background
      doc.rect(0, 0, W, H).fill('#0f172a');

      // Borders
      doc.rect(0, 0, W, 8).fill('#22d3ee');
      doc.rect(0, H - 8, W, 8).fill('#22d3ee');
      doc.rect(0, 0, 8, H).fill('#22d3ee');
      doc.rect(W - 8, 0, 8, H).fill('#22d3ee');
      doc.rect(20, 20, W - 40, H - 40).stroke('#334155').lineWidth(1);

      // Title
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#22d3ee');
      doc.text('CERTIFICATE OF PARTICIPATION', 0, 65, { align: 'center', characterSpacing: 4 });

      doc.font('Helvetica').fontSize(9).fillColor('#94a3b8');
      doc.text('Issued by NGO Events Platform', 0, 85, { align: 'center' });

      // Divider
      doc.moveTo(W * 0.3, 108).lineTo(W * 0.7, 108).stroke('#22d3ee').lineWidth(0.5);

      // Body text
      doc.font('Helvetica').fontSize(13).fillColor('#cbd5e1');
      doc.text('This is to certify that', 0, 128, { align: 'center' });

      // Name
      doc.font('Helvetica-Bold').fontSize(30).fillColor('#f1f5f9');
      doc.text(userName, 0, 152, { align: 'center' });

      const nameWidth = Math.min(doc.widthOfString(userName), W * 0.6);
      doc.moveTo((W - nameWidth) / 2, 190).lineTo((W + nameWidth) / 2, 190).stroke('#22d3ee').lineWidth(1);

      doc.font('Helvetica').fontSize(13).fillColor('#cbd5e1');
      doc.text('has successfully participated in', 0, 202, { align: 'center' });

      // Event title
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#38bdf8');
      doc.text(`"${eventTitle}"`, 0, 225, { align: 'center' });

      // Event details
      const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.font('Helvetica').fontSize(11).fillColor('#94a3b8');
      doc.text(`Date: ${formattedDate}   |   Location: ${eventLocation}`, 0, 258, { align: 'center' });

      // QR Code
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 80, margin: 1,
        color: { dark: '#22d3ee', light: '#0f172a' }
      });
      const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      doc.image(qrBuffer, W - 118, H - 118, { width: 68 });
      doc.font('Helvetica').fontSize(7).fillColor('#64748b');
      doc.text('Scan to verify', W - 118, H - 46, { width: 68, align: 'center' });

      // Certificate ID
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text(`Certificate ID: ${certificateId}`, 48, H - 38);

      // Signature line
      doc.moveTo(W * 0.32, H - 60).lineTo(W * 0.55, H - 60).stroke('#475569').lineWidth(0.5);
      doc.font('Helvetica').fontSize(9).fillColor('#64748b');
      doc.text('Authorized Signature', W * 0.32, H - 52, { width: W * 0.23, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificate };
