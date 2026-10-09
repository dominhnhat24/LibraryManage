// [TUYẾN THUÊ BAO] Người dùng tạo/yêu cầu xem lịch sử; admin xét duyệt qua namespace quản trị.
import { Router } from 'express';
import { createSubscription, getMySubscriptions } from '../controllers/subscription.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyToken);
router.post('/', createSubscription);
router.get('/me', getMySubscriptions);

export default router;
