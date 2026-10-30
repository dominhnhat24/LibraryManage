// [TUYẾN HỖ TRỢ] Nhận liên hệ/báo lỗi; token là tùy chọn nhưng nếu gửi phải hợp lệ.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/report.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createReport } từ ../controllers/report.controller.js để dùng trong module.
import { createReport } from '../controllers/report.controller.js';
// Import { optionalAuth } từ ../middlewares/auth.middleware.js để dùng trong module.
import { optionalAuth } from '../middlewares/auth.middleware.js';
// Import { validateBody } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', optionalAuth, validateBody(modelValidation.report.create),
router.post('/', optionalAuth, validateBody(modelValidation.report.create), createReport);

// export default cung cấp giá trị này để module khác import.
export default router;
