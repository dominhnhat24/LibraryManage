// Middleware phân quyền; ADMIN/USER chỉ là quyền truy cập, không đại diện cho gói thuê bao.
import ApiError from '../utils/api-error.js';
import { ROLES } from '../constants/roles.constant.js';

// Hàm requireAdmin: Chỉ cho phép tài khoản có role ADMIN đi qua; phải chạy sau verifyToken.
export const requireAdmin = (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (req.authUser.role !== ROLES.ADMIN) {
        return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
};

// Hàm checkPremium: Cho phép đọc nội dung trả phí nếu hồ sơ có thuê bao Premium/VIP còn hiệu lực hoặc quyền Admin.
export const checkPremium = (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (!req.authUser.hasActivePremium()) {
        return next(new ApiError(403, 'An active Premium subscription is required'));
    }
    return next();
};

// Hàm checkDownloadPermission: Chỉ cho phép tải tệp riêng tư khi VIP còn hạn hoặc tài khoản là Admin.
export const checkDownloadPermission = (req, res, next) => {
    if (!req.authUser) return next(new ApiError(401, 'Authentication is required'));
    if (!req.authUser.hasActiveVip()) {
        return next(new ApiError(403, 'An active VIP download permission is required'));
    }
    return next();
};
