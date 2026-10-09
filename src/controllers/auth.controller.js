// [CONTROLLER XÁC THỰC] Đăng ký, đăng nhập, làm mới cặp token và kết thúc refresh session.
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// [BẢO VỆ TOKEN] Chỉ lưu SHA-256 của refresh token trong DB; token nguyên bản chỉ trả một lần cho client.
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// [CẤP TOKEN] access token ngắn hạn và refresh token dài hạn có mục đích (token_use) tách biệt.
const createTokenPair = (userId) => {
    const accessToken = jwt.sign(
        { token_use: 'access', jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
    );
    const refreshToken = jwt.sign(
        { token_use: 'refresh', jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
    );
    return { accessToken, refreshToken };
};

// [LƯU PHIÊN] Ghi hash refresh token mới; chỉ gửi token nguyên bản trong response.
const issueTokenPair = async (user) => {
    const { accessToken, refreshToken } = createTokenPair(user.id);
    user.refresh_token_hash = hashToken(refreshToken);
    await user.save();
    return {
        access_token: accessToken,
        token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_TTL || '15m',
        user: user.toPublicJSON()
    };
};

// [XOAY PHIÊN NGUYÊN TỬ] Chỉ request đầu tiên dùng refresh token hiện tại được phép đổi sang phiên mới.
const rotateTokenPair = async (user, currentHash) => {
    const { accessToken, refreshToken } = createTokenPair(user.id);
    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, refresh_token_hash: currentHash },
        { $set: { refresh_token_hash: hashToken(refreshToken) } },
        { new: true, runValidators: true }
    );
    if (!updatedUser) throw new ApiError(401, 'Refresh token has already been used');
    return {
        access_token: accessToken,
        token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_TTL || '15m',
        user: updatedUser.toPublicJSON()
    };
};

// [ĐĂNG KÝ] Chuẩn hóa dữ liệu, băm mật khẩu và luôn tạo tài khoản Free không cho client tự chọn role.
export const register = asyncHandler(async (req, res) => {
    const name = String(req.body.name || req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone_number = String(req.body.phone_number || '').trim();
    const password = req.body.password;
    
    const violations = [];
    if (!name || name.length > 100) violations.push({ field: 'name', message: 'Name is required and must be at most 100 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        violations.push({ field: 'email', message: 'A valid email address is required' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        violations.push({ field: 'password', message: 'Password must be between 8 and 128 characters' });
    }
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone_number, password_hash, role: 'free' });
    return res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: await issueTokenPair(user)
    });
});

// [ĐĂNG NHẬP] Dùng phản hồi sai thông tin chung để không tiết lộ email đã đăng ký hay chưa.
export const login = asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    if (!email || typeof password !== 'string') {
        throw new ApiError(400, 'Request validation failed', [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
        ]);
    }
    const user = await User.findOne({ email }).select('+password_hash');
    if (!user || !(await user.verifyPassword(password))) {
        throw new ApiError(401, 'Invalid email or password');
    }
    return res.json({ status: 'success', message: 'Login successful', data: await issueTokenPair(user) });
});

// [XOAY REFRESH TOKEN] Kiểm tra chữ ký/mục đích và đối chiếu hash với token đang được lưu trong tài khoản.
export const refresh = asyncHandler(async (req, res) => {
    const token = req.body.refresh_token;
    if (typeof token !== 'string' || !token) throw new ApiError(401, 'Refresh token is required');
    let claims;
    try {
        claims = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Refresh token is invalid or expired');
        }
        throw error;
    }
    if (!claims || typeof claims !== 'object' || claims.token_use !== 'refresh'
        || typeof claims.sub !== 'string') throw new ApiError(401, 'Refresh token is invalid');

    const user = await User.findById(claims.sub).select('+refresh_token_hash');
    const stored = user?.refresh_token_hash;
    const candidateHash = Buffer.from(hashToken(token));
    const storedHash = stored ? Buffer.from(stored) : Buffer.alloc(candidateHash.length);
    if (!user || !stored || storedHash.length !== candidateHash.length
        || !timingSafeEqual(candidateHash, storedHash)) {
        throw new ApiError(401, 'Refresh token has been revoked');
    }
    return res.json({ status: 'success', message: 'Token refreshed', data: await rotateTokenPair(user, stored) });
});

// [ĐĂNG XUẤT] Thu hồi refresh token hiện tại; access token ngắn hạn tự hết hiệu lực.
export const logout = asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.authUser._id }, { $set: { refresh_token_hash: null } });
    return res.json({ status: 'success', message: 'Logged out successfully' });
});

// [HỒ SƠ TÀI KHOẢN] Trả dữ liệu đã lọc, không bao giờ serialize trường bí mật của User.
export const profile = asyncHandler(async (req, res) => res.json({
    status: 'success',
    data: req.authUser.toPublicJSON()
}));
