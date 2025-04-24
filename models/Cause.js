const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Define status constants
const STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};

// Cause Schema
const causeSchema = new mongoose.Schema({
    // Unique identifier for the cause
    causeID: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    // Reference to the user who created this cause (using UUID instead of ObjectId)
    createdBy: {
        type: String, // Changed from ObjectId to String to store userID (UUID)
        required: true
    },
    // Title of the cause
    title: {
        type: String,
        required: [true, 'Please provide a title for the cause'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    // Detailed description of the cause
    description: {
        type: String,
        required: [true, 'Please provide a description for the cause'],
        trim: true
    },
    // Total quantity of tote bags requested
    qty: {
        type: Number,
        required: [true, 'Please specify the quantity of bags needed'],
        min: [1, 'Quantity must be at least 1']
    },
    // Number of bags that have been claimed/sponsored
    claimed: {
        type: Number,
        default: 0,
        min: 0
    },
    // Total amount needed for all bags
    totalAmount: {
        type: Number,
        required: [true, 'Please specify the total amount needed']
    },
    // Current amount that has been sponsored
    currentPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    // Price of a single tote bag
    singleItemPrice: {
        type: Number,
        required: [true, 'Please specify the price of a single bag']
    },
    // Optional category for the cause
    category: {
        type: String,
        trim: true
    },
    // Optional impact level of the cause
    impactLevel: {
        type: String,
        trim: true
    },
    // Status of the cause (pending, approved, rejected)
    status: {
        type: String,
        enum: Object.values(STATUS),
        default: STATUS.PENDING
    }
}, { timestamps: true });

// Virtual field for progress percentage
causeSchema.virtual('progressPercentage').get(function () {
    if (this.totalAmount === 0) return 0;
    return Math.min(100, (this.currentPrice / this.totalAmount) * 100).toFixed(2);
});

// Virtual field to check if cause is fully funded
causeSchema.virtual('isFullyFunded').get(function () {
    return this.currentPrice >= this.totalAmount;
});

// Ensure virtuals are included when converting to JSON
causeSchema.set('toJSON', { virtuals: true });
causeSchema.set('toObject', { virtuals: true });

const Cause = mongoose.model('Cause', causeSchema);

module.exports = {
    Cause,
    STATUS
}; 