const nodemailer = require("nodemailer");

exports.sendDonationEmail = async (email, name, amount) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "asmr.bliss07@gmail.com",
      pass: "your-app-password"
    }
  });

  const mailOptions = {
    from: "Maratha Life Foundation",
    to: email,
    subject: "Donation Received ❤️",
    html: `
      <h2>Thank You ${name} 🙏</h2>
      <p>We have received your donation of ₹${amount}.</p>
      <p>Your support means a lot ❤️</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
