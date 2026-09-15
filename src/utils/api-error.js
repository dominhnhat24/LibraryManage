class ApiError extends Error {
    constructor(statusCode, message, violations = []) {
        super(message);

        this.name = 'ApiError';
 
        // statusCode tells the global error handler which HTTP status to return.
        this.statusCode = statusCode;
        this.violations = violations;

        Error.captureStackTrace?.(this, this.constructor);
    }
}

export default ApiError;
