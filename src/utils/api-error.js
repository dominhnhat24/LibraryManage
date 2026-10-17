// [UTIL] Lỗi HTTP có mã trạng thái để các controller chuyển lỗi qua bộ xử lý chung.
class ApiError extends Error {
    constructor(statusCode, message, violations = []) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.violations = violations;
    }
}

export default ApiError;
