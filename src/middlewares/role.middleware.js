// Middleware phân quyền; ADMIN/USER chỉ là quyền truy cập, không đại diện cho gói thuê bao.
// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/middlewares/role.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';
// Import { ROLES } từ ../constants/roles.constant.js để dùng trong module.
import { ROLES } from '../constants/roles.constant.js';

// Hàm requireAdmin: Chỉ cho phép tài khoản có role ADMIN đi qua; phải chạy sau verifyToken.
/**
 * Hàm requireAdmin: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: next, ApiError.
 */
export const requireAdmin = (req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện !req.authUser đúng.
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    // if chỉ chạy nhánh này khi điều kiện req.authUser.role !== ROLES.ADMIN đúng.
    if (req.authUser.role !== ROLES.ADMIN) {
        // return kết thúc hàm và trả next(new ApiError(403, 'You do not have permission to perform this action') về nơi gọi.
        return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
};

// Hàm checkPremium: Cho phép đọc nội dung trả phí nếu hồ sơ có thuê bao Premium/VIP còn hiệu lực hoặc quyền Admin.
/**
 * Hàm checkPremium: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: next, ApiError, hasActivePremium.
 */
export const checkPremium = (req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện !req.authUser đúng.
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    // if chỉ chạy nhánh này khi điều kiện !req.authUser.hasActivePremium() đúng.
    if (!req.authUser.hasActivePremium()) {
        // return kết thúc hàm và trả next(new ApiError(403, 'An active Premium subscription is required')) về nơi gọi.
        return next(new ApiError(403, 'An active Premium subscription is required'));
    }
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
};

// Hàm checkDownloadPermission: Chỉ Premium còn hạn hoặc ADMIN mới được tải tệp riêng tư.
/**
 * Hàm checkDownloadPermission: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: next, ApiError, hasActivePremium.
 */
export const checkDownloadPermission = (req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện !req.authUser đúng.
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    // if chỉ chạy nhánh này khi điều kiện !req.authUser.hasActivePremium() đúng.
    if (!req.authUser.hasActivePremium()) {
        // return kết thúc hàm và trả next(new ApiError(403, 'An active Premium download permission is required') về nơi gọi.
        return next(new ApiError(403, 'An active Premium download permission is required'));
    }
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
};
