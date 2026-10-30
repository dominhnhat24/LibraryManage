// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/chapter.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createChapter, deleteChapter, getAllChapters, getChapter, updateChapter } từ ../controllers/chapter.controller.js để dùng trong module.
import { createChapter, deleteChapter, getAllChapters, getChapter, updateChapter } from '../controllers/chapter.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { requireAdmin } từ ../middlewares/role.middleware.js để dùng trong module.
import { requireAdmin } from '../middlewares/role.middleware.js';
// Import { validateBody, validateParams, validateQuery } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.use với các đối số để thực hiện thao tác: router.use(verifyToken, requireAdmin)
router.use(verifyToken, requireAdmin);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/', validateQuery(modelValidation.chapter.list), getAllChapters
router.get('/', validateQuery(modelValidation.chapter.list), getAllChapters);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', validateBody(modelValidation.chapter.create), createChapte
router.post('/', validateBody(modelValidation.chapter.create), createChapter);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:chapterId', validateParams(modelValidation.params.chapterIden
router.get('/:chapterId', validateParams(modelValidation.params.chapterIdentifier), getChapter);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/:chapterId', validateParams(modelValidation.params.chapter),
router.patch('/:chapterId', validateParams(modelValidation.params.chapter),
    validateBody(modelValidation.chapter.update), updateChapter);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/:chapterId', validateParams(modelValidation.params.chapter)
router.delete('/:chapterId', validateParams(modelValidation.params.chapter), deleteChapter);

// export default cung cấp giá trị này để module khác import.
export default router;
