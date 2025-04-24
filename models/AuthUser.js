const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Define role constants to maintain consistency across the application
const ROLES = {
    CAUSE_POSTER: 'CAUSE_POSTER',
    SPONSOR: 'SPONSOR',
    PUBLIC: 'PUBLIC'
};

const authUserSchema = new mongoose.Schema({
    userID: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: String,
    mobNumber: String,
    email: { type: String, unique: true, sparse: true }, // Optional for public
    password: String, // Hashed
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true
    },
    loginComplete: { type: Boolean, default: false },
    aadhaarVerified: { type: Boolean, default: false },
    mobileVerified: { type: Boolean, default: false }, // Added field for mobile verification
}, { timestamps: true });

const User = mongoose.model('User', authUserSchema);

module.exports = {
    User,
    ROLES
}; 