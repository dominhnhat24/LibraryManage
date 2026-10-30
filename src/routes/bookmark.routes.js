// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/bookmark.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createBookmark, deleteBookmark, getAllBookmarks, getBookmark, updateBookm từ ../controllers/bookmark.controller.js để dùng trong module.
import { createBookmark, deleteBookmark, getAllBookmarks, getBookmark, updateBookmark } from '../controllers/bookmark.controller.js';
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
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/', validateQuery(modelValidation.bookmark.list), getAllBookmar
router.get('/', validateQuery(modelValidation.bookmark.list), getAllBookmarks);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', validateBody(modelValidation.bookmark.create), createBookm
router.post('/', validateBody(modelValidation.bookmark.create), createBookmark);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookmarkId', validateParams(modelValidation.params.bookmark),
router.get('/:bookmarkId', validateParams(modelValidation.params.bookmark), getBookmark);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/:bookmarkId', validateParams(modelValidation.params.bookmark
router.patch('/:bookmarkId', validateParams(modelValidation.params.bookmark),
    validateBody(modelValidation.bookmark.update), updateBookmark);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/:bookmarkId', validateParams(modelValidation.params.bookmar
router.delete('/:bookmarkId', validateParams(modelValidation.params.bookmark), deleteBookmark);

// export default cung cấp giá trị này để module khác import.
export default router;
