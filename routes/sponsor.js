const express = require('express');
const router = express.Router();
const { protect, sponsorOnly } = require('../middlewares/auth');
const {
    getCauses,
    sponsorCause,
    getSponsorTracking
} = require('../controllers/sponsorController');

/**
 * @route   GET /api/v1/sponsor/causes
 * @desc    Get all approved causes with optional filters for category and impact
 * @access  Public
 */
router.get('/causes', protect, sponsorOnly, getCauses);

/**
 * @route   POST /api/v1/sponsor/:causeId
 * @desc    Sponsor a cause by pledging tote bags
 * @access  Protected - requires authentication as SPONSOR
 */
router.post('/:causeId', protect, sponsorOnly, sponsorCause);

/**
 * @route   GET /api/v1/sponsor/tracking/:userId
 * @desc    Get tracking details for a user's sponsorships
 * @access  Protected - requires authentication as SPONSOR
 */
router.get('/tracking/:userId', protect, sponsorOnly, getSponsorTracking);

module.exports = router; 