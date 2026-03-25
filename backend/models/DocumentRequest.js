const mongoose = require("mongoose");

const docSchema = new mongoose.Schema({
  name: String,
  documentRequested: String,
  status: {
    type: String,
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("DocumentRequest", docSchema);
