// [TUYẾN THUÊ BAO] Người dùng tạo/yêu cầu xem lịch sử; admin xét duyệt qua namespace quản trị.
import { Router } from 'express';
import { createSubscription, getMySubscriptions } from '../controllers/subscription.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.use(verifyToken);
router.post('/', validateBody(modelValidation.subscription.create), createSubscription);
router.get('/me', getMySubscriptions);

export default router;
