class AppError extends Error {
    constructor(messageKey, statusCode, data = {}) {
        super(messageKey)
        this.statusCode=statusCode;
        this.status=`${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.data = this.data;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError