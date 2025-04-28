const express = require('express');
const router = express.Router();
const { protect, publicOnly } = require('../middlewares/auth');
const {
    verifyUser,
    getCauseInfo,
    claimBag,
    getCauseById,
    generateOTP,
    verifyOTP
} = require('../controllers/claimController');

/**
 * @route   POST /api/v1/claimer/verify-user
 * @desc    Verify a user's identity before allowing bag claim
 * @access  Public
 */


router.post('/generate-otp', generateOTP);

router.post('/verify-otp', verifyOTP);

/**
 * @route   GET /api/v1/claimer/cause/info/:causeId
 * @desc    View cause details after scanning a QR code
 * @access  Public
 */
router.get('/cause/info/:causeId', protect, publicOnly, getCauseInfo);

/**
 * @route   POST /api/v1/claimer/claim-bag/:causeId
 * @desc    Allow verified user to claim one tote bag
 * @access  Protected - requires authentication as PUBLIC or SPONSOR user and verification
 */
router.post('/claim-bag/:causeId', protect, publicOnly, claimBag);


// get cause by cause id
router.get('/cause/:causeId', getCauseById);

module.exports = router; 