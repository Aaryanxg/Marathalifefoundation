const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const createTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "asmr.bliss07@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password"
  }
});

exports.sendDonationEmail = async (email, name, amount) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: "Maratha Life Foundation",
    to: email,
    subject: "Donation Received ❤️",
    html: `
      <h2>Thank You ${name} 🙏</h2>
      <p>We have received your donation of ₹${amount}.</p>
      <p>Your support means a lot ❤️</p>
    `
  });
};

exports.sendVolunteerAlert = async (name, phone) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Maratha Life Foundation System",
      to: process.env.EMAIL_USER || "asmr.bliss07@gmail.com",
      subject: "⚠️ New Volunteer Registration",
      html: `
        <h2>New Volunteer Alert</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p>Please check the admin dashboard for full details.</p>
      `
    });
  } catch (err) {
    console.error("Failed to send volunteer alert:", err);
  }
};

exports.sendDocumentRequestAlert = async (name, documentRequested, phone) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Maratha Life Foundation System",
      to: process.env.EMAIL_USER || "asmr.bliss07@gmail.com",
      subject: "⚠️ New Document Request",
      html: `
        <h2>New Document Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Document:</b> ${documentRequested}</p>
        <p>Please fulfill this request via the admin dashboard.</p>
      `
    });
  } catch (err) {
    console.error("Failed to send document request alert:", err);
  }
};

exports.sendDocumentApproval = async (email, name, documentRequested, id) => {
  try {
    const filePath = path.join(__dirname, `document_${id}.pdf`);
    
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
      doc.text(`Issuance Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Issuance ID: ${id}`);
      
      doc.moveDown(4);
      doc.text("Approved By:", { align: "right" });
      doc.text("Admin Department", { align: "right" });
      doc.text("Maratha Life Foundation", { align: "right" });

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Maratha Life Foundation",
      to: email,
      subject: `Approved: Your Request for ${documentRequested}`,
      html: `
        <h2>Hello ${name},</h2>
        <p>Your request for the <b>${documentRequested}</b> has been approved.</p>
        <p>Please find the official document attached securely to this email.</p>
        <p>Warm regards,<br>Maratha Life Foundation</p>
      `,
      attachments: [
        {
          filename: `MLF_${documentRequested.replace(/\s+/g, "_")}.pdf`,
          path: filePath
        }
      ]
    });

    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Failed to delete temp document:", e);
    }

  } catch (err) {
    console.error("Failed to send approval email:", err);
  }
};

exports.sendDocumentRejection = async (email, name, documentRequested) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: "Maratha Life Foundation",
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
  } catch (err) {
    console.error("Failed to send rejection email:", err);
  }
};
