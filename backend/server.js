require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({
  origin: "*", // TEMP FIX (later restrict)
}));
// Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());
app.use(express.json()); // Built-in middleware for parsing JSON

// MongoDB connection
connectDB();

const PORT = process.env.PORT || 5000;

// Routes
const donationRoutes = require('./routes/donationRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const documentRequestRoutes = require('./routes/documentRequestRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routes
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', razorpayRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// ── SMTP DEBUG ROUTE ─────────────────────────────────────────────────────────
// Hit GET /api/test-email in your browser to independently confirm Brevo SMTP works
app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');

  // Log all three required env vars
  console.log('[TEST-EMAIL] SMTP_USER (Brevo auth login):', process.env.SMTP_USER || 'MISSING');
  console.log('[TEST-EMAIL] SMTP_PASS:', process.env.SMTP_PASS ? 'set' : 'MISSING');
  console.log('[TEST-EMAIL] SMTP_FROM (verified sender):', process.env.SMTP_FROM || 'MISSING');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
    return res.status(500).json({
      success: false,
      error: 'One or more SMTP env variables are missing.',
      detail: {
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        SMTP_FROM: !!process.env.SMTP_FROM
      }
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,   // Brevo SMTP login (e.g. a6473d001@smtp-brevo.com)
        pass: process.env.SMTP_PASS    // Brevo SMTP key
      }
    });

    // Step 1: Verify the SMTP connection before sending
    console.log('[TEST-EMAIL] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[TEST-EMAIL] ✅ SMTP connection verified.');

    // Step 2: Send a test email to the verified sender address
    console.log('[TEST-EMAIL] Sending test email...');
    const info = await transporter.sendMail({
      from: `"MLF Debug" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_FROM,
      subject: '✅ Brevo SMTP Test — Render',
      html: `<h2>SMTP is working!</h2><p>Sent from <b>${process.env.SMTP_FROM}</b> via Brevo relay.</p><p>Time: ${new Date().toISOString()}</p>`
    });

    console.log('[TEST-EMAIL] ✅ SUCCESS. Message ID:', info.messageId);
    res.json({ success: true, messageId: info.messageId, from: process.env.SMTP_FROM });
  } catch (err) {
    console.error('[TEST-EMAIL] ❌ FAILED:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
