// [CONTROLLER XÁC THỰC] Đăng ký, đăng nhập, làm mới cặp token và kết thúc refresh session.
// Import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } từ node:crypto để dùng trong module.
/**
 * Tệp src/controllers/auth.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
// Import jwt từ jsonwebtoken để dùng trong module.
import jwt from 'jsonwebtoken';
// Import bcrypt từ bcryptjs để dùng trong module.
import bcrypt from 'bcryptjs';
// Import User từ ../models/user.model.js để dùng trong module.
import User from '../models/user.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { toUserDto } từ ../utils/api-dto.js để dùng trong module.
import { toUserDto } from '../utils/api-dto.js';
// Import { ROLES } từ ../constants/roles.constant.js để dùng trong module.
import { ROLES } from '../constants/roles.constant.js';
// Import { sendPasswordChangeOtp, sendRegistrationOtp } từ ../config/mailer.js để dùng trong module.
import { sendPasswordChangeOtp, sendRegistrationOtp } from '../config/mailer.js';

// [BẢO VỆ TOKEN] Chỉ lưu SHA-256 của refresh token trong DB; token nguyên bản chỉ trả một lần cho client.
/**
 * Hàm hashToken: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: token.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createHash, update, digest.
 */
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
/**
 * Hàm hashOtp: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: otp.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createHmac, update, digest.
 */
const hashOtp = (otp) => createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');
// Khai báo OTP_TTL_MS nhận giá trị từ 5 * 60 * 1000. const giữ biến không gán lại; let cho phép cập nhật.
const OTP_TTL_MS = 5 * 60 * 1000;
// Khai báo OTP_RESEND_DELAY_MS nhận giá trị từ 60 * 1000. const giữ biến không gán lại; let cho phép cập nhật.
const OTP_RESEND_DELAY_MS = 60 * 1000;
// Khai báo OTP_MAX_ATTEMPTS nhận giá trị từ 5. const giữ biến không gán lại; let cho phép cập nhật.
const OTP_MAX_ATTEMPTS = 5;

// Hàm createOtp: Sinh mã OTP 6 chữ số bằng bộ tạo số ngẫu nhiên mật mã an toàn.
/**
 * Hàm createOtp: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: randomInt, toString, padStart.
 */
const createOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

// Hàm sendOtpForUser: Lưu hash và thời hạn OTP trước khi gửi email, không lưu mã rõ trong cơ sở dữ liệu.
/**
 * Hàm sendOtpForUser: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: user, otp.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Date, hashOtp, getTime, save, sendRegistrationOtp.
 */
const sendOtpForUser = async (user, otp) => {
    // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
    const now = new Date();
    // Gọi/thực thi hashOtp với các đối số để thực hiện thao tác: user.email_otp_hash = hashOtp(otp)
    user.email_otp_hash = hashOtp(otp);
    // Gọi/thực thi Date với các đối số để thực hiện thao tác: user.email_otp_expires_at = new Date(now.getTime() + OTP_TTL_MS)
    user.email_otp_expires_at = new Date(now.getTime() + OTP_TTL_MS);
    // Gọi/thực thi biểu thức để thực hiện thao tác: user.email_otp_sent_at = now
    user.email_otp_sent_at = now;
    // Gọi/thực thi biểu thức để thực hiện thao tác: user.email_otp_attempts = 0
    user.email_otp_attempts = 0;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save()
    await user.save();
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await sendRegistrationOtp(user.email, otp)
    await sendRegistrationOtp(user.email, otp);
};

// [CẤP TOKEN] access token ngắn hạn và refresh token dài hạn có mục đích (token_use) tách biệt.
/**
 * Hàm createTokenPair: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, role.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: sign, randomUUID.
 */
const createTokenPair = (userId, role) => {
    // Khai báo accessToken nhận giá trị từ jwt.sign( { token_use: 'access', role, jti: randomUUID(. const giữ biến không gán lại; let cho phép cập nhật.
    const accessToken = jwt.sign(
        { token_use: 'access', role, jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
    );
    // Khai báo refreshToken nhận giá trị từ jwt.sign( { token_use: 'refresh', role, jti: randomUUID. const giữ biến không gán lại; let cho phép cập nhật.
    const refreshToken = jwt.sign(
        { token_use: 'refresh', role, jti: randomUUID() },
        process.env.JWT_SECRET,
        { subject: userId, expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
    );
    // return kết thúc hàm và trả { accessToken, refreshToken } về nơi gọi.
    return { accessToken, refreshToken };
};

// [LƯU PHIÊN] Ghi hash refresh token mới; chỉ gửi token nguyên bản trong response.
/**
 * Hàm issueTokenPair: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: user.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createTokenPair, hashToken, save, toUserDto.
 */
const issueTokenPair = async (user) => {
    // Khai báo { accessToken, refreshToken } nhận giá trị từ createTokenPair(user.id, user.role). const giữ biến không gán lại; let cho phép cập nhật.
    const { accessToken, refreshToken } = createTokenPair(user.id, user.role);
    // Gọi/thực thi hashToken với các đối số để thực hiện thao tác: user.refresh_token_hash = hashToken(refreshToken)
    user.refresh_token_hash = hashToken(refreshToken);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save()
    await user.save();
    // return kết thúc hàm và trả { access_token: accessToken, token: accessToken, refresh_token: refreshToke về nơi gọi.
    return {
        // Trường access_token lưu accessToken làm giá trị trong object.
        access_token: accessToken,
        // Trường token lưu accessToken làm giá trị trong object.
        token: accessToken,
        // Trường refresh_token lưu refreshToken làm giá trị trong object.
        refresh_token: refreshToken,
        // Trường token_type lưu 'Bearer' làm giá trị trong object.
        token_type: 'Bearer',
        // Trường expires_in lưu process.env.ACCESS_TOKEN_TTL || '15m' làm giá trị trong object.
        expires_in: process.env.ACCESS_TOKEN_TTL || '15m',
        // Trường user lưu toUserDto(user) làm giá trị trong object.
        user: toUserDto(user)
    };
};

// [XOAY PHIÊN NGUYÊN TỬ] Chỉ request đầu tiên dùng refresh token hiện tại được phép đổi sang phiên mới.
/**
 * Hàm rotateTokenPair: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: user, currentHash.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createTokenPair, findOneAndUpdate, hashToken, ApiError, toUserDto.
 */
const rotateTokenPair = async (user, currentHash) => {
    // Khai báo { accessToken, refreshToken } nhận giá trị từ createTokenPair(user.id, user.role). const giữ biến không gán lại; let cho phép cập nhật.
    const { accessToken, refreshToken } = createTokenPair(user.id, user.role);
    // Khai báo updatedUser nhận giá trị từ await User.findOneAndUpdate( { _id: user._id, refresh_t. const giữ biến không gán lại; let cho phép cập nhật.
    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, refresh_token_hash: currentHash },
        { $set: { refresh_token_hash: hashToken(refreshToken) } },
        { new: true, runValidators: true }
    );
    // if chỉ chạy nhánh này khi điều kiện !updatedUser đúng.
    if (!updatedUser) throw new ApiError(401, 'Refresh token has already been used');
    // return kết thúc hàm và trả { access_token: accessToken, token: accessToken, refresh_token: refreshToke về nơi gọi.
    return {
        // Trường access_token lưu accessToken làm giá trị trong object.
        access_token: accessToken,
        // Trường token lưu accessToken làm giá trị trong object.
        token: accessToken,
        // Trường refresh_token lưu refreshToken làm giá trị trong object.
        refresh_token: refreshToken,
        // Trường token_type lưu 'Bearer' làm giá trị trong object.
        token_type: 'Bearer',
        // Trường expires_in lưu process.env.ACCESS_TOKEN_TTL || '15m' làm giá trị trong object.
        expires_in: process.env.ACCESS_TOKEN_TTL || '15m',
        // Trường user lưu toUserDto(updatedUser) làm giá trị trong object.
        user: toUserDto(updatedUser)
    };
};

// Hàm register: Tạo tài khoản USER chưa xác minh, gửi OTP qua email và không cấp phiên trước khi xác minh.
// Khai báo register nhận giá trị từ asyncHandler(async (req, res) => { const name = String(. const giữ biến không gán lại; let cho phép cập nhật.
export const register = asyncHandler(async (req, res) => {
    // Khai báo name nhận giá trị từ String(req.body.name || req.body.full_name || '').trim(. const giữ biến không gán lại; let cho phép cập nhật.
    const name = String(req.body.name || req.body.full_name || '').trim();
    // Khai báo email nhận giá trị từ String(req.body.email || '').trim().toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const email = String(req.body.email || '').trim().toLowerCase();
    // Khai báo phone_number nhận giá trị từ String(req.body.phone_number || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const phone_number = String(req.body.phone_number || '').trim();
    // Khai báo password nhận giá trị từ req.body.password. const giữ biến không gán lại; let cho phép cập nhật.
    const password = req.body.password;
    
    // Khai báo violations nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const violations = [];
    // if chỉ chạy nhánh này khi điều kiện !name || name.length > 100 đúng.
    if (!name || name.length > 100) violations.push({ field: 'name', message: 'Name is required and must be at most 100 characters' });
    // if chỉ chạy nhánh này khi điều kiện !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 đúng.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        // Gọi/thực thi violations.push với các đối số để thực hiện thao tác: violations.push({ field: 'email', message: 'A valid email address is requir
        violations.push({ field: 'email', message: 'A valid email address is required' });
    }
    // if chỉ chạy nhánh này khi điều kiện typeof password !== 'string' || password.length < 8 || password.length > 12 đúng.
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        // Gọi/thực thi violations.push với các đối số để thực hiện thao tác: violations.push({ field: 'password', message: 'Password must be between 8 a
        violations.push({ field: 'password', message: 'Password must be between 8 and 128 characters' });
    }
    // if chỉ chạy nhánh này khi điều kiện violations.length đúng.
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);

    // if chỉ chạy nhánh này khi điều kiện await User.exists({ email }) đúng.
    if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
    // Khai báo password_hash nhận giá trị từ await bcrypt.hash(password, 12). const giữ biến không gán lại; let cho phép cập nhật.
    const password_hash = await bcrypt.hash(password, 12);
    // Khai báo user nhận giá trị từ await User.create({ name, email, phone_number, password. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.create({
        // Khóa name nhận biến cùng tên làm giá trị.
        name, email, phone_number, password_hash, role: ROLES.USER, email_verified: false
    });
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await sendOtpForUser(user, createOtp())
        await sendOtpForUser(user, createOtp());
    } catch (error) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await User.deleteOne({ _id: user._id, email_verified: false })
        await User.deleteOne({ _id: user._id, email_verified: false });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', message: 'Verification code sent  về nơi gọi.
    return res.status(201).json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Verification code sent to your email' làm giá trị trong object.
        message: 'Verification code sent to your email',
        // Trường data lưu { email: user.email, expires_in_seconds: OTP_TTL_MS / 1 làm giá trị trong object.
        data: { email: user.email, expires_in_seconds: OTP_TTL_MS / 1000 }
    });
});

// Hàm verifyEmail: Kiểm tra hạn và số lần thử OTP, xác minh email rồi mới cấp phiên đăng nhập.
// Khai báo verifyEmail nhận giá trị từ asyncHandler(async (req, res) => { const email = String. const giữ biến không gán lại; let cho phép cập nhật.
export const verifyEmail = asyncHandler(async (req, res) => {
    // Khai báo email nhận giá trị từ String(req.body.email).trim().toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const email = String(req.body.email).trim().toLowerCase();
    // Khai báo { otp } nhận giá trị từ req.body. const giữ biến không gán lại; let cho phép cập nhật.
    const { otp } = req.body;
    // Khai báo user nhận giá trị từ await User.findOne({ email }).select( '+email_otp_hash . const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findOne({ email }).select(
        '+email_otp_hash +email_otp_expires_at +email_otp_attempts'
    );
    // if chỉ chạy nhánh này khi điều kiện !user || user.email_verified || !user.email_otp_hash đúng.
    if (!user || user.email_verified || !user.email_otp_hash) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Verification code is invalid or expired');
    }
    // if chỉ chạy nhánh này khi điều kiện user.email_otp_attempts >= OTP_MAX_ATTEMPTS đúng.
    if (user.email_otp_attempts >= OTP_MAX_ATTEMPTS) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
    }
    // if chỉ chạy nhánh này khi điều kiện !user.email_otp_expires_at || user.email_otp_expires_at <= new Date() đúng.
    if (!user.email_otp_expires_at || user.email_otp_expires_at <= new Date()) {
        // Gọi/thực thi biểu thức để thực hiện thao tác: user.email_otp_hash = null
        user.email_otp_hash = null;
        // Gọi/thực thi biểu thức để thực hiện thao tác: user.email_otp_expires_at = null
        user.email_otp_expires_at = null;
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save()
        await user.save();
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Verification code is invalid or expired');
    }

    // Khai báo expected nhận giá trị từ Buffer.from(user.email_otp_hash, 'hex'). const giữ biến không gán lại; let cho phép cập nhật.
    const expected = Buffer.from(user.email_otp_hash, 'hex');
    // Khai báo candidate nhận giá trị từ Buffer.from(hashOtp(otp), 'hex'). const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = Buffer.from(hashOtp(otp), 'hex');
    // if chỉ chạy nhánh này khi điều kiện expected.length !== candidate.length || !timingSafeEqual(expected, candidat đúng.
    if (expected.length !== candidate.length || !timingSafeEqual(expected, candidate)) {
        // Khai báo attempt nhận giá trị từ await User.updateOne({ _id: user._id, email_otp_hash: u. const giữ biến không gán lại; let cho phép cập nhật.
        const attempt = await User.updateOne({
            // Trường _id lưu user._id làm giá trị trong object.
            _id: user._id,
            // Trường email_otp_hash lưu user.email_otp_hash làm giá trị trong object.
            email_otp_hash: user.email_otp_hash,
            // Trường email_otp_attempts lưu { $lt: OTP_MAX_ATTEMPTS } làm giá trị trong object.
            email_otp_attempts: { $lt: OTP_MAX_ATTEMPTS }
        }, { $inc: { email_otp_attempts: 1 } });
        // if chỉ chạy nhánh này khi điều kiện attempt.modifiedCount !== 1 đúng.
        if (attempt.modifiedCount !== 1) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
        }
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Verification code is invalid or expired');
    }

    // Khai báo verifiedUser nhận giá trị từ await User.findOneAndUpdate({ _id: user._id, email_veri. const giữ biến không gán lại; let cho phép cập nhật.
    const verifiedUser = await User.findOneAndUpdate({
        // Trường _id lưu user._id làm giá trị trong object.
        _id: user._id,
        // Trường email_verified lưu false làm giá trị trong object.
        email_verified: false,
        // Trường email_otp_hash lưu user.email_otp_hash làm giá trị trong object.
        email_otp_hash: user.email_otp_hash,
        // Trường email_otp_expires_at lưu { $gt: new Date() } làm giá trị trong object.
        email_otp_expires_at: { $gt: new Date() },
        // Trường email_otp_attempts lưu { $lt: OTP_MAX_ATTEMPTS } làm giá trị trong object.
        email_otp_attempts: { $lt: OTP_MAX_ATTEMPTS }
    }, {
        // Trường $set lưu { email_verified: true, email_otp_hash: null, email_otp làm giá trị trong object.
        $set: {
            // Trường email_verified lưu true làm giá trị trong object.
            email_verified: true,
            // Trường email_otp_hash lưu null làm giá trị trong object.
            email_otp_hash: null,
            // Trường email_otp_expires_at lưu null làm giá trị trong object.
            email_otp_expires_at: null,
            // Trường email_otp_sent_at lưu null làm giá trị trong object.
            email_otp_sent_at: null,
            // Trường email_otp_attempts lưu 0 làm giá trị trong object.
            email_otp_attempts: 0
        }
    }, { new: true, runValidators: true });
    // if chỉ chạy nhánh này khi điều kiện !verifiedUser đúng.
    if (!verifiedUser) throw new ApiError(400, 'Verification code is invalid or expired');
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Email verified successfully', data: về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Email verified successfully' làm giá trị trong object.
        message: 'Email verified successfully',
        // Trường data lưu await issueTokenPair(verifiedUser) làm giá trị trong object.
        data: await issueTokenPair(verifiedUser)
    });
});

// Hàm resendVerification: Gửi mã mới cho tài khoản chưa xác minh và áp dụng thời gian chờ để hạn chế lạm dụng.
// Khai báo resendVerification nhận giá trị từ asyncHandler(async (req, res) => { const email = String. const giữ biến không gán lại; let cho phép cập nhật.
export const resendVerification = asyncHandler(async (req, res) => {
    // Khai báo email nhận giá trị từ String(req.body.email).trim().toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const email = String(req.body.email).trim().toLowerCase();
    // Khai báo user nhận giá trị từ await User.findOne({ email }).select( '+email_otp_hash . const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findOne({ email }).select(
        '+email_otp_hash +email_otp_expires_at +email_otp_sent_at +email_otp_attempts'
    );
    // Khai báo genericResponse nhận giá trị từ { status: 'success', message: 'If the account needs ver. const giữ biến không gán lại; let cho phép cập nhật.
    const genericResponse = {
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'If the account needs verification, a new code will be  làm giá trị trong object.
        message: 'If the account needs verification, a new code will be sent'
    };
    // if chỉ chạy nhánh này khi điều kiện !user || user.email_verified đúng.
    if (!user || user.email_verified) return res.json(genericResponse);

    // Khai báo canResendAt nhận giá trị từ user.email_otp_sent_at ? user.email_otp_sent_at.getTime. const giữ biến không gán lại; let cho phép cập nhật.
    const canResendAt = user.email_otp_sent_at
        ? user.email_otp_sent_at.getTime() + OTP_RESEND_DELAY_MS
        : 0;
    // if chỉ chạy nhánh này khi điều kiện Date.now() < canResendAt đúng.
    if (Date.now() < canResendAt) {
        // return kết thúc hàm và trả res.json({ ...genericResponse, retry_after_seconds: Math.ceil((canResendAt  về nơi gọi.
        return res.json({ ...genericResponse, retry_after_seconds: Math.ceil((canResendAt - Date.now()) / 1000) });
    }

    // await chờ tác vụ bất đồng bộ xong trước bước sau: await sendOtpForUser(user, createOtp())
    await sendOtpForUser(user, createOtp());
    // return kết thúc hàm và trả res.json(genericResponse) về nơi gọi.
    return res.json(genericResponse);
});

// Hàm authenticateUser: Kiểm tra thông tin đăng nhập và trạng thái xác minh trước khi phân nhánh theo vai trò.
/**
 * Hàm login: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, toLowerCase, ApiError, findOne, select, verifyPassword, json.
 */
export const login = async (req, res) => {
    // Khai báo email nhận giá trị từ String(req.body.email || '').trim().toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const email = String(req.body.email || '').trim().toLowerCase();//nhận email từ req
    // Khai báo password nhận giá trị từ req.body.password. const giữ biến không gán lại; let cho phép cập nhật.
    const password = req.body.password; //nhận pass từ req.body
    // if chỉ chạy nhánh này khi điều kiện !email || typeof password !== 'string' đúng.
    if (!email || typeof password !== 'string') {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Request validation failed', [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
        ]);
    }
    // Khai báo user nhận giá trị từ await User.findOne({ email }).select('+password_hash'). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findOne({ email }).select('+password_hash');
    // if chỉ chạy nhánh này khi điều kiện !user || !(await user.verifyPassword(password)) đúng.
    if (!user || !(await user.verifyPassword(password))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Invalid email or password');
    }
    // if chỉ chạy nhánh này khi điều kiện !user.email_verified đúng.
    if (!user.email_verified) throw new ApiError(403, 'Verify your email before signing in');
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Login successful', data: await issu về nơi gọi.
    return res.json({ status: 'success', message: 'Login successful', data: await issueTokenPair(user) });
}
// [XOAY REFRESH TOKEN] Kiểm tra chữ ký/mục đích và đối chiếu hash với token đang được lưu trong tài khoản.
// Khai báo refresh nhận giá trị từ asyncHandler(async (req, res) => { const token = req.bo. const giữ biến không gán lại; let cho phép cập nhật.
export const refresh = asyncHandler(async (req, res) => {
    // Khai báo token nhận giá trị từ req.body.refresh_token. const giữ biến không gán lại; let cho phép cập nhật.
    const token = req.body.refresh_token;
    // if chỉ chạy nhánh này khi điều kiện typeof token !== 'string' || !token đúng.
    if (typeof token !== 'string' || !token) throw new ApiError(401, 'Refresh token is required');
    // Khai báo claims nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let claims;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Gọi/thực thi jwt.verify với các đối số để thực hiện thao tác: claims = jwt.verify(token, process.env.JWT_SECRET)
        claims = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' đúng.
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(401, 'Refresh token is invalid or expired');
        }
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // if chỉ chạy nhánh này khi điều kiện !claims || typeof claims !== 'object' || claims.token_use !== 'refresh' ||  đúng.
    if (!claims || typeof claims !== 'object' || claims.token_use !== 'refresh'
        || typeof claims.sub !== 'string' || !['ADMIN', 'USER'].includes(claims.role)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Refresh token is invalid');
    }

    // Khai báo user nhận giá trị từ await User.findById(claims.sub).select('+refresh_token_. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findById(claims.sub).select('+refresh_token_hash');
    // if chỉ chạy nhánh này khi điều kiện !user || user.role !== claims.role đúng.
    if (!user || user.role !== claims.role) throw new ApiError(401, 'Refresh token role is no longer current');
    // Khai báo stored nhận giá trị từ user?.refresh_token_hash. const giữ biến không gán lại; let cho phép cập nhật.
    const stored = user?.refresh_token_hash;
    // Khai báo candidateHash nhận giá trị từ Buffer.from(hashToken(token)). const giữ biến không gán lại; let cho phép cập nhật.
    const candidateHash = Buffer.from(hashToken(token));
    // Khai báo storedHash nhận giá trị từ stored ? Buffer.from(stored) : Buffer.alloc(candidateHa. const giữ biến không gán lại; let cho phép cập nhật.
    const storedHash = stored ? Buffer.from(stored) : Buffer.alloc(candidateHash.length);
    // if chỉ chạy nhánh này khi điều kiện !stored || storedHash.length !== candidateHash.length || !timingSafeEqual(c đúng.
    if (!stored || storedHash.length !== candidateHash.length
        || !timingSafeEqual(candidateHash, storedHash)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Refresh token has been revoked');
    }
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Token refreshed', data: await rotat về nơi gọi.
    return res.json({ status: 'success', message: 'Token refreshed', data: await rotateTokenPair(user, stored) });
});

// [ĐĂNG XUẤT] Thu hồi refresh token hiện tại; access token ngắn hạn tự hết hiệu lực.
// Khai báo logout nhận giá trị từ asyncHandler(async (req, res) => { await User.updateOne. const giữ biến không gán lại; let cho phép cập nhật.
export const logout = asyncHandler(async (req, res) => {
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await User.updateOne({ _id: req.authUser._id }, { $set: { refresh_token_has
    await User.updateOne({ _id: req.authUser._id }, { $set: { refresh_token_hash: null } });
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Logged out successfully' }) về nơi gọi.
    return res.json({ status: 'success', message: 'Logged out successfully' });
});

// [HỒ SƠ TÀI KHOẢN] Trả dữ liệu đã lọc, không bao giờ serialize trường bí mật của User.
// Khai báo profile nhận giá trị từ asyncHandler(async (req, res) => res.json({ status: 'su. const giữ biến không gán lại; let cho phép cập nhật.
export const profile = asyncHandler(async (req, res) => res.json({
    // Trường status lưu 'success' làm giá trị trong object.
    status: 'success',
    // Trường data lưu toUserDto(req.authUser) làm giá trị trong object.
    data: toUserDto(req.authUser)
}));

// Khai báo updateProfile nhận giá trị từ asyncHandler(async (req, res) => { const updated = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const updateProfile = asyncHandler(async (req, res) => {
    // Khai báo updated nhận giá trị từ await User.findByIdAndUpdate(req.authUser._id, { $set: . const giữ biến không gán lại; let cho phép cập nhật.
    const updated = await User.findByIdAndUpdate(req.authUser._id, {
        // Trường $set lưu { ...(req.body.name !== undefined ? { name: req.body.na làm giá trị trong object.
        $set: {
            ...(req.body.name !== undefined ? { name: req.body.name } : {}),
            ...(req.body.phone_number !== undefined ? { phone_number: req.body.phone_number } : {})
        }
    }, { new: true, runValidators: true });
    // if chỉ chạy nhánh này khi điều kiện !updated đúng.
    if (!updated) throw new ApiError(404, 'User not found');
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(updated) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(updated) });
});

// Khai báo changePassword nhận giá trị từ asyncHandler(async (req, res) => { const user = await U. const giữ biến không gán lại; let cho phép cập nhật.
export const changePassword = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await User.findById(req.authUser._id).select('+password. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findById(req.authUser._id).select('+password_hash');
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) throw new ApiError(404, 'User not found');
    // if chỉ chạy nhánh này khi điều kiện !(await user.verifyPassword(req.body.current_password)) đúng.
    if (!(await user.verifyPassword(req.body.current_password))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Current password is incorrect');
    }
    // if chỉ chạy nhánh này khi điều kiện await user.verifyPassword(req.body.new_password) đúng.
    if (await user.verifyPassword(req.body.new_password)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'New password must be different from the current password');
    }

    // Khai báo passwordHash nhận giá trị từ await bcrypt.hash(req.body.new_password, 12). const giữ biến không gán lại; let cho phép cập nhật.
    const passwordHash = await bcrypt.hash(req.body.new_password, 12);
    // Khai báo changed nhận giá trị từ await User.findOneAndUpdate({ _id: user._id, password_h. const giữ biến không gán lại; let cho phép cập nhật.
    const changed = await User.findOneAndUpdate({
        // Trường _id lưu user._id làm giá trị trong object.
        _id: user._id,
        // Trường password_hash lưu user.password_hash làm giá trị trong object.
        password_hash: user.password_hash
    }, { $set: { password_hash: passwordHash, refresh_token_hash: null } }, { new: true, runValidators: true });
    // if chỉ chạy nhánh này khi điều kiện !changed đúng.
    if (!changed) throw new ApiError(409, 'Password changed in another request; please try again');
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Password updated; sign in again.' } về nơi gọi.
    return res.json({ status: 'success', message: 'Password updated; sign in again.' });
});

// Khai báo requestPasswordChangeOtp nhận giá trị từ asyncHandler(async (req, res) => { const user = await U. const giữ biến không gán lại; let cho phép cập nhật.
export const requestPasswordChangeOtp = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await User.findById(req.authUser._id) .select('+passwor. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findById(req.authUser._id)
        .select('+password_hash +password_otp_hash +password_otp_expires_at +password_otp_sent_at +password_otp_attempts');
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) throw new ApiError(404, 'User not found');
    // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
    const now = new Date();
    // Khai báo retryAt nhận giá trị từ user.password_otp_sent_at ? user.password_otp_sent_at.g. const giữ biến không gán lại; let cho phép cập nhật.
    const retryAt = user.password_otp_sent_at
        ? user.password_otp_sent_at.getTime() + OTP_RESEND_DELAY_MS : 0;
    // if chỉ chạy nhánh này khi điều kiện now.getTime() < retryAt đúng.
    if (now.getTime() < retryAt) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(429, `Please wait ${Math.ceil((retryAt - now.getTime()) / 1000)} seconds before requesting another code`);
    }

    // Khai báo otp nhận giá trị từ createOtp(). const giữ biến không gán lại; let cho phép cập nhật.
    const otp = createOtp();
    // Khai báo otpHash nhận giá trị từ hashOtp(otp). const giữ biến không gán lại; let cho phép cập nhật.
    const otpHash = hashOtp(otp);
    // Gọi/thực thi biểu thức để thực hiện thao tác: user.password_otp_hash = otpHash
    user.password_otp_hash = otpHash;
    // Gọi/thực thi Date với các đối số để thực hiện thao tác: user.password_otp_expires_at = new Date(now.getTime() + OTP_TTL_MS)
    user.password_otp_expires_at = new Date(now.getTime() + OTP_TTL_MS);
    // Gọi/thực thi biểu thức để thực hiện thao tác: user.password_otp_sent_at = now
    user.password_otp_sent_at = now;
    // Gọi/thực thi biểu thức để thực hiện thao tác: user.password_otp_attempts = 0
    user.password_otp_attempts = 0;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await user.save()
    await user.save();
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await sendPasswordChangeOtp(user.email, otp)
        await sendPasswordChangeOtp(user.email, otp);
    } catch (error) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await User.updateOne({ _id: user._id, password_otp_hash: otpHash }, { $set:
        await User.updateOne({ _id: user._id, password_otp_hash: otpHash }, { $set: {
            // Trường password_otp_hash lưu null làm giá trị trong object.
            password_otp_hash: null,
            // Trường password_otp_expires_at lưu null làm giá trị trong object.
            password_otp_expires_at: null,
            // Trường password_otp_attempts lưu 0 làm giá trị trong object.
            password_otp_attempts: 0
        } });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Password verification code sent to  về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Password verification code sent to the account email a làm giá trị trong object.
        message: 'Password verification code sent to the account email address.',
        // Trường data lưu { expires_in_seconds: OTP_TTL_MS / 1000, retry_after_se làm giá trị trong object.
        data: { expires_in_seconds: OTP_TTL_MS / 1000, retry_after_seconds: OTP_RESEND_DELAY_MS / 1000 }
    });
});

// Khai báo changePasswordWithOtp nhận giá trị từ asyncHandler(async (req, res) => { const user = await U. const giữ biến không gán lại; let cho phép cập nhật.
export const changePasswordWithOtp = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await User.findById(req.authUser._id).select( '+passwor. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findById(req.authUser._id).select(
        '+password_otp_hash +password_otp_expires_at +password_otp_attempts'
    );
    // if chỉ chạy nhánh này khi điều kiện !user || !user.password_otp_hash đúng.
    if (!user || !user.password_otp_hash) throw new ApiError(400, 'Password verification code is invalid or expired');
    // if chỉ chạy nhánh này khi điều kiện user.password_otp_attempts >= OTP_MAX_ATTEMPTS đúng.
    if (user.password_otp_attempts >= OTP_MAX_ATTEMPTS) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
    }
    // if chỉ chạy nhánh này khi điều kiện !user.password_otp_expires_at || user.password_otp_expires_at <= new Date() đúng.
    if (!user.password_otp_expires_at || user.password_otp_expires_at <= new Date()) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await User.updateOne({ _id: user._id, password_otp_hash: user.password_otp_
        await User.updateOne({ _id: user._id, password_otp_hash: user.password_otp_hash }, { $set: {
            // Trường password_otp_hash lưu null làm giá trị trong object.
            password_otp_hash: null, password_otp_expires_at: null, password_otp_sent_at: null,
            // Trường password_otp_attempts lưu 0 làm giá trị trong object.
            password_otp_attempts: 0
        } });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Password verification code is invalid or expired');
    }

    // Khai báo expected nhận giá trị từ Buffer.from(user.password_otp_hash, 'hex'). const giữ biến không gán lại; let cho phép cập nhật.
    const expected = Buffer.from(user.password_otp_hash, 'hex');
    // Khai báo candidate nhận giá trị từ Buffer.from(hashOtp(req.body.otp), 'hex'). const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = Buffer.from(hashOtp(req.body.otp), 'hex');
    // if chỉ chạy nhánh này khi điều kiện expected.length !== candidate.length || !timingSafeEqual(expected, candidat đúng.
    if (expected.length !== candidate.length || !timingSafeEqual(expected, candidate)) {
        // Khai báo attempt nhận giá trị từ await User.updateOne({ _id: user._id, password_otp_hash. const giữ biến không gán lại; let cho phép cập nhật.
        const attempt = await User.updateOne({
            // Trường _id lưu user._id làm giá trị trong object.
            _id: user._id,
            // Trường password_otp_hash lưu user.password_otp_hash làm giá trị trong object.
            password_otp_hash: user.password_otp_hash,
            // Trường password_otp_attempts lưu { $lt: OTP_MAX_ATTEMPTS } làm giá trị trong object.
            password_otp_attempts: { $lt: OTP_MAX_ATTEMPTS },
            // Trường password_otp_expires_at lưu { $gt: new Date() } làm giá trị trong object.
            password_otp_expires_at: { $gt: new Date() }
        }, { $inc: { password_otp_attempts: 1 } });
        // if chỉ chạy nhánh này khi điều kiện attempt.modifiedCount !== 1 đúng.
        if (attempt.modifiedCount !== 1) throw new ApiError(429, 'Too many incorrect verification codes; request a new code');
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Password verification code is invalid or expired');
    }

    // Khai báo passwordHash nhận giá trị từ await bcrypt.hash(req.body.new_password, 12). const giữ biến không gán lại; let cho phép cập nhật.
    const passwordHash = await bcrypt.hash(req.body.new_password, 12);
    // Khai báo changed nhận giá trị từ await User.findOneAndUpdate({ _id: user._id, password_o. const giữ biến không gán lại; let cho phép cập nhật.
    const changed = await User.findOneAndUpdate({
        // Trường _id lưu user._id làm giá trị trong object.
        _id: user._id,
        // Trường password_otp_hash lưu user.password_otp_hash làm giá trị trong object.
        password_otp_hash: user.password_otp_hash,
        // Trường password_otp_expires_at lưu { $gt: new Date() } làm giá trị trong object.
        password_otp_expires_at: { $gt: new Date() },
        // Trường password_otp_attempts lưu { $lt: OTP_MAX_ATTEMPTS } làm giá trị trong object.
        password_otp_attempts: { $lt: OTP_MAX_ATTEMPTS }
    }, { $set: {
        // Trường password_hash lưu passwordHash làm giá trị trong object.
        password_hash: passwordHash,
        // Trường refresh_token_hash lưu null làm giá trị trong object.
        refresh_token_hash: null,
        // Trường password_otp_hash lưu null làm giá trị trong object.
        password_otp_hash: null,
        // Trường password_otp_expires_at lưu null làm giá trị trong object.
        password_otp_expires_at: null,
        // Trường password_otp_sent_at lưu null làm giá trị trong object.
        password_otp_sent_at: null,
        // Trường password_otp_attempts lưu 0 làm giá trị trong object.
        password_otp_attempts: 0
    } }, { new: true, runValidators: true });
    // if chỉ chạy nhánh này khi điều kiện !changed đúng.
    if (!changed) throw new ApiError(400, 'Password verification code is invalid or expired');
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Password updated; sign in again.' } về nơi gọi.
    return res.json({ status: 'success', message: 'Password updated; sign in again.' });
});

// Hàm adminLogin: Kiểm tra thông tin đăng nhập, xác minh quyền hạn (Admin) trước khi cấp phiên.
// Khai báo adminLogin nhận giá trị từ asyncHandler(async (req, res) => { const email = String. const giữ biến không gán lại; let cho phép cập nhật.
export const adminLogin = asyncHandler(async (req, res) => {
    // Khai báo email nhận giá trị từ String(req.body.email || '').trim().toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const email = String(req.body.email || '').trim().toLowerCase();
    // Khai báo password nhận giá trị từ req.body.password. const giữ biến không gán lại; let cho phép cập nhật.
    const password = req.body.password;

    // 1. Kiểm tra dữ liệu đầu vào (Validation)
    // if chỉ chạy nhánh này khi điều kiện !email || typeof password !== 'string' đúng.
    if (!email || typeof password !== 'string') {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Request validation failed', [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
        ]);
    }

    // 2. Tìm user trong database và lấy thêm trường password_hash (vì mặc định select: false)
    // Khai báo user nhận giá trị từ await User.findOne({ email }).select('+password_hash'). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await User.findOne({ email }).select('+password_hash');
    // if chỉ chạy nhánh này khi điều kiện !user || !(await user.verifyPassword(password)) đúng.
    if (!user || !(await user.verifyPassword(password))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(401, 'Invalid email or password');
    }

    // 3. [QUAN TRỌNG] Kiểm tra xem tài khoản này có phải là Admin hay không
    // if chỉ chạy nhánh này khi điều kiện user.role !== ROLES.ADMIN đúng.
    if (user.role !== ROLES.ADMIN) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'Access denied. Administrator privileges required.');
    }

    // 4. (Tùy chọn) Kiểm tra trạng thái kích hoạt email nếu hệ thống yêu cầu cả admin phải xác thực
    // if chỉ chạy nhánh này khi điều kiện !user.email_verified đúng.
    if (!user.email_verified) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'Verify your email before signing in');
    }

    // 5. Cấp cặp token đăng nhập dành riêng cho Admin
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Admin login successful', data: awai về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Admin login successful' làm giá trị trong object.
        message: 'Admin login successful',
        // Trường data lưu await issueTokenPair(user) làm giá trị trong object.
        data: await issueTokenPair(user)
    });
});
