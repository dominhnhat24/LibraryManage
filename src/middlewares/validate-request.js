// Đọc lỗi express-validator trên request và chuyển lỗi đầu vào error handler tập trung.
import { validationResult } from 'express-validator';
import apiError from '../utils/api-error.js';

// Nhận req/res/next; gọi next(ApiError 400) khi có lỗi, nếu không gọi next() và không gửi response.
export default (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new apiError(400, 'Request validation failed', errors.array()));
    }
    next();
};
