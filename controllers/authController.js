const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/AuthUser');
const { successResponse, errorResponse } = require('../utils/response');
const ERROR_MESSAGE = require('../utils/errorMessage');
const { ROLES } = require('../utils/utilFunctions')

const mapRole = (inputRole) => {
    const roleMap = {
        'CAUSE_CREATOR': ROLES.CAUSE_CREATOR,
        'SPONSOR': ROLES.SPONSOR,
        'PUBLIC': ROLES.PUBLIC,
        'ADMIN': ROLES.ADMIN
    };
    return roleMap[inputRole.toUpperCase()] || null;
};

/**
 * Generate JWT token with userID
 * @param {string} userID - User's UUID
 * @returns {string} JWT token
 */
const generateToken = (userID) => {
    return jwt.sign({ userID: userID }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d',
    });
};


exports.register = async (req, res) => {
    try {
        const { name, mobNumber, email, password, role } = req.body;

        console.log(req.body);
        // Validation   
        if (!name || !password || !role) {
            return errorResponse(res, 400, ERROR_MESSAGE.INPUT_MISSING);
        }

        // Map the input role to system role
        const systemRole = mapRole(role);
        if (!systemRole) {
            return errorResponse(res, 400, ERROR_MESSAGE.INVALID_ROLE);
        }

        // Check if email is provided for non-public roles
        if (systemRole !== ROLES.PUBLIC && !email) {
            return errorResponse(res, 400, ERROR_MESSAGE.UNAUTHORIZED_ROLE);
        }

        // Check if user already exists with the same email
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return errorResponse(res, 400, ERROR_MESSAGE.USER_ALREADY_EXISTS);
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        try {
            // Create user
            const user = await User.create({
                name,
                mobNumber,
                email,
                password: hashedPassword,
                role: systemRole,
            });

            // Generate token using userID (UUID) instead of _id
            const token = generateToken(user.userID);

            // Return user data (excluding password)
            const userData = {
                _id: user._id,
                userID: user.userID,
                name: user.name,
                mobNumber: user.mobNumber,
                email: user.email,
                role: user.role,
                token
            };

            return successResponse(res, 201, ERROR_MESSAGE.USER_REGISTERED_SUCCESSFULLY, userData);
        } catch (createError) {
            // Handle Mongoose validation errors
            if (createError.name === 'ValidationError') {
                const validationErrors = Object.values(createError.errors).map(err => err.message);
                return errorResponse(res, 400, ERROR_MESSAGE.VALIDATION_ERROR, validationErrors.join(', '));
            }
            // Handle duplicate key errors
            if (createError.code === 11000) {
                return errorResponse(res, 400, ERROR_MESSAGE.DUPLICATE_VALUE);
            }
            throw createError; // Re-throw for the outer catch block
        }
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 500, ERROR_MESSAGE.SERVER_ERROR, error.message);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return errorResponse(res, 400, ERROR_MESSAGE.INPUT_MISSING);
        }

        try {
            // Find user by email
            const user = await User.findOne({ email });


            if (!user) {
                return errorResponse(res, 401, ERROR_MESSAGE.USER_NOT_FOUND);
            }

            // Check if user exists and password matches
            if (!(await bcrypt.compare(password, user.password))) {
                return errorResponse(res, 401, ERROR_MESSAGE.INVALID_CREDENTIALS);
            }

            // Generate token using userID (UUID) instead of _id
            const token = generateToken(user.userID);

            // Return user data (excluding password)
            const userData = {
                _id: user._id,
                userID: user.userID,
                name: user.name,
                mobNumber: user.mobNumber,
                email: user.email,
                role: user.role,
                loginComplete: user.loginComplete,
                aadhaarVerified: user.aadhaarVerified,
                mobileVerified: user.mobileVerified,
                token
            };

            return successResponse(res, 200, ERROR_MESSAGE.LOGIN_SUCCESSFUL, userData);
        } catch (dbError) {
            console.error('Database error during login:', dbError);
            return errorResponse(res, 500, ERROR_MESSAGE.DATABASE_ERROR, dbError.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 500, ERROR_MESSAGE.SERVER_ERROR, error.message);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = req.user;
        return successResponse(res, 200, 'User profile retrieved successfully', user);
    } catch (error) {
        console.error('Get profile error:', error);
        return errorResponse(res, 500, 'Server Error', error.message);
    }
}; 