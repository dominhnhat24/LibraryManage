// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/middlewares/error.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';

// Hàm notFoundHandler: Chuyển endpoint chưa đăng ký thành phản hồi lỗi 404 thống nhất.
/**
 * Hàm notFoundHandler: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: next, ApiError.
 */
export const notFoundHandler = (req, res, next) => {
    // Gọi/thực thi next với các đối số để thực hiện thao tác: next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`)
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Hàm errorHandler: Chuẩn hóa lỗi ứng dụng, Joi, Mongoose, JWT, upload và JSON parser thành JSON an toàn.
/**
 * Hàm errorHandler: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: error, req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: next, includes, error, values, map, status, json.
 */
export const errorHandler = (error, req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện res.headersSent đúng.
    if (res.headersSent) return next(error);

    // Khai báo jwtError nhận giá trị từ ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeEr. const giữ biến không gán lại; let cho phép cập nhật.
    const jwtError = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name);
    // Khai báo mongooseValidationError nhận giá trị từ error.name === 'ValidationError'. const giữ biến không gán lại; let cho phép cập nhật.
    const mongooseValidationError = error.name === 'ValidationError';
    // Khai báo duplicateKeyError nhận giá trị từ error.code === 11000. const giữ biến không gán lại; let cho phép cập nhật.
    const duplicateKeyError = error.code === 11000;
    // Khai báo castError nhận giá trị từ error.name === 'CastError'. const giữ biến không gán lại; let cho phép cập nhật.
    const castError = error.name === 'CastError';
    // Khai báo multerError nhận giá trị từ error.name === 'MulterError'. const giữ biến không gán lại; let cho phép cập nhật.
    const multerError = error.name === 'MulterError';
    // Khai báo invalidJson nhận giá trị từ error.type === 'entity.parse.failed'. const giữ biến không gán lại; let cho phép cập nhật.
    const invalidJson = error.type === 'entity.parse.failed';
    // Khai báo oversizedBody nhận giá trị từ error.type === 'entity.too.large'. const giữ biến không gán lại; let cho phép cập nhật.
    const oversizedBody = error.type === 'entity.too.large';
    // Khai báo statusCode nhận giá trị từ error instanceof ApiError ? error.statusCode : jwtError. const giữ biến không gán lại; let cho phép cập nhật.
    const statusCode = error instanceof ApiError ? error.statusCode
        : jwtError ? 401
            : mongooseValidationError || castError || invalidJson ? 400
                : duplicateKeyError ? 409
                    : multerError ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
                        : oversizedBody ? 413 : 500;

    // if chỉ chạy nhánh này khi điều kiện statusCode >= 500 đúng.
    if (statusCode >= 500) console.error(`[ERROR] ${req.method} ${req.originalUrl}`, error);

    // Khai báo message nhận giá trị từ error instanceof ApiError ? error.message : jwtError ? . const giữ biến không gán lại; let cho phép cập nhật.
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

    // Khai báo response nhận giá trị từ { status: 'error', message }. const giữ biến không gán lại; let cho phép cập nhật.
    const response = { status: 'error', message };
    // if chỉ chạy nhánh này khi điều kiện error instanceof ApiError && error.violations.length đúng.
    if (error instanceof ApiError && error.violations.length) response.violations = error.violations;
    // if chỉ chạy nhánh này khi điều kiện mongooseValidationError đúng.
    if (mongooseValidationError) {
        // Gọi/thực thi Object.values với các đối số để thực hiện thao tác: response.violations = Object.values(error.errors) .map(({ path, message: de
        response.violations = Object.values(error.errors)
            .map(({ path, message: detail }) => ({ field: path, message: detail }));
    }
    // return kết thúc hàm và trả res.status(statusCode).json(response) về nơi gọi.
    return res.status(statusCode).json(response);
};
