// Khai báo validation cho ID, truy vấn danh sách, tạo mới và cập nhật độc giả.
import { body, param, query } from 'express-validator';

// Kiểm tra ID độc giả trong req.params; trả chain ghi lỗi trên request nếu không phải ObjectId.
export const validateReaderId = [param('id').isMongoId().withMessage('Invalid reader id')];
// Kiểm tra page/limit/search trong req.query; trả chain validation ghi lỗi trên request.
export const validateReaderQuery = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim()
];
// Kiểm tra trường hồ sơ bắt buộc/tùy chọn trong body tạo độc giả; trả chain validation.
export const validateCreateReader = [
    body('full_name').trim().isLength({ min: 2, max: 150 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters long'),
    body('phone').optional().isString().trim(),
    body('address').optional().isString().trim()
];
// Kết hợp kiểm tra ID, trường cập nhật, email/status; trả chain ghi lỗi validation trên request.
export const validateUpdateReader = [
    ...validateReaderId,
    body().custom((value) => Object.keys(value).some((key) => ['full_name', 'email', 'phone', 'address', 'status'].includes(key)))
        .withMessage('At least one valid reader field is required'),
    body('email').optional().isEmail(),
    body('status').optional().isIn(['Active', 'Blocked'])
];
