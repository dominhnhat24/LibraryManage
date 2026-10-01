// Chuẩn hóa lỗi ứng dụng và MongoDB/Mongoose thành phản hồi JSON có mã HTTP phù hợp.
// Global error handler for MongoDB/Mongoose
// Nhận error, req, res, next theo giao diện Express; ghi log một số lỗi và gửi phản hồi, không gọi middleware kế tiếp.
const errorHandler = (error, req, res, next) => {
    if (error.name !== 'ApiError' || error.statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl}`, error);
    }

    // 1. Lỗi tự định nghĩa (ApiError)
    if (error.name === 'ApiError') {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            violations: error.violations || []
        });
    }

    // 2. Lỗi Validation của Mongoose Schema (ví dụ: thiếu trường bắt buộc, sai kiểu dữ liệu)
    if (error.name === 'ValidationError') {
        const violations = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
        }));
        return res.status(400).json({
            status: 'error',
            message: 'Database validation failed',
            violations
        });
    }

    // 3. Lỗi trùng lặp dữ liệu MongoDB (Unique constraint violation - Code 11000)
    // Ví dụ: Đăng ký trùng email hoặc trùng cccd đã có trong DB
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || 'unknown';
        return res.status(400).json({
            status: 'error',
            message: 'Duplicate field value entered',
            violations: [
                {
                    field: field,
                    message: `The value for ${field} already exists`
                }
            ]
        });
    }

    // 4. Lỗi sai định dạng ID (CastError - ví dụ truyền _id không đúng chuẩn ObjectId của Mongo)
    if (error.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid resource identifier',
            violations: [
                {
                    field: error.path,
                    message: `Invalid format for ${error.path}`
                }
            ]
        });
    }

    // 5. Lỗi hệ thống mặc định (Internal Server Error)
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        violations: []
    });
};

export default errorHandler;