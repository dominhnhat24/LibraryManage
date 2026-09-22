const { body, validationResult } = require('express-validator');

// Middleware xử lý kết quả validation chung
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: errors.array()
        });
    }
    next();
};

// Quy tắc validate cho Đăng ký
const validateRegister = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone('vi-VN').withMessage('Invalid phone number format'),
    body('cccd')
        .notEmpty().withMessage('CCCD is required')
        .isLength({ min: 12, max: 12 }).withMessage('CCCD must be exactly 12 digits')
        .isNumeric().withMessage('CCCD must contain only numbers'),
    validateResult
];

// Quy tắc validate cho Đăng nhập
const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validateResult
];

module.exports = {
    validateRegister,
    validateLogin
};