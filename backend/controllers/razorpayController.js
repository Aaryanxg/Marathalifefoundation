const razorpay = require("../utils/razorpay");

// POST /api/create-order
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount provided." });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
};

module.exports = { createOrder };
