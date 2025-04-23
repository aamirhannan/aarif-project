const { errorResponse } = require('../utils/response');

/**
 * Global error handler for unhandled errors
 */
exports.errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Default error status is 500
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Handle JSON parse errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON payload';
    }

    return errorResponse(res, statusCode, message, err);
};

/**
 * Catch 404 errors for routes that don't exist
 */
exports.notFound = (req, res, next) => {
    return errorResponse(res, 404, `Resource not found - ${req.originalUrl}`);
};

/**
 * Async handler to eliminate try-catch blocks
 * @param {Function} fn - Async function to wrap
 */
exports.asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next); 