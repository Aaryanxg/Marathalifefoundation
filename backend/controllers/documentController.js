const DocumentRequest = require("../models/DocumentRequest");
const { sendReceipt } = require('../utils/sendReceipt');
const nodemailer = require('nodemailer'); // Make sure you ran: npm install nodemailer

exports.createRequest = async (req, res) => {
  try {
    const data = await DocumentRequest.create(req.body);
    
    try {
      await sendReceipt({
        name: req.body.name,
        email: req.body.email,
        amount: "Document Request",
        razorpay_payment_id: "REQ-" + Date.now()
      });
    } catch(emailErr) {
      console.error("Failed to send doc receipt:", emailErr);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const data = await DocumentRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// NEW: Handle Admin Approvals and Rejections
// NEW: Handle Admin Approvals and Rejections
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    console.log(`\n--- Processing Admin Request ---`);
    console.log(`Status changed to: ${status}`);

    // 1. Update the status in the database
    const docRequest = await DocumentRequest.findByIdAndUpdate(
      id, 
      { status: status }, 
      { new: true }
    );

    if (!docRequest) {
      console.log("❌ Request not found in database.");
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // 2. If the admin clicks "Approve", send the email!
    if (status === 'approved') {
      console.log(`📧 Preparing to send email to: ${docRequest.email}`);
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER, // 👈 Changed to match your .env!
          pass: process.env.SMTP_PASS  // 👈 Changed to match your .env!
        }
      });

      // Figure out which link to send based on what they asked for
      let documentLink = '';
      if (docRequest.documentRequested === '80G Certificate (PDF)') {
         documentLink = 'https://drive.google.com/your-real-80G-link'; 
      } else if (docRequest.documentRequested === '12AA') {
         documentLink = 'https://drive.google.com/your-real-12AA-link';
      } else if (docRequest.documentRequested === 'FCRA') {
         documentLink = 'https://drive.google.com/your-real-FCRA-link';
      } else {
         documentLink = 'https://drive.google.com/your-general-trust-details-link';
      }

      const mailOptions = {
        from: `"Maratha Life Foundation" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: docRequest.email,
        subject: `Approved: Your Request for ${docRequest.documentRequested}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #C24E38; margin-top: 0;">Request Approved</h2>
            <p>Hello <strong>${docRequest.name}</strong>,</p>
            <p>Your request to view our official <strong>${docRequest.documentRequested}</strong> has been verified and approved by the administrative team.</p>
            <p>You can securely access the document using the link below:</p>
            <a href="${documentLink}" style="display: inline-block; padding: 12px 24px; background-color: #C24E38; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0;">View Official Document</a>
            <p style="color: #555; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Thank you for your interest in maintaining transparency with the Maratha Life Foundation.
            </p>
          </div>
        `
      };

      console.log("⏳ Attempting to send email via Google...");
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email successfully sent! Message ID:", info.messageId);
    }

    // 3. Send success response back to the frontend
    res.json({ success: true, message: `Request successfully marked as ${status}.` });

  } catch (error) {
    console.error("ERROR processing document approval:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};