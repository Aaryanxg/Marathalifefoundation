const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── ENV GUARD (visible in Render startup logs) ──────────────────────────────
// Brevo SMTP uses TWO separate identities:
//   SMTP_USER  = Brevo SMTP login  (e.g. a6473d001@smtp-brevo.com)  ← auth only
//   SMTP_PASS  = Brevo SMTP key                                      ← auth only
//   SMTP_FROM  = verified sender   (e.g. asmr.bliss07@gmail.com)    ← from: field
console.log("[sendEmail] SMTP_USER present:", !!process.env.SMTP_USER);
console.log("[sendEmail] SMTP_PASS present:", !!process.env.SMTP_PASS);
console.log("[sendEmail] SMTP_FROM present:", !!process.env.SMTP_FROM);

const createTransporter = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER or SMTP_PASS env variable is missing. Check Render environment settings.");
  }
  if (!process.env.SMTP_FROM) {
    throw new Error("SMTP_FROM env variable is missing. Set it to your Brevo verified sender email (e.g. asmr.bliss07@gmail.com).");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,   // Brevo SMTP login (xxxxxxx@smtp-brevo.com)
      pass: process.env.SMTP_PASS    // Brevo SMTP key
    }
  });

  // Verify SMTP connection — logs clearly if auth/network fails
  try {
    await transporter.verify();
    console.log("[sendEmail] ✅ Brevo SMTP connection verified successfully.");
  } catch (verifyErr) {
    console.error("[sendEmail] ❌ Brevo SMTP verification FAILED:", verifyErr.message);
    throw verifyErr; // propagate so callers see the real error
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
  console.log(`[APPROVAL] ── Step 2: SMTP_USER(auth)=${process.env.SMTP_USER || 'MISSING!'} | SMTP_FROM(sender)=${process.env.SMTP_FROM || 'MISSING!'} | SMTP_PASS=${process.env.SMTP_PASS ? 'set' : 'MISSING!'}`);

  // Use /tmp which is always writable on Render (ephemeral filesystem)
  const filePath = path.join(os.tmpdir(), `document_${id}.pdf`);
  console.log(`[APPROVAL] ── Step 3: PDF will be written to: ${filePath}`);

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
      stream.on("error", (err) => {
        console.error(`[APPROVAL] ── Step 4 FAILED: PDF generation error:`, err);
        reject(err);
      });
    });

    // ── STEP 5: Send Email ───────────────────────────────────────────────────
    console.log(`[APPROVAL] ── Step 5: Creating & verifying Brevo SMTP transporter...`);
    const transporter = await createTransporter(); // verify() is called inside

    console.log(`[APPROVAL] ── Step 6: Sending approval email from ${process.env.SMTP_FROM} to ${email}...`);
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

    // ── CLEANUP ──────────────────────────────────────────────────────────────
    try {
      fs.unlinkSync(filePath);
      console.log(`[APPROVAL] ── Step 8: Temp PDF deleted from ${filePath}`);
    } catch (e) {
      console.warn(`[APPROVAL] ── Step 8 WARN: Could not delete temp PDF:`, e.message);
    }

  } catch (err) {
    console.error(`[APPROVAL] ── FAILED ❌ Error during approval email flow for ${email}:`);
    console.error(err);
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
        <p>Thank you for reaching out to us regarding the <b>${documentRequested}</b>.</p>
        <p>Unfortunately, we are unable to approve your request at this time as we could not verify your organizational details or purpose.</p>
        <p>Please feel free to submit a new request with more detailed information if you believe this is a mistake.</p>
        <p>Warm regards,<br>Maratha Life Foundation</p>
      `
    });
    console.log(`Document rejection email successfully sent to ${email}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send rejection email to ${email}. Error:`, err.message);
  }
};
