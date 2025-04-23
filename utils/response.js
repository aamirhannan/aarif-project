/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
exports.successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} error - Error details
 */
exports.errorResponse = (res, statusCode = 500, message = 'Server Error', error = null) => {
    const response = {
        success: false,
        message
    };

    // Only include error details in development or if explicitly passed
    if (error) {
        if (process.env.NODE_ENV === 'development') {
            // Format different error types appropriately
            if (typeof error === 'object' && error.name === 'ValidationError' && error.errors) {
                // Handle Mongoose validation errors
                response.errors = Object.keys(error.errors).reduce((acc, key) => {
                    acc[key] = error.errors[key].message;
                    return acc;
                }, {});
            } else if (error.code === 11000) {
                // Handle Mongoose duplicate key errors
                response.error = 'Duplicate value entered';
                const field = Object.keys(error.keyValue)[0];
                response.field = field;
                response.value = error.keyValue[field];
            } else {
                // Handle other error types
                response.error = error.toString();
            }
        } else {
            // In production, just include a generic message
            response.error = 'An error occurred';
        }
    }

    return res.status(statusCode).json(response);
}; 