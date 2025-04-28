const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { STATUS } = require('../utils/utilFunctions');


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
    // Aadhaar number or mobile number of the claimant (encrypted/hashed for privacy)
    uniqueIdentifier: {
        type: String,
        required: [true, 'Unique identifier is required for claiming a bag'],
        index: true // Index for faster querying
    },
    // Type of identifier used (aadhaar or phone)
    identifierType: {
        type: String,
        enum: ['AADHAAR', 'PHONE', 'EMAIL', 'USER_ID'],
        required: true
    },
    // Status of the claim
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.COMPLETED
    },
}, { timestamps: true });

// Create a compound index to ensure one bag per user per cause
claimSchema.index({ causeID: 1, uniqueIdentifier: 1 }, { unique: true });


const Claim = mongoose.model('Claim', claimSchema);

module.exports = {
    Claim
}; 