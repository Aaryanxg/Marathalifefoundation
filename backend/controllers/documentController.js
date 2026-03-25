const DocumentRequest = require("../models/DocumentRequest");
const { sendReceipt } = require('../utils/sendReceipt');

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
