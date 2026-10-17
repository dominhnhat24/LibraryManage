// [TUYẾN HỖ TRỢ] Nhận liên hệ/báo lỗi; token là tùy chọn nhưng nếu gửi phải hợp lệ.
import { Router } from 'express';
import { createReport } from '../controllers/report.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.post('/', optionalAuth, validateBody(modelValidation.report.create), createReport);

export default router;
