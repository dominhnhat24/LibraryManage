import { body, param, query } from 'express-validator';

export const validateCreateBorrowCard = [
    body('copyIds').isArray({ min: 1, max: 10 }).withMessage('copyIds must contain 1 to 10 items'),
    body('copyIds.*').isMongoId().withMessage('Each copyId must be a valid MongoDB ObjectId'),
    body('dueDate').isISO8601().withMessage('dueDate must be a valid ISO date')
];

export const validateReturnBorrowCard = [
    param('id').isMongoId().withMessage('Invalid borrow card id'),
    body('returns').isArray({ min: 1 }).withMessage('returns must be a non-empty array'),
    body('returns.*.copyId').isMongoId().withMessage('Each return copyId must be valid'),
    body('returns.*.condition').isIn(['Good', 'Damaged', 'Lost']).withMessage('Invalid return condition')
];

export const validateBorrowCardId = [
    param('id').isMongoId().withMessage('Invalid borrow card id')
];

export const validateBorrowCardQuery = [
    query('status').optional().isIn(['Pending', 'Borrowing', 'PartiallyReturned', 'Returned', 'Overdue', 'Cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];
