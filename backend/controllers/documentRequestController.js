const DocumentRequest = require('../models/DocumentRequest');
const { sendDocumentRequestAlert, sendDocumentApproval, sendDocumentRejection } = require('../utils/sendEmail');

// @desc    Create a new document request
// @route   POST /api/document-request
// @access  Public
const createDocumentRequest = async (req, res) => {
  try {
    const { name, phone, email, organization, documentRequested, purpose } = req.body;

    const request = new DocumentRequest({
      name,
      phone,
      email,
      organization,
      documentRequested,
      purpose,
      status: 'pending', // Default is pending
    });

    const savedRequest = await request.save();

    // Send email alert to NGO
    sendDocumentRequestAlert(name, documentRequested, phone);

    res.status(201).json({
      success: true,
      message: 'Document request submitted successfully',
      data: savedRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to submit document request',
      error: error.message,
    });
  }
};

// @desc    Get all document requests
// @route   GET /api/document-requests
// @access  Private/Admin
const getDocumentRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Update document request status
// @route   PATCH /api/document-requests/:id
// @access  Private/Admin
const updateDocumentRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log(`[CONTROLLER] PATCH received: id=${req.params.id}, status=${status}`);

    // Allowed statuses
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected.',
      });
    }

    const request = await DocumentRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      console.warn(`[CONTROLLER] Document request not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Document request not found',
      });
    }

    console.log(`[CONTROLLER] DB updated. Request email=${request.email}, name=${request.name}, doc=${request.documentRequested}`);

    // Email Triggers
    if (status === 'approved') {
      console.log(`[CONTROLLER] Triggering sendDocumentApproval for ${request.email}...`);
      await sendDocumentApproval(request.email, request.name, request.documentRequested, request._id);
      console.log(`[CONTROLLER] sendDocumentApproval completed for ${request.email}`);
    } else if (status === 'rejected') {
      console.log(`[CONTROLLER] Triggering sendDocumentRejection for ${request.email}...`);
      await sendDocumentRejection(request.email, request.name, request.documentRequested);
      console.log(`[CONTROLLER] sendDocumentRejection completed for ${request.email}`);
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: request,
    });
  } catch (error) {
    console.error(`[CONTROLLER] ERROR in updateDocumentRequestStatus:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

module.exports = {
  createDocumentRequest,
  getDocumentRequests,
  updateDocumentRequestStatus,
};
