// Chuẩn hóa bí danh vai trò và cung cấp middleware kiểm tra quyền truy cập theo vai trò.
import apiError from '../utils/api-error.js';

// Chuẩn hóa vai trò dạng chuỗi về chữ thường và ánh xạ admin sang librarian; kiểu khác giữ nguyên.
const normalizeRole = (role) => {
    if (typeof role !== 'string') return role;
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' ? 'librarian' : normalizedRole;
};

// Nhận danh sách vai trò được phép và trả middleware kiểm tra req.user; chuyển lỗi 401/403 qua next.
// Khi được phép, middleware gọi next() mà không gửi response.
export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Đảm bảo request đã qua loginRequired và có thông tin user
        if (!req.user) {
            return next(new apiError(401, 'Unauthorized: No user information found in request'));
        }

        // Kiểm tra role/roll của user có nằm trong danh sách được phép không
        // (Lưu ý: Kiểm tra key chính xác trong payload token của bạn là 'role' hay 'roll')
        const userRole = normalizeRole(req.user.role || req.user.roll);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

        if (!normalizedAllowedRoles.includes(userRole)) {
            return next(new apiError(403, 'Forbidden: You do not have permission to access this resource'));
        }

        next();
    };
};