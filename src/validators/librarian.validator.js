// Khai báo validation cho thao tác đọc, tạo, cập nhật hồ sơ thủ thư và lọc danh sách.
import { body, param, query } from 'express-validator';

// Kiểm tra ID thủ thư trên URL; trả chain ghi lỗi trên request nếu không phải ObjectId.
export const validateLibrarianId = [
    param('id').isMongoId().withMessage('Invalid librarian id')
];

// Kiểm tra status/search/page/limit tùy chọn trong query; trả chain validation.
export const validateLibrarianQuery = [
    query('status').optional().isIn(['Active', 'Blocked']),
    query('search').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];

// Kiểm tra các trường bắt buộc/tùy chọn khi tạo thủ thư; trả chain ghi lỗi validation.
export const validateCreateLibrarian = [
    body('user_name').trim().isLength({ min: 3, max: 80 }),
    body('full_name').trim().isLength({ min: 2, max: 150 }),
    body('email').optional().isEmail(),
    body('password').isString().isLength({ min: 6, max: 128 })
];

// Kiểm tra ID và trường cập nhật trong body; trả chain ghi lỗi nếu thiếu trường hợp lệ hoặc giá trị sai.
export const validateUpdateLibrarian = [
    ...validateLibrarianId,
    body().custom((value) => Object.keys(value).some((key) =>
        ['user_name', 'email', 'full_name', 'password', 'status'].includes(key)
    )).withMessage('At least one valid librarian field is required'),
    body('email').optional().isEmail(),
    body('password').optional().isString().isLength({ min: 6, max: 128 }),
    body('status').optional().isIn(['Active', 'Blocked'])
];

// Kiểm tra body cập nhật hồ sơ cá nhân, không nhận status; trả chain ghi lỗi trên request khi sai.
export const validateProfileUpdate = [
    body().custom((value) => Object.keys(value).some((key) =>
        ['user_name', 'email', 'full_name', 'password'].includes(key)
    )).withMessage('At least one profile field is required'),
    body('email').optional().isEmail(),
    body('password').optional().isString().isLength({ min: 6, max: 128 })
];
