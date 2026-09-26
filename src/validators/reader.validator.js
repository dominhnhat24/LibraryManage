import { body, param, query } from 'express-validator';

export const validateReaderId = [param('id').isMongoId().withMessage('Invalid reader id')];
export const validateReaderQuery = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim()
];
export const validateCreateReader = [
    body('full_name').trim().isLength({ min: 2, max: 150 }),
    body('email').isEmail(),
    body('phone').optional().isString().trim(),
    body('address').optional().isString().trim()
];
export const validateUpdateReader = [
    ...validateReaderId,
    body().custom((value) => Object.keys(value).some((key) => ['full_name', 'email', 'phone', 'address', 'status'].includes(key)))
        .withMessage('At least one valid reader field is required'),
    body('email').optional().isEmail(),
    body('status').optional().isIn(['Active', 'Blocked'])
];
