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

    return res.status(statusCode).json(response);
}; 