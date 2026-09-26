import { body, param, query } from 'express-validator';

export const validateLibrarianId = [
    param('id').isMongoId().withMessage('Invalid librarian id')
];

export const validateLibrarianQuery = [
    query('status').optional().isIn(['Active', 'Blocked']),
    query('search').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];

export const validateCreateLibrarian = [
    body('user_name').trim().isLength({ min: 3, max: 80 }),
    body('full_name').trim().isLength({ min: 2, max: 150 }),
    body('email').optional().isEmail(),
    body('password').isString().isLength({ min: 6, max: 128 })
];

export const validateUpdateLibrarian = [
    ...validateLibrarianId,
    body().custom((value) => Object.keys(value).some((key) =>
        ['user_name', 'email', 'full_name', 'password', 'status'].includes(key)
    )).withMessage('At least one valid librarian field is required'),
    body('email').optional().isEmail(),
    body('password').optional().isString().isLength({ min: 6, max: 128 }),
    body('status').optional().isIn(['Active', 'Blocked'])
];

export const validateProfileUpdate = [
    body().custom((value) => Object.keys(value).some((key) =>
        ['user_name', 'email', 'full_name', 'password'].includes(key)
    )).withMessage('At least one profile field is required'),
    body('email').optional().isEmail(),
    body('password').optional().isString().isLength({ min: 6, max: 128 })
];
