const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['one-time', 'monthly'],
    default: 'one-time',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed', 'approved'],
    default: 'pending',
  },
  razorpay_payment_id: {
    type: String,
  },
  method: {
    type: String,
    default: 'N/A',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
