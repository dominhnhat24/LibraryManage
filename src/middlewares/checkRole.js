import apiError from '../utils/api-error.js';

const normalizeRole = (role) => {
    if (typeof role !== 'string') return role;
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' ? 'librarian' : normalizedRole;
};

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