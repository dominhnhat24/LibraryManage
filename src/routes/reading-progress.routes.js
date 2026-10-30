// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/reading-progress.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { clearAllReadingProgress, createReadingProgress, deleteReadingProgress, ge từ ../controllers/reading-progress.controller.js để dùng trong module.
import {
    clearAllReadingProgress, createReadingProgress, deleteReadingProgress, getAllReadingProgress,
    getReadingProgress, updateReadingProgress
} from '../controllers/reading-progress.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { validateBody, validateParams, validateQuery } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.use với các đối số để thực hiện thao tác: router.use(verifyToken)
router.use(verifyToken);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/', validateQuery(modelValidation.readingProgress.list), getAll
router.get('/', validateQuery(modelValidation.readingProgress.list), getAllReadingProgress);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', validateBody(modelValidation.readingProgress.create), crea
router.post('/', validateBody(modelValidation.readingProgress.create), createReadingProgress);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/', clearAllReadingProgress)
router.delete('/', clearAllReadingProgress);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:progressId', validateParams(modelValidation.params.progress),
router.get('/:progressId', validateParams(modelValidation.params.progress), getReadingProgress);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/:progressId', validateParams(modelValidation.params.progress
router.patch('/:progressId', validateParams(modelValidation.params.progress),
    validateBody(modelValidation.readingProgress.update), updateReadingProgress);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/:progressId', validateParams(modelValidation.params.progres
router.delete('/:progressId', validateParams(modelValidation.params.progress), deleteReadingProgress);

// export default cung cấp giá trị này để module khác import.
export default router;
