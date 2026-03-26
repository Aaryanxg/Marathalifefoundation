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

  // Send Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "asmr.bliss07@gmail.com",
      pass: "your-app-password"
    }
  });

  await transporter.sendMail({
    from: "Maratha Life Foundation",
    to: email,
    subject: "Donation Receipt ❤️",
    text: "Thank you for your generous donation! Please find your official receipt attached.",
    attachments: [
      {
        filename: "receipt.pdf",
        path: filePath
      }
    ]
  });

  // Clean up
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Failed to delete temp receipt:", err);
  }
};
