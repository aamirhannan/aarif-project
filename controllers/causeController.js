const { Cause, STATUS } = require('../models/Cause');
const { successResponse, errorResponse } = require('../utils/response');
const QRCode = require('qrcode');
const { User } = require('../models/AuthUser');


createCause = async (req, res) => {
    try {
        // Get data from request body
        const {
            title,
            description,
            qty,
            singleItemPrice,
            category,
            impactLevel
        } = req.body;

        // Calculate total amount based on quantity and single item price
        const totalAmount = qty * singleItemPrice;

        // Create cause with user's userID (UUID) from authenticated user
        const cause = await Cause.create({
            title,
            description,
            qty,
            singleItemPrice,
            totalAmount,
            category,
            impactLevel,
            createdBy: req.user.userID // This is now a string UUID
        });

        return successResponse(
            res,
            201,
            'Cause created successfully. It will be reviewed by an admin.',
            cause
        );
    } catch (error) {
        console.error('Create cause error:', error);
        return errorResponse(res, 500, 'Error creating cause', error.message);
    }
};


getUserCauses = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all causes created by the specified user
        const causes = await Cause.find({ createdBy: userId })
            .sort({ createdAt: -1 });

        // If no causes found
        if (causes.length === 0) {
            return successResponse(res, 200, 'No causes found for this user', []);
        }

        // Get basic user info to attach to response
        try {
            const user = await User.findOne({ userID: userId }).select('name email userID');

            // Add user info to each cause
            const causesWithUserInfo = causes.map(cause => {
                const causeObj = cause.toObject();
                causeObj.userInfo = user ? {
                    name: user.name,
                    email: user.email,
                    userID: user.userID
                } : null;
                return causeObj;
            });

            return successResponse(res, 200, 'User causes retrieved successfully', causesWithUserInfo);
        } catch (userError) {
            console.error('Error getting user info:', userError);
            // Still return causes even if user info can't be retrieved
            return successResponse(res, 200, 'User causes retrieved successfully (without user info)', causes);
        }
    } catch (error) {
        console.error('Get user causes error:', error);
        return errorResponse(res, 500, 'Error retrieving user causes', error.message);
    }
};


getAllApprovedCauses = async (req, res) => {
    try {
        // Add filtering, sorting, and pagination options
        const { category, sort = '-createdAt', page = 1, limit = 10 } = req.query;

        // Build query
        const query = { status: STATUS.APPROVED };

        // Add category filter if provided
        if (category) {
            query.category = category;
        }

        // Get total count for pagination
        const total = await Cause.countDocuments(query);

        // Find approved causes with pagination
        const causes = await Cause.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

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

        return successResponse(res, 200, 'Approved causes retrieved successfully', {
            causes: causesWithUserInfo,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get approved causes error:', error);
        return errorResponse(res, 500, 'Error retrieving approved causes', error.message);
    }
};


getShareableCause = async (req, res) => {
    try {
        const { causeId } = req.params;

        // Find the cause by ID
        const cause = await Cause.findOne({ causeID: causeId });

        if (!cause) {
            return errorResponse(res, 404, 'Cause not found');
        }

        // Reject if cause is not approved
        if (cause.status !== STATUS.APPROVED) {
            return errorResponse(res, 403, 'Cannot share cause that is not approved');
        }

        // Get user info for the cause creator
        try {
            const user = await User.findOne({ userID: cause.createdBy }).select('name email userID');
            if (user) {
                const causeObj = cause.toObject();
                causeObj.userInfo = {
                    name: user.name,
                    email: user.email,
                    userID: user.userID
                };

                // Generate shareable link (in a real app, use your frontend URL)
                const shareLink = `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/cause/${causeId}`;

                // Generate QR code as data URL
                let qrCodeDataURL;
                try {
                    qrCodeDataURL = await QRCode.toDataURL(shareLink);
                } catch (qrError) {
                    console.error('QR code generation error:', qrError);
                    qrCodeDataURL = null;
                }

                return successResponse(res, 200, 'Share link and QR code generated', {
                    cause: causeObj,
                    shareLink,
                    qrCode: qrCodeDataURL,
                    // You can also provide social share links
                    socialShares: {
                        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Support this cause: ${cause.title}`)}`,
                        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Support this cause: ${cause.title} ${shareLink}`)}`
                    }
                });
            }
        } catch (userError) {
            console.error('Error getting user info:', userError);
        }

        // If user info couldn't be retrieved, continue with just the cause
        // Generate shareable link (in a real app, use your frontend URL)
        const shareLink = `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/cause/${causeId}`;

        // Generate QR code as data URL
        let qrCodeDataURL;
        try {
            qrCodeDataURL = await QRCode.toDataURL(shareLink);
        } catch (qrError) {
            console.error('QR code generation error:', qrError);
            qrCodeDataURL = null;
        }

        return successResponse(res, 200, 'Share link and QR code generated', {
            cause,
            shareLink,
            qrCode: qrCodeDataURL,
            // You can also provide social share links
            socialShares: {
                twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Support this cause: ${cause.title}`)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                whatsapp: `https://wa.me/?text=${encodeURIComponent(`Support this cause: ${cause.title} ${shareLink}`)}`
            }
        });
    } catch (error) {
        console.error('Share cause error:', error);
        return errorResponse(res, 500, 'Error generating share link', error.message);
    }
};


module.exports = {
    createCause,
    getUserCauses,
    getAllApprovedCauses,
    getShareableCause
};

