const DocumentRequest = require("../models/DocumentRequest");

exports.createRequest = async (req, res) => {
  try {
    const data = await DocumentRequest.create(req.body);
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
