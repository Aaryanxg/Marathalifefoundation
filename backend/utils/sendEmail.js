const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── ENV GUARD ──────────────────────────────────────────────────────────────
console.log("[sendEmail] SMTP_USER present:", !!process.env.SMTP_USER);
console.log("[sendEmail] SMTP_PASS present:", !!process.env.SMTP_PASS);
console.log("[sendEmail] SMTP_FROM present:", !!process.env.SMTP_FROM);

const createTransporter = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER or SMTP_PASS env variable is missing. Check your .env file.");
  }

  // ✅ SWITCHED FROM BREVO TO GMAIL
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.SMTP_USER,   // Your Gmail: asmr.bliss07@gmail.com
      pass: process.env.SMTP_PASS    // Your App Pass: ndnhfxujvynqstyp
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log("[sendEmail] ✅ GMAIL SMTP connection verified successfully.");
  } catch (verifyErr) {
    console.error("[sendEmail] ❌ GMAIL SMTP verification FAILED:", verifyErr.message);
    throw verifyErr;
  }

  return transporter;
};

exports.sendDonationEmail = async (email, name, amount) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Donation Received ❤️",
      html: `
        <h2>Thank You ${name} 🙏</h2>
        <p>We have received your donation of ₹${amount}.</p>
        <p>Your support means a lot ❤️</p>
      `
    });
    console.log(`Donation email sent to ${email}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send donation email to ${email}:`, err.message);
  }
};

exports.sendVolunteerAlert = async (name, phone) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_FROM,
      subject: "⚠️ New Volunteer Registration",
      html: `
        <h2>New Volunteer Alert</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p>Please check the admin dashboard for full details.</p>
      `
    });
    console.log(`Volunteer alert email sent. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error("Failed to send volunteer alert:", err.message);
  }
};

exports.sendDocumentRequestAlert = async (name, documentRequested, phone) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_FROM,
      subject: "⚠️ New Document Request",
      html: `
        <h2>New Document Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Document:</b> ${documentRequested}</p>
        <p>Please fulfill this request via the admin dashboard.</p>
      `
    });
    console.log(`Document request alert email sent. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error("Failed to send document request alert:", err.message);
  }
};

exports.sendDocumentApproval = async (email, name, documentRequested, id) => {
  console.log(`[APPROVAL] ── Step 1: Approval triggered for ${email}, document: "${documentRequested}", id: ${id}`);
  
  const filePath = path.join(os.tmpdir(), `document_${id}.pdf`);

  try {
    // ── STEP 4: Generate PDF ─────────────────────────────────────────────────
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(24).text("Maratha Life Foundation", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(`Official Document: ${documentRequested}`, { align: "center", underline: true });
      doc.moveDown(2);
      doc.fontSize(12).text(`This document is officially issued to: ${name}`);
      doc.moveDown();
      doc.text(`Requested Document: ${documentRequested}`);
      doc.text(`Issuance Date: ${new Date().toLocaleDateString("en-IN")}`);
      doc.text(`Issuance ID: ${id}`);
      doc.moveDown(4);
      doc.text("Approved By:", { align: "right" });
      doc.text("Admin Department", { align: "right" });
      doc.text("Maratha Life Foundation", { align: "right" });
      doc.end();

      stream.on("finish", () => {
        console.log(`[APPROVAL] ── Step 4: PDF generated successfully at ${filePath}`);
        resolve();
      });
      stream.on("error", (err) => reject(err));
    });

    // ── STEP 5: Send Email ───────────────────────────────────────────────────
    console.log(`[APPROVAL] ── Step 5: Creating & verifying GMAIL transporter...`);
    const transporter = await createTransporter(); 

    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `✅ Approved: Your Request for ${documentRequested}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C24E38;">Hello ${name},</h2>
          <p>Your request for the <b>${documentRequested}</b> has been <b style="color:green;">approved</b>.</p>
          <p>Please find the official document attached securely to this email.</p>
          <br/>
          <p style="color:#555;">Warm regards,<br/><b>Maratha Life Foundation</b></p>
        </div>
      `,
      attachments: [
        {
          filename: `MLF_${documentRequested.replace(/\s+/g, "_")}.pdf`,
          path: filePath
        }
      ]
    });

    console.log(`[APPROVAL] ── Step 7: SUCCESS ✅ Email sent to ${email}. Message ID: ${info.messageId}`);

    // CLEANUP
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  } catch (err) {
    console.error(`[APPROVAL] ── FAILED ❌ Error during approval flow:`, err);
  }
};

exports.sendDocumentRejection = async (email, name, documentRequested) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Update on your Request for ${documentRequested}`,
      html: `
        <h2>Hello ${name},</h2>
        <p>Unfortunately, we are unable to approve your request for <b>${documentRequested}</b> at this time.</p>
        <p>Warm regards,<br>Maratha Life Foundation</p>
      `
    });
    console.log(`Rejection email sent to ${email}.`);
  } catch (err) {
    console.error(`Failed to send rejection email:`, err.message);
  }
};