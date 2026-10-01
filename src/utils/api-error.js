// Lỗi ứng dụng mang theo mã HTTP và các chi tiết vi phạm để middleware phản hồi thống nhất.
class ApiError extends Error {
    // Nhận mã trạng thái, thông điệp và danh sách vi phạm tùy chọn; tạo Error có thêm metadata.
    // Không gửi response; lỗi sẽ được chuyển đến error handler của Express.
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
