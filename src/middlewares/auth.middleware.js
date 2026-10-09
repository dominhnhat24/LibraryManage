// [MIDDLEWARE XÁC THỰC] Kiểm chứng access token và nạp vai trò hiện tại từ MongoDB.
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// [KIỂM TRA ACCESS TOKEN] Chỉ chấp nhận token dùng cho truy cập, không chấp nhận refresh token tại API.
export const verifyToken = asyncHandler(async (req, res, next) => {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    if (!match) throw new ApiError(401, 'A valid Bearer access token is required');

    let claims;
    try {
        claims = jwt.verify(match[1], process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Access token is invalid or expired');
        }
        throw error;
    }
    if (!claims || typeof claims !== 'object' || claims.token_use !== 'access'
        || typeof claims.sub !== 'string') {
        throw new ApiError(401, 'Access token is invalid');
    }
    const user = await User.findById(claims.sub);
    if (!user) throw new ApiError(401, 'Account no longer exists');
    req.authUser = user;
    return next();
});

// [XÁC THỰC TÙY CHỌN] Cho phép đọc catalog công khai nhưng xác minh nếu request gửi Authorization.
export const optionalAuth = (req, res, next) => {
    if (!req.get('authorization')) return next();
    return verifyToken(req, res, next);
};
