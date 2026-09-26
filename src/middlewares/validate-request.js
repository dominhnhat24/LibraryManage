import { validationResult } from 'express-validator';
import apiError from '../utils/api-error.js';

export default (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new apiError(400, 'Request validation failed', errors.array()));
    }
    next();
};
