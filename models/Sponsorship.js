const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Sponsorship Schema
const sponsorshipSchema = new mongoose.Schema({
    // Unique identifier for the sponsorship
    sponsorshipID: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    // Reference to the cause being sponsored (using the cause's UUID)
    causeID: {
        type: String,
        required: [true, 'Cause ID is required']
    },
    // Reference to the user who created this sponsorship (using the user's UUID)
    userID: {
        type: String,
        required: [true, 'User ID is required']
    },
    // Number of bags being sponsored
    bagCount: {
        type: Number,
        required: [true, 'Number of bags is required'],
        min: [1, 'Must sponsor at least 1 bag']
    },
    // Optional branding message or info
    branding: {
        type: String,
        trim: true
    },
    // Optional custom message
    message: {
        type: String,
        trim: true
    },
    // Number of bags that have been claimed by recipients
    bagsClaimed: {
        type: Number,
        default: 0,
        min: 0
    },
    // Last time a bag was claimed from this sponsorship
    lastClaimedAt: {
        type: Date,
        default: null
    },
    // Status of the sponsorship
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

// Virtual field for progress percentage of bag claims
sponsorshipSchema.virtual('claimPercentage').get(function () {
    if (this.bagCount === 0) return 0;
    return Math.min(100, (this.bagsClaimed / this.bagCount) * 100).toFixed(2);
});

// Ensure virtuals are included when converting to JSON
sponsorshipSchema.set('toJSON', { virtuals: true });
sponsorshipSchema.set('toObject', { virtuals: true });

const Sponsorship = mongoose.model('Sponsorship', sponsorshipSchema);

module.exports = { Sponsorship }; 