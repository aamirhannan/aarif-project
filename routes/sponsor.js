const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
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
router.get('/causes', protect, getCauses);

/**
 * @route   POST /api/v1/sponsor/:causeId
 * @desc    Sponsor a cause by pledging tote bags
 * @access  Protected - requires authentication
 */
router.post('/:causeId', protect, sponsorCause);

/**
 * @route   GET /api/v1/sponsor/tracking/:userId
 * @desc    Get tracking details for a user's sponsorships
 * @access  Protected - requires authentication
 */
router.get('/tracking/:userId', protect, getSponsorTracking);

module.exports = router; 