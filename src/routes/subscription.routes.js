// [TUYẾN THUÊ BAO] Người dùng tạo/yêu cầu xem lịch sử; admin xét duyệt qua namespace quản trị.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/subscription.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createSubscription, getMySubscriptions } từ ../controllers/subscription.controller.js để dùng trong module.
import { createSubscription, getMySubscriptions } from '../controllers/subscription.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { validateBody } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.use với các đối số để thực hiện thao tác: router.use(verifyToken)
router.use(verifyToken);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', validateBody(modelValidation.subscription.create), createS
router.post('/', validateBody(modelValidation.subscription.create), createSubscription);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/me', getMySubscriptions)
router.get('/me', getMySubscriptions);

// export default cung cấp giá trị này để module khác import.
export default router;
