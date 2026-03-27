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
// Hit GET /api/test-email in browser to confirm Brevo SMTP works on Render
app.get('/api/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  console.log('[TEST-EMAIL] SMTP_USER:', process.env.SMTP_USER || 'MISSING');
  console.log('[TEST-EMAIL] SMTP_PASS:', process.env.SMTP_PASS ? 'set' : 'MISSING');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      success: false,
      error: 'SMTP_USER or SMTP_PASS env variable is missing on this server.'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"MLF Debug" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,  // sends test email to yourself
      subject: '✅ Brevo SMTP Test — Render',
      html: `<h2>SMTP is working!</h2><p>This test email was sent from your Render deployment using Brevo SMTP.</p><p>Time: ${new Date().toISOString()}</p>`
    });

    console.log('[TEST-EMAIL] SUCCESS. Message ID:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[TEST-EMAIL] FAILED:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
