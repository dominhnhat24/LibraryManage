// Nhận request xác thực, gọi dịch vụ tài khoản và chuyển kết quả thành phản hồi HTTP.
import * as authService from '../services/auth.service.js';
import asyncHandler from '../middlewares/async-handler.js';

// Nhận req.body đăng ký; trả thông tin tài khoản với HTTP 201, lỗi được asyncHandler chuyển tiếp.
export const register = asyncHandler(async (req, res) => {
    const result = await authService.serviceRegister(req.body);

    return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
    });
});

// Nhận email và mật khẩu từ req.body; trả thông tin phiên đăng nhập với HTTP 200.
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.serviceLogin(email, password);

    return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
    });
});