class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

const isAppError = (error) => {
    return !!(error && typeof error.statusCode === 'number');
};

module.exports = { AppError, isAppError };
