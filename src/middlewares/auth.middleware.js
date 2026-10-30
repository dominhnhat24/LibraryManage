// [MIDDLEWARE XÁC THỰC] Kiểm chứng access token và nạp vai trò hiện tại từ MongoDB.
// Import jwt từ jsonwebtoken để dùng trong module.
/**
 * Tệp src/middlewares/auth.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import jwt from 'jsonwebtoken';
// Import User từ ../models/user.model.js để dùng trong module.
import User from '../models/user.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';

// Hàm verifyToken: Đọc Bearer access token, xác minh chữ ký/mục đích token và nạp tài khoản hiện hành từ MongoDB.
// Khai báo verifyToken nhận giá trị từ asyncHandler(async (req, res, next) => { const match = . const giữ biến không gán lại; let cho phép cập nhật.
export const verifyToken = asyncHandler(async (req, res, next) => {
    // Khai báo match nhận giá trị từ /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || ''. const giữ biến không gán lại; let cho phép cập nhật.
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    // if chỉ chạy nhánh này khi điều kiện !match đúng.
    if (!match) throw new ApiError(401, 'A valid Bearer access token is required');

    // Khai báo claims nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let claims;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Gọi/thực thi jwt.verify với các đối số để thực hiện thao tác: claims = jwt.verify(match[1], process.env.JWT_SECRET)
        claims = jwt.verify(match[1], process.env.JWT_SECRET);
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' đúng.
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(401, 'Access token is invalid or expired');
        }
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // if chỉ chạy nhánh này khi điều kiện !claims || typeof claims !== 'object' || claims.token_use !== 'access' || t đúng.
    if (!claims || typeof claims !== 'object' || claims.token_use !== 'access'
        || typeof claims.sub !== 'string' || !['ADMIN', 'USER'].includes(claims.role)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Access token is invalid');
    }
    // Khai báo user nhận giá trị từ await User.findById(claims.sub). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findById(claims.sub);
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) throw new ApiError(401, 'Account no longer exists');
    // if chỉ chạy nhánh này khi điều kiện claims.role !== user.role đúng.
    if (claims.role !== user.role) throw new ApiError(401, 'Access token role is no longer current');
    // Gọi/thực thi biểu thức để thực hiện thao tác: req.authUser = user
    req.authUser = user;
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
});

// Hàm optionalAuth: Cho phép đọc catalog công khai khi không có Authorization và xác minh token nếu client gửi kèm.
/**
 * Hàm optionalAuth: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: get, next, verifyToken.
 */
export const optionalAuth = (req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện !req.get('authorization') đúng.
    if (!req.get('authorization')) return next();
    // return kết thúc hàm và trả verifyToken(req, res, next) về nơi gọi.
    return verifyToken(req, res, next);
};
