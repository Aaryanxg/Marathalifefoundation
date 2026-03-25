const Volunteer = require("../models/Volunteer");

exports.createVolunteer = async (req, res) => {
  try {
    const data = await Volunteer.create(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getVolunteers = async (req, res) => {
  try {
    const data = await Volunteer.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
