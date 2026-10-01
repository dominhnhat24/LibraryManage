// Khai báo kiểm tra ID, bộ lọc danh sách khoản phạt và lý do miễn phạt.
import { body, param, query } from 'express-validator';

// Kiểm tra ID khoản phạt trong req.params; trả chuỗi validator ghi lỗi trên request nếu sai.
export const validateFineId = [param('id').isMongoId().withMessage('Invalid fine id')];
// Kiểm tra readerId/status/page/limit tùy chọn trong query; trả chain validation.
export const validateFineQuery = [
    query('readerId').optional().isMongoId(),
    query('status').optional().isIn(['Pending', 'Paid', 'Waived']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
];
// Kết hợp kiểm tra ID với waiverReason trong body; trả chain kiểm tra và ghi lỗi nếu lý do ngoài 3–500 ký tự.
export const validateWaiveFine = [
    ...validateFineId,
    body('waiverReason').trim().isLength({ min: 3, max: 500 })
];
