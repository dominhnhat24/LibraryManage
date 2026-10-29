import ApiError from '../utils/api-error.js';

// Hàm notFoundHandler: Chuyển endpoint chưa đăng ký thành phản hồi lỗi 404 thống nhất.
export const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Hàm errorHandler: Chuẩn hóa lỗi ứng dụng, Joi, Mongoose, JWT, upload và JSON parser thành JSON an toàn.
export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    const jwtError = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name);
    const mongooseValidationError = error.name === 'ValidationError';
    const duplicateKeyError = error.code === 11000;
    const castError = error.name === 'CastError';
    const multerError = error.name === 'MulterError';
    const invalidJson = error.type === 'entity.parse.failed';
    const oversizedBody = error.type === 'entity.too.large';
    const statusCode = error instanceof ApiError ? error.statusCode
        : jwtError ? 401
            : mongooseValidationError || castError || invalidJson ? 400
                : duplicateKeyError ? 409
                    : multerError ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
                        : oversizedBody ? 413 : 500;

    if (statusCode >= 500) console.error(`[ERROR] ${req.method} ${req.originalUrl}`, error);

    const message = error instanceof ApiError ? error.message
        : jwtError ? 'Access token is invalid or expired'
            : mongooseValidationError ? 'Request validation failed'
                : castError ? 'Invalid resource identifier'
                    : duplicateKeyError ? 'A record with that value already exists'
                        : multerError ? (error.code === 'LIMIT_FILE_SIZE'
                            ? req.path === '/me/avatar'
                                ? 'Avatar image exceeds the 5 MB limit'
                                : 'Uploaded file exceeds the 100 MiB limit'
                            : 'Invalid file upload')
                            : invalidJson ? 'Request body contains invalid JSON'
                                : oversizedBody ? 'Request body exceeds the size limit'
                                    : statusCode >= 500 ? 'Internal server error' : error.message;

    const response = { status: 'error', message };
    if (error instanceof ApiError && error.violations.length) response.violations = error.violations;
    if (mongooseValidationError) {
        response.violations = Object.values(error.errors)
            .map(({ path, message: detail }) => ({ field: path, message: detail }));
    }
    return res.status(statusCode).json(response);
};
