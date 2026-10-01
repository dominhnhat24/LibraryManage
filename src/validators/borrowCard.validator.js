// Khai báo validation cho tạo phiếu, nhận trả, truy vấn phiếu và mã phiếu trong URL.
import { body, param, query } from 'express-validator';

// Kiểm tra readerId theo vai trò, copyIds 1–10 phần tử và dueDate ISO trong body; trả chain ghi lỗi trên request.
export const validateCreateBorrowCard = [
    body('readerId')
        .if((value, { req }) => ['librarian', 'admin'].includes(String(req.user?.role || req.user?.roll || '').toLowerCase()))
        .isMongoId()
        .withMessage('readerId is required for librarian-created borrow cards'),
    body('readerId').optional().isMongoId().withMessage('readerId must be a valid MongoDB ObjectId'),
    body('copyIds').isArray({ min: 1, max: 10 }).withMessage('copyIds must contain 1 to 10 items'),
    body('copyIds.*').isMongoId().withMessage('Each copyId must be a valid MongoDB ObjectId'),
    body('dueDate').isISO8601().withMessage('dueDate must be a valid ISO date')
];

// Kiểm tra mã phiếu trên URL và từng returns gồm copyId/condition hợp lệ; trả chain ghi lỗi validation.
export const validateReturnBorrowCard = [
    param('id').isMongoId().withMessage('Invalid borrow card id'),
    body('returns').isArray({ min: 1 }).withMessage('returns must be a non-empty array'),
    body('returns.*.copyId').isMongoId().withMessage('Each return copyId must be valid'),
    body('returns.*.condition').isIn(['Good', 'Damaged', 'Lost']).withMessage('Invalid return condition')
];

// Kiểm tra req.params.id có định dạng MongoDB ObjectId; trả chain validator cho tuyến.
export const validateBorrowCardId = [
    param('id').isMongoId().withMessage('Invalid borrow card id')
];

// Kiểm tra status/page/limit tùy chọn trong query; trả chain để express-validator lưu lỗi trên request.
export const validateBorrowCardQuery = [
    query('status').optional().isIn(['Pending', 'Borrowing', 'PartiallyReturned', 'Returned', 'Overdue', 'Cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];
