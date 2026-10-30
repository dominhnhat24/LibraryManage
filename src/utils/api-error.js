// [UTIL] Lỗi HTTP có mã trạng thái để các controller chuyển lỗi qua bộ xử lý chung.
/**
 * Tệp src/utils/api-error.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
class ApiError extends Error {
    constructor(statusCode, message, violations = []) {
        // Gọi/thực thi super với các đối số để thực hiện thao tác: super(message)
        super(message);
        // Gọi/thực thi biểu thức để thực hiện thao tác: this.name = 'ApiError'
        this.name = 'ApiError';
        // Gọi/thực thi biểu thức để thực hiện thao tác: this.statusCode = statusCode
        this.statusCode = statusCode;
        // Gọi/thực thi biểu thức để thực hiện thao tác: this.violations = violations
        this.violations = violations;
    }
}

// export default cung cấp giá trị này để module khác import.
export default ApiError;
