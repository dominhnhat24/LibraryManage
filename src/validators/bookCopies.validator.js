const { body, param } = require('express-validator');
const db = require('../models'); // Đường dẫn đến file chứa các Mongoose Models của bạn

const validateCreateBookCopy = [
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

    // 2. Kiểm tra status (nếu có gửi lên thì phải đúng danh mục cho phép)
    body('status')
        .optional()
        .isIn(['available', 'borrowed', 'damaged', 'maintenance'])
        .withMessage('status must be one of: available, borrowed, damaged, maintenance')
];

const validateUpdateBookCopy = [
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
        .isIn(['available', 'borrowed', 'damaged', 'maintenance'])
        .withMessage('status must be one of: available, borrowed, damaged, maintenance'),

    body('condition')
        .optional()
        .isString()
        .withMessage('condition must be a string')
        .trim()
        .notEmpty()
        .withMessage('condition cannot be empty')
];

module.exports = {
    validateCreateBookCopy,
    validateUpdateBookCopy
};