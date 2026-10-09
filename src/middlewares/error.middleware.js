// [MIDDLEWARE LỖI] Chuẩn hóa lỗi nghiệp vụ, validation và lỗi nội bộ thành phản hồi API an toàn.
import ApiError from '../utils/api-error.js';

// [404] Chuyển request chưa được đăng ký thành lỗi thống nhất.
export const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// [PHẢN HỒI LỖI] Ẩn chi tiết nội bộ nhưng giữ thông tin kiểm tra đầu vào cho client.
export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const knownClientError = error instanceof ApiError || error.name === 'ValidationError'
        || error.name === 'CastError' || error.name === 'MulterError' || error.code === 11000
        || error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    if (!knownClientError) console.error(`[ERROR] ${req.method} ${req.originalUrl}`, error);
    if (error.name === 'ValidationError') {
        const violations = Object.values(error.errors).map(({ path, message }) => ({ field: path, message }));
        return res.status(400).json({ status: 'error', message: 'Request validation failed', violations });
    }
    if (error.code === 11000) {
        return res.status(409).json({ status: 'error', message: 'A record with that value already exists', violations: [] });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ status: 'error', message: 'Invalid resource identifier', violations: [] });
    }
    if (error.name === 'MulterError') {
        return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
            status: 'error',
            message: error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the 100 MiB limit' : 'Invalid file upload',
            violations: []
        });
    }
    const parserError = error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
    const statusCode = error instanceof ApiError ? error.statusCode
        : error.type === 'entity.too.large' ? 413
            : error.type === 'entity.parse.failed' ? 400 : 500;
    return res.status(statusCode).json({
        status: 'error',
        message: parserError ? (statusCode === 413 ? 'Request body exceeds the size limit' : 'Request body contains invalid JSON')
            : statusCode >= 500 ? 'Internal server error' : error.message,
        violations: error instanceof ApiError ? error.violations : []
    });
};
