// Khai báo chuỗi express-validator để kiểm tra và chuẩn hóa dữ liệu đăng ký/đăng nhập trong req.body.
import { body } from 'express-validator';

// Quy tắc validate cho Đăng ký
// Kiểm tra username hoặc full_name, email, mật khẩu và phone tùy chọn; trả middleware chain ghi lỗi vào request.
const validateRegister = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 80 }).withMessage('Username must be between 3 and 80 characters long'),
    body('full_name')
        .if((value, { req }) => !req.body.username)
        .trim()
        .notEmpty().withMessage('full_name is required')
        .isLength({ min: 2, max: 150 }).withMessage('full_name must be between 2 and 150 characters long'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .trim()
        .toLowerCase()
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters long'),
    body('phone')
        .optional()
        .isMobilePhone('vi-VN').withMessage('Invalid phone number format')
];

// Quy tắc validate cho Đăng nhập
// Kiểm tra email hợp lệ và mật khẩu bắt buộc trong body; trả middleware chain cho tuyến đăng nhập.
const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

export {
    validateRegister,
    validateLogin
};