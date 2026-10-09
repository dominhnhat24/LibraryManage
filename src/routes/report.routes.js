// [TUYẾN HỖ TRỢ] Nhận liên hệ/báo lỗi; token là tùy chọn nhưng nếu gửi phải hợp lệ.
import { Router } from 'express';
import { createReport } from '../controllers/report.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/', optionalAuth, createReport);

export default router;
