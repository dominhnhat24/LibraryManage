// [MIDDLEWARE PHÂN QUYỀN] Chặn request nếu người dùng hiện tại không có một trong các vai trò cho phép.
import ApiError from '../utils/api-error.js';

// [KIỂM TRA ROLE] Phải chạy sau verifyToken để sử dụng hồ sơ tài khoản đã nạp từ cơ sở dữ liệu.
export const checkRole = (...roles) => (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (!roles.includes(req.authUser.role)) {
        return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
};

// [KIỂM TRA PREMIUM] Premium còn hạn, VIP và admin mới được đọc nội dung sách trả phí.
export const checkPremium = (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (!req.authUser.hasActivePremium()) {
        return next(new ApiError(403, 'An active Premium subscription is required'));
    }
    return next();
};

// [KIỂM TRA TẢI OFFLINE] Chỉ VIP còn hạn hoặc admin có thể tải tệp sách riêng tư.
export const checkDownloadPermission = (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (!req.authUser.hasActiveVip()) {
        return next(new ApiError(403, 'An active VIP download permission is required'));
    }
    return next();
};
