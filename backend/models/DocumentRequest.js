const mongoose = require("mongoose");

const docSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  organization: { type: String },
  documentRequested: { type: String, required: true },
  purpose: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("DocumentRequest", docSchema);
