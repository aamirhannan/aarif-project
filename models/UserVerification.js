const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// UserVerification Schema
const userVerificationSchema = new mongoose.Schema({
    // Unique session identifier
    sessionID: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    // Aadhaar number or mobile number (encrypted/hashed for privacy)
    uniqueIdentifier: {
        type: String,
        required: [true, 'Unique identifier is required'],
        index: true
    },
    // Type of identifier used (aadhaar or phone)
    identifierType: {
        type: String,
        enum: ['AADHAAR', 'PHONE'],
        required: true
    },
    // OTP code sent to the user (hashed)
    otpCode: {
        type: String
    },
    // Whether the user is verified
    isVerified: {
        type: Boolean,
        default: false
    },
    // When the verification expires (typically 10-15 minutes)
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    }
}, { timestamps: true });

// Index to allow quick cleanup of expired sessions
userVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if the verification session is expired
userVerificationSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};

const UserVerification = mongoose.model('UserVerification', userVerificationSchema);

module.exports = { UserVerification }; 