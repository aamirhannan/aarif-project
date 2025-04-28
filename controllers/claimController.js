const crypto = require('crypto');
const axios = require('axios');
const { Cause } = require('../models/Cause');
const { Sponsorship } = require('../models/Sponsorship');
const { Claim } = require('../models/Claim');
const { User } = require('../models/AuthUser');
const { successResponse, errorResponse } = require('../utils/response');
const { STATUS } = require('../utils/utilFunctions');
/**
 * Helper function to hash sensitive information
 * @param {string} data - The data to hash
 * @returns {string} - The hashed data
 */
const hashData = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate OTP using MSG91 and send to user's mobile number
 * @route POST /api/v1/claimer/generate-otp
 * @access Public
 */
exports.generateOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return errorResponse(res, 400, 'Phone number is required');
        }

        // Basic phone format validation (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return errorResponse(res, 400, 'Invalid phone format. Must be 10 digits');
        }

        // Call MSG91 API to send OTP
        const response = await axios.get('https://control.msg91.com/api/v5/otp', {
            params: {
                authkey: process.env.MSG91_AUTH_KEY,
                mobile: `91${phone}`, // Adding country code for India
                template_id: process.env.MSG91_TEMPLATE_ID,
                otp_expiry: 5 // OTP expires in 5 minutes
            }
        });

        if (response.data && response.data.type === 'success') {
            return successResponse(res, 200, 'OTP sent successfully', {
                message: 'OTP sent to your mobile number',
                requestId: response.data.request_id,
                demo_otp: process.env.NODE_ENV === 'development' ? response.data.otp : undefined
            });
        } else {
            return errorResponse(res, 400, 'Failed to send OTP', response.data);
        }
    } catch (error) {
        console.error('Error sending OTP:', error.response?.data || error.message);
        return errorResponse(res, 500, 'Error sending OTP', error.message);
    }
};

/**
 * Verify OTP using MSG91
 * @route POST /api/v1/claimer/verify-otp
 * @access Public
 */
exports.claimBag = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return errorResponse(res, 400, 'Phone number and OTP are required');
        }

        // Basic phone format validation (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return errorResponse(res, 400, 'Invalid phone format. Must be 10 digits');
        }

        // Call MSG91 API to verify OTP
        const response = await axios.get('https://control.msg91.com/api/v5/otp/verify', {
            params: {
                authkey: process.env.MSG91_AUTH_KEY,
                mobile: `91${phone}`,
                otp: otp
            }
        });

        console.log("response", response);

        if (response.data && response.data.type === 'success') {
            const userID = req.user?.userID;

            if (userID) {
                const user = await User.findOne({ userID });
                if (user) {
                    if (user.mobNumber !== phone) {
                        user.mobNumber = phone;
                    }

                    user.mobileVerified = true;
                    user.loginComplete = true;
                    await user.save();
                }
            }

            return successResponse(res, 200, 'OTP verified successfully', {
                isVerified: true,
                message: 'Mobile number verified successfully'
            });
        } else {
            return errorResponse(res, 400, 'OTP verification failed', response.data);
        }
    } catch (error) {
        console.error('Error verifying OTP:', error.response?.data || error.message);
        return errorResponse(res, 500, 'Error verifying OTP', error.message);
    }
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
 * Verify a user's mobile number before allowing bag claim
 * @route POST /api/v1/claimer/verify-user
 * @access Public
 */
exports.verifyUser = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        // Get user ID from authenticated user
        const userID = req.user.userID;

        if (!userID) {
            return errorResponse(res, 401, 'User authentication required');
        }

        // Find the user
        const user = await User.findOne({ userID });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Validate phone number
        if (!phone) {
            return errorResponse(res, 400, 'Phone number is required');
        }

        // Basic phone format validation (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return errorResponse(res, 400, 'Invalid phone format. Must be 10 digits');
        }

        // If user's mobile number doesn't match the provided one, update it
        if (user.mobNumber !== phone) {
            user.mobNumber = phone;
            await user.save();
        }

        // If this is the initial verification request (no OTP provided)
        if (!otp) {
            // Generate a new OTP
            const newOTP = generateOTP();

            // Store OTP in session or temporary storage (in production, use Redis or similar)
            // For demo purposes, we're storing in local memory (not suitable for production)
            if (!global.otpStore) {
                global.otpStore = {};
            }

            global.otpStore[userID] = {
                otp: newOTP,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
            };

            // In a production environment, send the OTP via SMS
            console.log(`OTP for ${phone}: ${newOTP}`);

            return successResponse(res, 200, 'OTP sent successfully', {
                otpSent: true,
                // In a real app, you would NOT return the OTP
                // This is just for testing
                demo_otp: process.env.NODE_ENV === 'development' ? newOTP : undefined
            });
        }

        // If OTP is provided, verify it
        if (!global.otpStore || !global.otpStore[userID]) {
            return errorResponse(res, 404, 'No pending verification found. Please request a new OTP');
        }

        const storedOTP = global.otpStore[userID];

        // Check if the OTP has expired
        if (new Date() > storedOTP.expiresAt) {
            delete global.otpStore[userID];
            return errorResponse(res, 400, 'OTP has expired. Please request a new one');
        }

        // Verify the OTP
        if (storedOTP.otp !== otp) {
            return errorResponse(res, 400, 'Invalid OTP');
        }

        // Mark the user's mobile as verified
        user.mobileVerified = true;
        user.loginComplete = true;
        await user.save();

        // Clean up OTP store
        delete global.otpStore[userID];

        return successResponse(res, 200, 'Mobile number verified successfully', {
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
exports.verifyOTP = async (req, res) => {
    try {
        const { causeId, mobileNumber, otp } = req.body;

        // Find the cause
        const cause = await Cause.findOne({ causeID: causeId });

        console.log("cause", cause);
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
            uniqueIdentifier: mobileNumber,
            identifierType: 'PHONE'
        });

        if (existingClaim) {
            return errorResponse(res, 400, 'You have already claimed a bag for this cause');
        }

        // Call MSG91 API to verify OTP
        const response = await axios.get('https://control.msg91.com/api/v5/otp/verify', {
            params: {
                authkey: process.env.MSG91_AUTH_KEY,
                mobile: `91${mobileNumber}`,
                otp: otp
            }
        });

        if (response.status != 200 || response.data && response.data.type != 'success') {
            return errorResponse(res, 400, 'Invalid OTP');
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
            uniqueIdentifier: mobileNumber,
            identifierType: 'PHONE',
            status: STATUS.COMPLETED
        });

        // Update the sponsorship
        selectedSponsorship.bagsClaimed += 1;
        selectedSponsorship.lastClaimedAt = new Date();

        // Check if all bags are now claimed
        if (selectedSponsorship.bagsClaimed >= selectedSponsorship.bagCount) {
            selectedSponsorship.status = STATUS.COMPLETED;
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

        return successResponse(res, 200, 'Bag claimed successfully', {
            claimID: claim.claimID,
            claimedAt: claim.createdAt,
            causeTitle: cause.title,
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


exports.getCauseById = async (req, res) => {
    try {
        const { causeId } = req.params;

        const cause = await Cause.findOne({ causeID: causeId });

        if (!cause) {
            return errorResponse(res, 404, 'Cause not found');
        }
        return successResponse(res, 200, 'Cause found', cause);
    } catch (error) {
        console.error('Get cause by ID error:', error);
        return errorResponse(res, 500, 'Error getting cause by ID', error.message);
    }
}