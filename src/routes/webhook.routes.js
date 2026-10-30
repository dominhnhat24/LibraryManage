// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/webhook.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { handleSepayWebhook } từ ../controllers/webhook.controller.js để dùng trong module.
import { handleSepayWebhook } from '../controllers/webhook.controller.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/sepay', handleSepayWebhook)
router.post('/sepay', handleSepayWebhook);

// export default cung cấp giá trị này để module khác import.
export default router;
