const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  duration: String,
}, { timestamps: true });

module.exports = mongoose.model("Volunteer", volunteerSchema);
