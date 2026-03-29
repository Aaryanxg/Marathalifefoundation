const express = require("express");
const { createRequest, getRequests, updateRequestStatus } = require("../controllers/documentController");

const router = express.Router();

router.post("/", createRequest);
// 2. Use the function directly here!
router.patch('/:id', updateRequestStatus);
router.get("/", getRequests);

module.exports = router;