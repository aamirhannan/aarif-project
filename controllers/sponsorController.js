const { Cause } = require('../models/Cause');
const { Sponsorship } = require('../models/Sponsorship');
const { User } = require('../models/AuthUser');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get causes with optional filters for category and impact
 * @route GET /api/v1/sponsor/causes
 * @access Public
 */
exports.getCauses = async (req, res) => {
    try {
        // Extract query parameters
        const { category, impact, page = 1, limit = 10 } = req.query;

        // Build query with approved status
        const query = { status: 'approved' };

        // Add filters if provided
        if (category) query.category = category;
        if (impact) query.impactLevel = impact;

        // Get total count for pagination
        const total = await Cause.countDocuments(query);

        // Find causes matching the query with pagination
        const causes = await Cause.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // If no causes found
        if (causes.length === 0) {
            return successResponse(
                res,
                200,
                'No causes found matching the criteria',
                { causes: [], pagination: { total: 0, page: parseInt(page), pages: 0, limit: parseInt(limit) } }
            );
        }

        // Get all unique user IDs from the causes
        const userIds = [...new Set(causes.map(cause => cause.createdBy))];

        // Fetch user info for all creators in a single query
        const users = await User.find({ userID: { $in: userIds } }).select('name email userID');

        // Create a map for quick user lookup
        const userMap = {};
        users.forEach(user => {
            userMap[user.userID] = {
                name: user.name,
                email: user.email,
                userID: user.userID
            };
        });

        // Add user info to each cause
        const causesWithUserInfo = causes.map(cause => {
            const causeObj = cause.toObject();
            causeObj.userInfo = userMap[cause.createdBy] || null;
            return causeObj;
        });

        return successResponse(res, 200, 'Causes retrieved successfully', {
            causes: causesWithUserInfo,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get causes error:', error);
        return errorResponse(res, 500, 'Error retrieving causes', error.message);
    }
};

/**
 * Create a new sponsorship for a cause
 * @route POST /api/v1/sponsor/:causeId
 * @access Protected
 */
exports.sponsorCause = async (req, res) => {
    try {
        const { causeId } = req.params;
        const { sponsorId, bagCount, branding, message } = req.body;

        // Validate required fields
        if (!sponsorId || !bagCount) {
            return errorResponse(res, 400, 'Sponsor ID and bag count are required');
        }

        // Validate bagCount is a positive number
        if (bagCount <= 0 || !Number.isInteger(bagCount)) {
            return errorResponse(res, 400, 'Bag count must be a positive integer');
        }

        // Find the cause to sponsor
        const cause = await Cause.findOne({ causeID: causeId });

        // Check if cause exists
        if (!cause) {
            return errorResponse(res, 404, 'Cause not found');
        }

        // Check if cause is approved
        if (cause.status !== 'approved') {
            return errorResponse(res, 400, 'Cannot sponsor a cause that is not approved');
        }

        // Check if sponsoring user exists
        const sponsor = await User.findOne({ userID: sponsorId });
        if (!sponsor) {
            return errorResponse(res, 404, 'Sponsor user not found');
        }

        // Create the sponsorship
        const sponsorship = await Sponsorship.create({
            causeID: causeId,
            sponsorID: sponsorId,
            bagCount,
            branding,
            message
        });

        // Update cause totals
        cause.claimed += bagCount;
        cause.currentPrice += (bagCount * cause.singleItemPrice);
        await cause.save();

        return successResponse(res, 201, 'Sponsorship created successfully', {
            sponsorship,
            causeDetails: {
                title: cause.title,
                totalSponsored: cause.claimed,
                progress: cause.progressPercentage,
                isFullyFunded: cause.isFullyFunded
            }
        });
    } catch (error) {
        console.error('Sponsor cause error:', error);
        return errorResponse(res, 500, 'Error creating sponsorship', error.message);
    }
};

/**
 * Get tracking details for a sponsor's sponsorships
 * @route GET /api/v1/sponsor/tracking/:sponsorId
 * @access Protected
 */
exports.getSponsorTracking = async (req, res) => {
    try {
        const { sponsorId } = req.params;

        // Verify sponsor exists
        const sponsor = await User.findOne({ userID: sponsorId });
        if (!sponsor) {
            return errorResponse(res, 404, 'Sponsor not found');
        }

        // Find all sponsorships for this sponsor
        const sponsorships = await Sponsorship.find({ sponsorID: sponsorId })
            .sort('-createdAt');

        // If no sponsorships found
        if (sponsorships.length === 0) {
            return successResponse(res, 200, 'No sponsorships found for this sponsor', []);
        }

        // Get all unique cause IDs from the sponsorships
        const causeIds = [...new Set(sponsorships.map(s => s.causeID))];

        // Fetch cause info for all sponsorships in a single query
        const causes = await Cause.find({ causeID: { $in: causeIds } });

        // Create a map for quick cause lookup
        const causeMap = {};
        causes.forEach(cause => {
            causeMap[cause.causeID] = {
                title: cause.title,
                description: cause.description,
                category: cause.category,
                impactLevel: cause.impactLevel,
                status: cause.status
            };
        });

        // Combine sponsorship data with cause details
        const trackingData = sponsorships.map(sponsorship => {
            const sponsorshipObj = sponsorship.toObject();
            const causeInfo = causeMap[sponsorship.causeID] || { title: 'Unknown Cause' };

            return {
                sponsorshipID: sponsorshipObj.sponsorshipID,
                cause: causeInfo.title,
                causeDescription: causeInfo.description,
                causeCategory: causeInfo.category,
                causeImpact: causeInfo.impactLevel,
                bagsSponsored: sponsorshipObj.bagCount,
                bagsClaimed: sponsorshipObj.bagsClaimed,
                claimPercentage: sponsorshipObj.claimPercentage,
                status: sponsorshipObj.status,
                lastClaimedAt: sponsorshipObj.lastClaimedAt,
                createdAt: sponsorshipObj.createdAt
            };
        });

        return successResponse(res, 200, 'Sponsorship tracking data retrieved successfully', trackingData);
    } catch (error) {
        console.error('Get sponsor tracking error:', error);
        return errorResponse(res, 500, 'Error retrieving sponsorship tracking data', error.message);
    }
}; 