// [TUYẾN TƯƠNG TÁC] Cung cấp bình luận/đánh giá cho sách với xác thực ở thao tác ghi.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/interaction.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createComment, deleteComment, getComment, listComments, updateComment } từ ../controllers/interaction.controller.js để dùng trong module.
import { createComment, deleteComment, getComment, listComments, updateComment } from '../controllers/interaction.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { validateBody, validateParams, validateQuery } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/books/:bookId/comments', validateParams(modelValidation.params
router.get('/books/:bookId/comments', validateParams(modelValidation.params.book),
    validateQuery(modelValidation.comment.list), listComments);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/books/:bookId/comments', verifyToken, validateParams(modelVal
router.post('/books/:bookId/comments', verifyToken, validateParams(modelValidation.params.book),
    validateBody(modelValidation.comment.create), createComment);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/comments/:commentId', validateParams(modelValidation.params.co
router.get('/comments/:commentId', validateParams(modelValidation.params.comment), getComment);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/comments/:commentId', verifyToken, validateParams(modelValid
router.patch('/comments/:commentId', verifyToken, validateParams(modelValidation.params.comment),
    validateBody(modelValidation.comment.update), updateComment);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/comments/:commentId', verifyToken, validateParams(modelVali
router.delete('/comments/:commentId', verifyToken, validateParams(modelValidation.params.comment), deleteComment);

// export default cung cấp giá trị này để module khác import.
export default router;
