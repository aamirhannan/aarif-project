const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/AuthUser');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to verify JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return errorResponse(res, 401, 'Not authorized, no token provided');
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            try {
                // Attach user to request - use userID instead of _id
                req.user = await User.findOne({ userID: decoded.userID }).select('-password');

                if (!req.user) {
                    return errorResponse(res, 401, 'User not found');
                }

                next();
            } catch (dbError) {
                console.error('Database error during authentication:', dbError);
                return errorResponse(res, 500, 'Error retrieving user data', dbError.message);
            }
        } catch (tokenError) {
            if (tokenError.name === 'JsonWebTokenError') {
                return errorResponse(res, 401, 'Invalid token');
            }

            if (tokenError.name === 'TokenExpiredError') {
                return errorResponse(res, 401, 'Token expired');
            }

            return errorResponse(res, 401, 'Authentication failed', tokenError.message);
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return errorResponse(res, 500, 'Server Error', error.message);
    }
};

/**
 * Middleware to check user role
 * @param {Array} roles - Array of allowed roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 401, 'User not authenticated');
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 403, `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${roles.join(', ')}`);
        }

        next();
    };
};

/**
 * Role-specific middleware helpers for cleaner route definitions
 */

// Allow access to only CAUSE_POSTER role
exports.causeCreatorOnly = (req, res, next) => exports.authorize(ROLES.CAUSE_POSTER)(req, res, next);

// Allow access to only SPONSOR role
exports.sponsorOnly = (req, res, next) => exports.authorize(ROLES.SPONSOR)(req, res, next);

// Allow access to only PUBLIC role
exports.publicOnly = (req, res, next) => exports.authorize(ROLES.PUBLIC)(req, res, next);

// Allow access to both SPONSOR and PUBLIC roles
exports.sponsorOrPublic = (req, res, next) => exports.authorize(ROLES.SPONSOR, ROLES.PUBLIC)(req, res, next);
