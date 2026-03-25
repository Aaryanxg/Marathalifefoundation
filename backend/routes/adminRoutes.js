const express = require("express");
const Donation = require("../models/Donation");

const router = express.Router();

// approve donation
router.put("/approve/:id", async (req, res) => {
  try {
    await Donation.findByIdAndUpdate(req.params.id, {
      paymentStatus: "approved"
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
