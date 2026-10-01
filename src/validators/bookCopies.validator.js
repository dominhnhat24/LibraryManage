// Khai báo validation cho request nhập kho và cập nhật thông tin bản sao sách.
import { body, param } from 'express-validator';
import * as db from '../models/init.js';

// Kiểm tra bookId tồn tại cùng quantity nguyên dương trong body; truy vấn DB và trả chain ghi lỗi trên request.
export const validateCreateBookCopy = [
    // 1. Kiểm tra bookId có tồn tại và đúng chuẩn MongoDB ObjectId không
    body('bookId')
        .exists({ checkFalsy: true })
        .withMessage('bookId is required')
        .bail()
        .isMongoId()
        .withMessage('bookId must be a valid MongoDB ObjectId')
        .bail()
        .custom(async (bookId) => {
            // Kiểm tra xem đầu sách này có thực sự tồn tại trong database không
            const book = await db.Books.findById(bookId);
            if (!book) {
                throw new Error('Book not found with this bookId');
            }
            return true;
        }),

    body('quantity')
        .isInt({ min: 1 })
        .withMessage('quantity must be a positive integer')
];

// Kiểm tra ID trên URL, ít nhất một trường cập nhật được cho phép và định dạng trường gửi kèm; trả chain validation.
export const validateUpdateBookCopy = [
    // 1. Validate ID truyền trên URL params
    param('id')
        .isMongoId()
        .withMessage('Invalid book copy ID format'),

    // 2. Validate Partial Update (phải gửi ít nhất 1 trường hợp lệ để sửa)
    body().custom((value) => {
        const allowedFields = ['status', 'condition', 'location']; // Các trường cho phép cập nhật bản sao
        const hasValidField = allowedFields.some((field) => 
            Object.prototype.hasOwnProperty.call(value, field)
        );

        if (!hasValidField) {
            throw new Error(`At least one valid field must be provided for update: ${allowedFields.join(', ')}`);
        }
        return true;
    }),

    // 3. Validate chi tiết từng trường nếu nó xuất hiện trong request
    body('status')
        .optional()
        .isIn(['Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'])
        .withMessage('Invalid book copy status'),

    body('condition')
        .optional()
        .isString()
        .withMessage('condition must be a string')
        .trim()
        .notEmpty()
        .withMessage('condition cannot be empty')
];
