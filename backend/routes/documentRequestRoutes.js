const express = require('express');
const router = express.Router();
const {
  createDocumentRequest,
  getDocumentRequests,
  updateDocumentRequestStatus,
} = require('../controllers/documentRequestController');

router.post('/document-request', createDocumentRequest);
router.get('/document-requests', getDocumentRequests);
router.patch('/document-requests/:id', updateDocumentRequestStatus);

module.exports = router;
