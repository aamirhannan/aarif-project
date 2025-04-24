const express = require('express');
const router = express.Router();
// const causeController = require('../controllers/causeController');
const { protect, authorize, authnticateUser } = require('../middlewares/auth');
const { ROLES } = require('../models/AuthUser');
const { asyncHandler } = require('../middlewares/errorHandler');
const { createCause, getUserCauses, getAllApprovedCauses, getShareableCause } = require('../controllers/causeController');

// POST /api/v1/causes - Create a new cause (only for CAUSE_POSTER role)
router.post('/causes', protect, createCause);

// GET /api/v1/causes/:userId - Get all causes created by a specific user
router.get('/all-caused-by-user/:userId', protect, getUserCauses);

// GET /api/v1/causes - Get all approved causes (public browsing)
// router.get('/causes', protect, getAllApprovedCauses);

// GET /api/v1/cause/share/:causeId - Get share link and QR code for a cause
router.get('/cause/share/:causeId', protect, getShareableCause);

module.exports = router; 