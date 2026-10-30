// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/comment.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { getBookComments, deleteComment } từ ../controllers/comment.controller.js để dùng trong module.
import { getBookComments, deleteComment } from '../controllers/comment.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();

// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/books/:bookId/comments', getBookComments)
router.get('/books/:bookId/comments', getBookComments);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/comments/:commentId', verifyToken, deleteComment)
router.delete('/comments/:commentId', verifyToken, deleteComment);

// export default cung cấp giá trị này để module khác import.
export default router;