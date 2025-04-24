const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Define status constants
const CLAIM_STATUS = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
};

// Claim Schema
const claimSchema = new mongoose.Schema({
    // Unique identifier for the claim
    claimID: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    // Reference to the cause being claimed (using the cause's UUID)
    causeID: {
        type: String,
        required: [true, 'Cause ID is required']
    },
    // Reference to the sponsorship being claimed (using the sponsorship's UUID)
    // This allows tracking which sponsor's bag was claimed
    sponsorshipID: {
        type: String,
        required: [true, 'Sponsorship ID is required']
    },
    // Reference to the logged-in user who claimed the bag (using the user's UUID)
    userID: {
        type: String,
        required: [true, 'User ID is required for claiming a bag']
    },
    // Aadhaar number or mobile number of the claimant (encrypted/hashed for privacy)
    uniqueIdentifier: {
        type: String,
        required: [true, 'Unique identifier is required for claiming a bag'],
        index: true // Index for faster querying
    },
    // Type of identifier used (aadhaar or phone)
    identifierType: {
        type: String,
        enum: ['AADHAAR', 'PHONE'],
        required: true
    },
    // Optional location data for analytics
    location: {
        type: {
            longitude: Number,
            latitude: Number,
            address: String
        },
        default: null
    },
    // Status of the claim
    status: {
        type: String,
        enum: Object.values(CLAIM_STATUS),
        default: CLAIM_STATUS.COMPLETED
    },
    // Optional notes or feedback from the claimant
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Create a compound index to ensure one bag per user per cause
claimSchema.index({ causeID: 1, uniqueIdentifier: 1 }, { unique: true });
// Also add an index for the userID for faster queries
claimSchema.index({ userID: 1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = {
    Claim,
    CLAIM_STATUS
}; 