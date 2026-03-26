const nodemailer = require("nodemailer");

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
