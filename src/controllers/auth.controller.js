// [CONTROLLER XÁC THỰC] Đăng ký, đăng nhập, làm mới cặp token và kết thúc refresh session.
import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { toUserDto } from '../utils/api-dto.js';
import { ROLES } from '../constants/roles.constant.js';
import { sendRegistrationOtp } from '../config/mailer.js';

// [BẢO VỆ TOKEN] Chỉ lưu SHA-256 của refresh token trong DB; token nguyên bản chỉ trả một lần cho client.
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const hashOtp = (otp) => createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

// Hàm createOtp: Sinh mã OTP 6 chữ số bằng bộ tạo số ngẫu nhiên mật mã an toàn.
const createOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

// Hàm sendOtpForUser: Lưu hash và thời hạn OTP trước khi gửi email, không lưu mã rõ trong cơ sở dữ liệu.
const sendOtpForUser = async (user, otp) => {
    const now = new Date();
    user.email_otp_hash = hashOtp(otp);
    user.email_otp_expires_at = new Date(now.getTime() + OTP_TTL_MS);
    user.email_otp_sent_at = now;
    user.email_otp_attempts = 0;
    await user.save();
    await sendRegistrationOtp(user.email, otp);
};

// [CẤP TOKEN] access token ngắn hạn và refresh token dài hạn có mục đích (token_use) tách biệt.
const createTokenPair = (userId, role) => {
    const accessToken = jwt.sign(
        { token_use: 'access', role, jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
    );
    const refreshToken = jwt.sign(
        { token_use: 'refresh', role, jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
    );
    return { accessToken, refreshToken };
};

// [LƯU PHIÊN] Ghi hash refresh token mới; chỉ gửi token nguyên bản trong response.
const issueTokenPair = async (user) => {
    const { accessToken, refreshToken } = createTokenPair(user.id, user.role);
    user.refresh_token_hash = hashToken(refreshToken);
    await user.save();
    return {
        access_token: accessToken,
        token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: process.env.ACCESS_TOKEN_TTL || '15m',
        user: toUserDto(user)
    };
};

// [XOAY PHIÊN NGUYÊN TỬ] Chỉ request đầu tiên dùng refresh token hiện tại được phép đổi sang phiên mới.
const rotateTokenPair = async (user, currentHash) => {
    const { accessToken, refreshToken } = createTokenPair(user.id, user.role);
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
        user: toUserDto(updatedUser)
    };
};

// Hàm register: Tạo tài khoản USER chưa xác minh, gửi OTP qua email và không cấp phiên trước khi xác minh.
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

    if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
        name, email, phone_number, password_hash, role: ROLES.USER, email_verified: false
    });
    try {
        await sendOtpForUser(user, createOtp());
    } catch (error) {
        await User.deleteOne({ _id: user._id, email_verified: false });
        throw error;
    }
    return res.status(201).json({
        status: 'success',
        message: 'Verification code sent to your email',
        data: { email: user.email, expires_in_seconds: OTP_TTL_MS / 1000 }
    });
});

// Hàm verifyEmail: Kiểm tra hạn và số lần thử OTP, xác minh email rồi mới cấp phiên đăng nhập.
export const verifyEmail = asyncHandler(async (req, res) => {
    const email = String(req.body.email).trim().toLowerCase();
    const { otp } = req.body;
    const user = await User.findOne({ email }).select(
        '+email_otp_hash +email_otp_expires_at +email_otp_attempts'
    );
    if (!user || user.email_verified || !user.email_otp_hash) {
        throw new ApiError(400, 'Verification code is invalid or expired');
    }
    if (user.email_otp_attempts >= OTP_MAX_ATTEMPTS) {
        throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
    }
    if (!user.email_otp_expires_at || user.email_otp_expires_at <= new Date()) {
        user.email_otp_hash = null;
        user.email_otp_expires_at = null;
        await user.save();
        throw new ApiError(400, 'Verification code is invalid or expired');
    }

    const expected = Buffer.from(user.email_otp_hash, 'hex');
    const candidate = Buffer.from(hashOtp(otp), 'hex');
    if (expected.length !== candidate.length || !timingSafeEqual(expected, candidate)) {
        const attempt = await User.updateOne({
            _id: user._id,
            email_otp_hash: user.email_otp_hash,
            email_otp_attempts: { $lt: OTP_MAX_ATTEMPTS }
        }, { $inc: { email_otp_attempts: 1 } });
        if (attempt.modifiedCount !== 1) {
            throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
        }
        throw new ApiError(400, 'Verification code is invalid or expired');
    }

    const verifiedUser = await User.findOneAndUpdate({
        _id: user._id,
        email_verified: false,
        email_otp_hash: user.email_otp_hash,
        email_otp_expires_at: { $gt: new Date() },
        email_otp_attempts: { $lt: OTP_MAX_ATTEMPTS }
    }, {
        $set: {
            email_verified: true,
            email_otp_hash: null,
            email_otp_expires_at: null,
            email_otp_sent_at: null,
            email_otp_attempts: 0
        }
    }, { new: true, runValidators: true });
    if (!verifiedUser) throw new ApiError(400, 'Verification code is invalid or expired');
    return res.json({
        status: 'success',
        message: 'Email verified successfully',
        data: await issueTokenPair(verifiedUser)
    });
});

// Hàm resendVerification: Gửi mã mới cho tài khoản chưa xác minh và áp dụng thời gian chờ để hạn chế lạm dụng.
export const resendVerification = asyncHandler(async (req, res) => {
    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ email }).select(
        '+email_otp_hash +email_otp_expires_at +email_otp_sent_at +email_otp_attempts'
    );
    const genericResponse = {
        status: 'success',
        message: 'If the account needs verification, a new code will be sent'
    };
    if (!user || user.email_verified) return res.json(genericResponse);

    const canResendAt = user.email_otp_sent_at
        ? user.email_otp_sent_at.getTime() + OTP_RESEND_DELAY_MS
        : 0;
    if (Date.now() < canResendAt) {
        return res.json({ ...genericResponse, retry_after_seconds: Math.ceil((canResendAt - Date.now()) / 1000) });
    }

    await sendOtpForUser(user, createOtp());
    return res.json(genericResponse);
});

// Hàm authenticateUser: Kiểm tra thông tin đăng nhập và trạng thái xác minh trước khi phân nhánh theo vai trò.
export const login = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();//nhận email từ req
    const password = req.body.password; //nhận pass từ req.body
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
    if (!user.email_verified) throw new ApiError(403, 'Verify your email before signing in');
    return res.json({ status: 'success', message: 'Login successful', data: await issueTokenPair(user) });
}
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
        || typeof claims.sub !== 'string' || !['ADMIN', 'USER'].includes(claims.role)) {
        throw new ApiError(401, 'Refresh token is invalid');
    }

    const user = await User.findById(claims.sub).select('+refresh_token_hash');
    if (!user || user.role !== claims.role) throw new ApiError(401, 'Refresh token role is no longer current');
    const stored = user?.refresh_token_hash;
    const candidateHash = Buffer.from(hashToken(token));
    const storedHash = stored ? Buffer.from(stored) : Buffer.alloc(candidateHash.length);
    if (!stored || storedHash.length !== candidateHash.length
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
    data: toUserDto(req.authUser)
}));

// Hàm adminLogin: Kiểm tra thông tin đăng nhập, xác minh quyền hạn (Admin) trước khi cấp phiên.
export const adminLogin = asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;

    // 1. Kiểm tra dữ liệu đầu vào (Validation)
    if (!email || typeof password !== 'string') {
        throw new ApiError(400, 'Request validation failed', [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
        ]);
    }

    // 2. Tìm user trong database và lấy thêm trường password_hash (vì mặc định select: false)
    const user = await User.findOne({ email }).select('+password_hash');
    if (!user || !(await user.verifyPassword(password))) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // 3. [QUAN TRỌNG] Kiểm tra xem tài khoản này có phải là Admin hay không
    if (user.role !== ROLES.ADMIN) {
        throw new ApiError(403, 'Access denied. Administrator privileges required.');
    }

    // 4. (Tùy chọn) Kiểm tra trạng thái kích hoạt email nếu hệ thống yêu cầu cả admin phải xác thực
    if (!user.email_verified) {
        throw new ApiError(403, 'Verify your email before signing in');
    }

    // 5. Cấp cặp token đăng nhập dành riêng cho Admin
    return res.json({
        status: 'success',
        message: 'Admin login successful',
        data: await issueTokenPair(user)
    });
});