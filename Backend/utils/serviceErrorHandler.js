const { sendError } = require('./responseHelper');
const { isAppError } = require('./appError');

const handleServiceError = (res, error, fallbackMessage = 'Đã xảy ra lỗi') => {
    if (isAppError(error)) {
        return sendError(res, error.message, error.statusCode);
    }
    if (error && error.name === 'ValidationError') {
        return sendError(res, error.message, 400);
    }
    return sendError(res, error?.message || fallbackMessage, 500);
};

module.exports = { handleServiceError };
