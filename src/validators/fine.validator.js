import { body, param, query } from 'express-validator';

export const validateFineId = [param('id').isMongoId().withMessage('Invalid fine id')];
export const validateFineQuery = [
    query('readerId').optional().isMongoId(),
    query('status').optional().isIn(['Pending', 'Paid', 'Waived']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];
export const validateWaiveFine = [
    ...validateFineId,
    body('waiverReason').trim().isLength({ min: 3, max: 500 })
];
