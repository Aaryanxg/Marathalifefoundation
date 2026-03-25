const express = require("express");
const { createRequest, getRequests } = require("../controllers/documentController");

const router = express.Router();

router.post("/", createRequest);
router.get("/", getRequests);

module.exports = router;
