const crypto = require('crypto');
const { Cause, STATUS } = require('../models/Cause');
const { Sponsorship } = require('../models/Sponsorship');
const { Claim, CLAIM_STATUS } = require('../models/Claim');
const { UserVerification } = require('../models/UserVerification');
const { User } = require('../models/AuthUser');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Helper function to hash sensitive information
 * @param {string} data - The data to hash
 * @returns {string} - The hashed data
 */
const hashData = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Helper function to generate a random OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Helper function to select a sponsorship using FIFO method
 * @param {Array} sponsorships - List of available sponsorships
 * @returns {Object} - Selected sponsorship
 */
const selectSponsorshipFIFO = (sponsorships) => {
    // Sort by creation date (oldest first)
    sponsorships.sort((a, b) => a.createdAt - b.createdAt);

    // Return the first sponsorship that has available bags
    return sponsorships.find(s => s.bagsClaimed < s.bagCount);
};

/**
 * Verify a user's identity before allowing bag claim
 * @route POST /api/v1/claimer/verify-user
 * @access Public
 */
exports.verifyUser = async (req, res) => {
    try {
        const { aadhaar, phone, otp } = req.body;

        // Determine the verification type
        let identifierType, uniqueIdentifier;

        if (aadhaar) {
            identifierType = 'AADHAAR';
            uniqueIdentifier = aadhaar;

            // Basic Aadhaar format validation (12 digits)
            if (!/^\d{12}$/.test(aadhaar)) {
                return errorResponse(res, 400, 'Invalid Aadhaar format. Must be 12 digits');
            }
        } else if (phone) {
            identifierType = 'PHONE';
            uniqueIdentifier = phone;

            // Basic phone format validation (10 digits)
            if (!/^\d{10}$/.test(phone)) {
                return errorResponse(res, 400, 'Invalid phone format. Must be 10 digits');
            }
        } else {
            return errorResponse(res, 400, 'Either Aadhaar or phone is required');
        }

        // Hash the identifier for security
        const hashedIdentifier = hashData(uniqueIdentifier);

        // If this is the initial verification request (no OTP provided)
        if (!otp) {
            // Generate a new OTP
            const newOTP = generateOTP();

            // Store verification record with hashed OTP
            const verification = await UserVerification.create({
                uniqueIdentifier: hashedIdentifier,
                identifierType,
                otpCode: hashData(newOTP),
                isVerified: false
            });

            // In a production environment, send the OTP via SMS or email
            // For demo purposes, we'll just return it in the response
            console.log(`OTP for ${identifierType}: ${newOTP}`);

            return successResponse(res, 200, 'OTP sent successfully', {
                sessionID: verification.sessionID,
                otpSent: true,
                // In a real app, you would NOT return the OTP
                // This is just for testing
                demo_otp: process.env.NODE_ENV === 'development' ? newOTP : undefined
            });
        }

        // If OTP is provided, verify it
        // Find the most recent verification session for this identifier
        const verification = await UserVerification.findOne({
            uniqueIdentifier: hashedIdentifier,
            identifierType,
            isVerified: false
        }).sort('-createdAt');

        if (!verification) {
            return errorResponse(res, 404, 'No pending verification found. Please request a new OTP');
        }

        // Check if the verification has expired
        if (verification.isExpired()) {
            return errorResponse(res, 400, 'OTP has expired. Please request a new one');
        }

        // Verify the OTP
        if (verification.otpCode !== hashData(otp)) {
            return errorResponse(res, 400, 'Invalid OTP');
        }

        // Mark as verified
        verification.isVerified = true;
        await verification.save();

        return successResponse(res, 200, 'User verified successfully', {
            sessionID: verification.sessionID,
            isVerified: true
        });
    } catch (error) {
        console.error('User verification error:', error);
        return errorResponse(res, 500, 'Error during user verification', error.message);
    }
};

/**
 * View cause details after scanning a QR code
 * @route GET /api/v1/claimer/cause/info/:causeId
 * @access Public
 */
exports.getCauseInfo = async (req, res) => {
    try {
        const { causeId } = req.params;

        // Find the cause
        const cause = await Cause.findOne({ causeID: causeId });

        // Check if cause exists
        if (!cause) {
            return errorResponse(res, 404, 'Cause not found');
        }

        // Check if cause is approved
        if (cause.status !== STATUS.APPROVED) {
            return errorResponse(res, 400, 'This cause is not available for claiming');
        }

        // Check if bags are available
        const isClaimable = cause.claimed > 0 && cause.claimed > cause.claimedCount;

        // Find sponsorships for this cause
        const sponsorships = await Sponsorship.find({ causeID: causeId });

        // Calculate total claimed bags
        const totalClaimed = sponsorships.reduce((sum, s) => sum + s.bagsClaimed, 0);

        // Get sponsor details if available
        const sponsorInfo = [];
        if (sponsorships.length > 0) {
            const userIds = [...new Set(sponsorships.map(s => s.userID))];
            const users = await User.find({ userID: { $in: userIds } }).select('name userID');

            const userMap = {};
            users.forEach(user => {
                userMap[user.userID] = user.name;
            });

            // Add sponsor names to the response
            sponsorInfo.push(...sponsorships.map(s => ({
                name: userMap[s.userID] || 'Anonymous Sponsor',
                message: s.message,
                bagCount: s.bagCount,
                bagsClaimed: s.bagsClaimed
            })));
        }

        return successResponse(res, 200, 'Cause information retrieved successfully', {
            causeID: cause.causeID,
            title: cause.title,
            description: cause.description,
            totalSponsored: cause.claimed,
            bagsClaimed: totalClaimed,
            isClaimable,
            progress: cause.progressPercentage,
            isFullyFunded: cause.isFullyFunded,
            sponsors: sponsorInfo
        });
    } catch (error) {
        console.error('Get cause info error:', error);
        return errorResponse(res, 500, 'Error retrieving cause information', error.message);
    }
};

/**
 * Allow verified user to claim one tote bag
 * @route POST /api/v1/claimer/claim-bag/:causeId
 * @access Protected (requires login and verification)
 */
exports.claimBag = async (req, res) => {
    try {
        const { causeId } = req.params;
        const { sessionID, location } = req.body;

        // Get userID from authenticated user
        const userID = req.user.userID;

        if (!userID) {
            return errorResponse(res, 401, 'User authentication required for claiming a bag');
        }

        // Validate session ID
        if (!sessionID) {
            return errorResponse(res, 400, 'Session ID is required');
        }

        // Find the verification session
        const verification = await UserVerification.findOne({
            sessionID,
            isVerified: true
        });

        // Check if verification exists and is valid
        if (!verification) {
            return errorResponse(res, 401, 'User not verified. Please verify your identity first');
        }

        // Check if verification has expired
        if (verification.isExpired()) {
            return errorResponse(res, 401, 'Verification has expired. Please verify your identity again');
        }

        // Find the cause
        const cause = await Cause.findOne({ causeID: causeId });

        // Check if cause exists
        if (!cause) {
            return errorResponse(res, 404, 'Cause not found');
        }

        // Check if cause is approved
        if (cause.status !== STATUS.APPROVED) {
            return errorResponse(res, 400, 'This cause is not available for claiming');
        }

        // Check if user has already claimed a bag for this cause
        const existingClaim = await Claim.findOne({
            causeID: causeId,
            $or: [
                { uniqueIdentifier: verification.uniqueIdentifier },
                { userID: userID }
            ]
        });

        if (existingClaim) {
            return errorResponse(res, 400, 'You have already claimed a bag for this cause');
        }

        // Find sponsorships with available bags
        const sponsorships = await Sponsorship.find({
            causeID: causeId,
            $expr: { $lt: ["$bagsClaimed", "$bagCount"] }
        });

        // Check if any sponsorships have available bags
        if (sponsorships.length === 0) {
            return errorResponse(res, 400, 'No bags available to claim for this cause');
        }

        // Select a sponsorship using FIFO method
        const selectedSponsorship = selectSponsorshipFIFO(sponsorships);

        // If no suitable sponsorship found
        if (!selectedSponsorship) {
            return errorResponse(res, 400, 'No bags available to claim for this cause');
        }

        // Create the claim record
        const claim = await Claim.create({
            causeID: causeId,
            sponsorshipID: selectedSponsorship.sponsorshipID,
            userID: userID,
            uniqueIdentifier: verification.uniqueIdentifier,
            identifierType: verification.identifierType,
            location: location || null,
            status: CLAIM_STATUS.COMPLETED
        });

        // Update the sponsorship
        selectedSponsorship.bagsClaimed += 1;
        selectedSponsorship.lastClaimedAt = new Date();

        // Check if all bags are now claimed
        if (selectedSponsorship.bagsClaimed >= selectedSponsorship.bagCount) {
            selectedSponsorship.status = 'COMPLETED';
        }

        await selectedSponsorship.save();

        // Update claim count for the cause
        // Note: We're tracking claims separately as the 'claimed' field represents sponsored bags
        if (!cause.claimedCount) {
            cause.claimedCount = 0;
        }
        cause.claimedCount += 1;
        await cause.save();

        // Get sponsor info for the response
        const sponsor = await User.findOne({ userID: selectedSponsorship.userID }).select('name');

        // Get user info as well
        const user = await User.findOne({ userID: userID }).select('name');

        return successResponse(res, 200, 'Bag claimed successfully', {
            claimID: claim.claimID,
            claimedAt: claim.createdAt,
            causeTitle: cause.title,
            userName: user ? user.name : 'Unknown User',
            sponsorName: sponsor ? sponsor.name : 'Anonymous Sponsor',
            sponsorMessage: selectedSponsorship.message,
            totalClaimed: cause.claimedCount,
            totalSponsored: cause.claimed
        });
    } catch (error) {
        console.error('Claim bag error:', error);
        return errorResponse(res, 500, 'Error claiming bag', error.message);
    }
}; 