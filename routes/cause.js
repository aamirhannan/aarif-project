const express = require('express');
const router = express.Router();
const causeController = require('../controllers/causeController');
const { protect, authorize, authnticateUser } = require('../middlewares/auth');
const { ROLES } = require('../models/AuthUser');
const { asyncHandler } = require('../middlewares/errorHandler');

// POST /api/v1/causes - Create a new cause (only for CAUSE_POSTER role)
router.post(
    '/causes',
    protect,
    authorize(ROLES.CAUSE_POSTER), protect,
    asyncHandler(causeController.createCause)
);

// GET /api/v1/causes/:userId - Get all causes created by a specific user
router.get(
    '/all-caused-by-user/:userId',
    protect,
    asyncHandler(causeController.getUserCauses)
);

// GET /api/v1/causes - Get all approved causes (public browsing)
router.get(
    '/causes',
    asyncHandler(causeController.getAllApprovedCauses)
);

// GET /api/v1/cause/share/:causeId - Get share link and QR code for a cause
router.get(
    '/cause/share/:causeId',
    asyncHandler(causeController.getShareableCause)
);

module.exports = router; 