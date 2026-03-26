const Donation = require('../models/Donation');
const crypto = require('crypto');
const { sendReceipt } = require('../utils/sendReceipt');
const Razorpay = require('razorpay');

// @desc    Create a new donation
// @route   POST /api/donate
// @access  Public
exports.createDonation = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      amount,
      type,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // 🔐 VERIFY SIGNATURE
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    let method = 'Unknown';
    try {
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const paymentDetails = await rzp.payments.fetch(razorpay_payment_id);
      method = paymentDetails.method || 'Unknown';
    } catch (e) {
      console.error("Failed to fetch Razorpay payment method:", e);
    }

    // ✅ SAVE ONLY IF VERIFIED
    const donation = await Donation.create({
      name,
      email,
      phone,
      amount,
      type,
      razorpay_payment_id,
      paymentStatus: "success",
      method
    });

    try {
      await sendReceipt(req.body);
    } catch (emailErr) {
      console.error("Failed to send receipt email:", emailErr);
    }

    res.status(201).json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error("Donation Save Error:", error);
    res.status(500).json({ success: false });
  }
};

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private/Admin
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};
