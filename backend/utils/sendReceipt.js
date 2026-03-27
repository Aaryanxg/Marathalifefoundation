const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.sendReceipt = async (data) => {
  const { name, email, amount, razorpay_payment_id } = data;
  const filePath = path.join(__dirname, `receipt_${razorpay_payment_id}.pdf`);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Maratha Life Foundation", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Donation Receipt");
    doc.text(`Name: ${name}`);
    doc.text(`Amount: ₹${amount}`);
    doc.text(`Payment ID: ${razorpay_payment_id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  // Send Email via Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Maratha Life Foundation" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Donation Receipt ❤️",
      html: `
        <h2>Thank You ${name} 🙏</h2>
        <p>We have received your donation of <b>₹${amount}</b>.</p>
        <p>Please find your official receipt attached.</p>
        <p>Your support means a lot ❤️<br>— Maratha Life Foundation</p>
      `,
      attachments: [
        {
          filename: "MLF_Donation_Receipt.pdf",
          path: filePath
        }
      ]
    });
    console.log(`Donation receipt email sent to ${email}. Message ID: ${info.messageId}`);
  } catch (mailErr) {
    console.error(`Failed to send donation receipt email to ${email}. Error:`, mailErr);
    throw mailErr;
  }

  // Clean up
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Failed to delete temp receipt:", err);
  }
};
