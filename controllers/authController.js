const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/AuthUser');
const { successResponse, errorResponse } = require('../utils/response');


const mapRole = (inputRole) => {
    const roleMap = {
        'CAUSE_POSTER': ROLES.CAUSE_POSTER,
        'SPONSOR': ROLES.SPONSOR,
        'PUBLIC': ROLES.PUBLIC
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

        // Validation
        if (!name || !password || !role) {
            return errorResponse(res, 400, 'Please provide name, password and role');
        }

        // Map the input role to system role
        const systemRole = mapRole(role);
        if (!systemRole) {
            return errorResponse(res, 400, `Invalid role. Must be one of: causePoster, sponsor, public`);
        }

        // Check if email is provided for non-public roles
        if (systemRole !== ROLES.PUBLIC && !email) {
            return errorResponse(res, 400, 'Email is required for causePoster and sponsor roles');
        }

        // Check if user already exists with the same email
        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return errorResponse(res, 400, 'User with this email already exists');
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

            return successResponse(res, 201, 'User registered successfully', userData);
        } catch (createError) {
            // Handle Mongoose validation errors
            if (createError.name === 'ValidationError') {
                const validationErrors = Object.values(createError.errors).map(err => err.message);
                return errorResponse(res, 400, 'Validation Error', validationErrors.join(', '));
            }
            // Handle duplicate key errors
            if (createError.code === 11000) {
                return errorResponse(res, 400, 'Duplicate field value entered');
            }
            throw createError; // Re-throw for the outer catch block
        }
    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 500, 'Server Error', error.message);
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
            return errorResponse(res, 400, 'Please provide email and password');
        }

        try {
            // Find user by email
            const user = await User.findOne({ email });

            // Check if user exists and password matches
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return errorResponse(res, 401, 'Invalid credentials');
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

            return successResponse(res, 200, 'Login successful', userData);
        } catch (dbError) {
            console.error('Database error during login:', dbError);
            return errorResponse(res, 500, 'Error retrieving user data', dbError.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 500, 'Server Error', error.message);
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