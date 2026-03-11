// routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const { generateUserCertificate, getMyCertificates, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyCertificates);
router.post('/generate/:eventId', protect, generateUserCertificate);
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;
