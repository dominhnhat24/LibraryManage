import User from '../models/user.model.js';
import TempUser from '../models/temp-user.model.js';
import ApiError from '../utils/api-error.js';
import mailer from '../config/mailer.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Tạo OTP 6 chữ số
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP đăng ký qua email
const sendRegisterOtp = async (email, otp) => {
    try {
        await mailer.sendRegisterOtp(email, otp);
    } catch (error) {
        throw new ApiError(500, 'Failed to send registration OTP');
    }
};

// =========================
// 1. REQUEST REGISTER (Lưu tạm thông tin & Gửi OTP, CHƯA tạo user thật) qua Redis tạm thời
// =========================
const requestRegister = async (userData) => {
    const { email, password, name, phone_number } = userData;

    // Kiểm tra xem email này đã có tài khoản chính thức và đã xác thực chưa
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.is_verified) {
        throw new ApiError(409, 'Email is already registered and verified');
    }

    // Tạo OTP và hash password
    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 12);// salt rounds và cost factor = 12
    
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // Lưu hoặc cập nhật vào bảng tạm TempUser
    await TempUser.findOneAndUpdate(
        { email },
        { 
            password: hashedPassword, 
            name, 
            phone_number, 
            otp, 
            otp_expires_at 
        },
        { upsert: true, new: true }
    );

    // Gửi OTP qua email
    await sendRegisterOtp(email, otp);

    return {
        message: 'OTP sent to your email. Please verify to complete registration.'
    };
};

// =========================
// 2. RESEND REGISTER OTP (Cấp lại OTP mới cho người đang chờ xác thực)
// =========================
const resendRegisterOtp = async (email) => {
    // Tìm trong bảng tạm xem có phiên đăng ký nào đang chờ không
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
        throw new ApiError(404, 'No pending registration found for this email');
    }

    // Tạo OTP mới và gia hạn thời gian
    const newOtp = generateOtp();
    tempUser.otp = newOtp;
    tempUser.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await tempUser.save();

    // Gửi lại OTP mới
    await sendRegisterOtp(email, newOtp);

    return {
        message: 'Registration OTP resent successfully'
    };
};

// =========================
// 3. VERIFY OTP & CREATE USER (Xác thực thành công -> Mới lưu vào DB chính thức)
// =========================
const verifyAndRegister = async (email, otp) => {
    // 1. Lấy thông tin từ bảng tạm
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
        throw new ApiError(400, 'Registration session expired or not found');
    }

    // 2. Kiểm tra mã OTP có khớp không
    if (tempUser.otp !== otp) {
        throw new ApiError(400, 'Invalid OTP');
    }

    // 3. Kiểm tra xem OTP đã hết hạn 5 phút chưa
    if (new Date() > new Date(tempUser.otp_expires_at)) {
        throw new ApiError(400, 'OTP has expired');
    }

    // 4. MỌI THỨ HỢP LỆ -> Chính thức tạo User thật trong Database với is_verified: true
    const user = await User.create({
        email: tempUser.email,
        password: tempUser.password,
        name: tempUser.name,
        phone_number: tempUser.phone_number,
        is_verified: true // Tài khoản được kích hoạt ngay từ đầu
    });

    // 5. Xóa dữ liệu trong bảng tạm vì đã hoàn tất đăng ký
    await TempUser.deleteOne({ email });

    return {
        message: 'Account registered and verified successfully',
        user
    };
};

// =========================
// LOGIN
// =========================
const login = async (credentials) => {
    const { email, password } = credentials;
    // 1. Tìm user theo email trong bảng chính thức
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }
    // 2. Kiểm tra xem tài khoản đã được xác thực hay chưa (phòng thủ an toàn)
    if (!user.is_verified) {
        throw new ApiError(403, 'Account is not verified. Please complete OTP verification.');
    }
    // 3. So sánh mật khẩu người dùng nhập với mật khẩu đã hash trong DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }
    // 4. Tạo JWT Token xác thực (thời gian sống tùy chọn, ví dụ: 1 ngày)
    const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1d' }
    );
    // 5. Trả về thông tin kèm token (ẩn mật khẩu đi)
    return {
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number
        }
    };
};

// =========================
// 4. FORGOT PASSWORD (Gửi OTP qua email khi quên mật khẩu)
// =========================
const forgotPassword = async (email) => {
    // 1. Kiểm tra email có tồn tại và đã xác thực chưa
    const user = await User.findOne({ email });
    if (!user || !user.is_verified) {
        // Bảo mật: Vẫn báo thành công giả lập để tránh kẻ xấu dò email có tồn tại trong hệ thống hay không
        return {
            message: 'If your email exists in our system, a password reset OTP has been sent.'
        };
    }

    // 2. Tạo mã OTP mới và thời hạn 5 phút
    const otp = generateOtp();
    user.otp = otp;
    user.otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // 3. Gửi OTP qua email (có thể dùng chung hàm gửi mail hoặc tạo hàm riêng tùy bạn đặt tên)
    try {
        await mailer.sendRegisterOtp(email, otp); // Hoặc mailer.sendResetPasswordOtp nếu bạn đã tách riêng
    } catch (error) {
        throw new ApiError(500, 'Failed to send password reset OTP');
    }

    return {
        message: 'Password reset OTP sent to your email.'
    };
};

// =========================
// 5. RESET PASSWORD (Xác thực OTP và đổi mật khẩu mới)
// =========================
const resetPassword = async (email, otp, newPassword) => {
    // 1. Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // 2. Kiểm tra mã OTP có khớp không
    if (user.otp !== otp) {
        throw new ApiError(400, 'Invalid OTP');
    }

    // 3. Kiểm tra xem OTP đã hết hạn chưa
    if (new Date() > new Date(user.otp_expires_at)) {
        throw new ApiError(400, 'OTP has expired');
    }

    // 4. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 5. Cập nhật mật khẩu mới và xóa mã OTP cũ đi để bảo mật
    user.password = hashedPassword;
    user.otp = undefined;
    user.otp_expires_at = undefined;
    await user.save();

    return {
        message: 'Password has been reset successfully. You can now login with your new password.'
    };
};

export default {
    requestRegister,
    resendRegisterOtp,
    verifyAndRegister,
    login,
    forgotPassword,
    resetPassword
};