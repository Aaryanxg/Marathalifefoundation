const express = require('express');
const router = express.Router();
const {
  createDocumentRequest,
  getDocumentRequests,
  updateDocumentRequestStatus,
} = require('../controllers/documentRequestController');

router.post('/', createDocumentRequest);
router.get('/', getDocumentRequests);
router.patch('/:id', updateDocumentRequestStatus);

module.exports = router;
