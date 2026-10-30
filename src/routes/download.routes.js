// [TUYẾN TẢI OFFLINE] Bắt buộc access token hợp lệ và quyền VIP còn hạn trước khi gửi tài nguyên.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/download.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { downloadBook } từ ../controllers/download.controller.js để dùng trong module.
import { downloadBook } from '../controllers/download.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { checkDownloadPermission } từ ../middlewares/role.middleware.js để dùng trong module.
import { checkDownloadPermission } from '../middlewares/role.middleware.js';
// Import { validateParams } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateParams } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId', validateParams(modelValidation.params.book), verifyT
router.get('/:bookId', validateParams(modelValidation.params.book),
    verifyToken, checkDownloadPermission, downloadBook);

// export default cung cấp giá trị này để module khác import.
export default router;
