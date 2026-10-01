// Định tuyến hồ sơ và quản lý độc giả, phân biệt quyền tự xem hồ sơ với quyền quản trị của thủ thư.
import express from 'express';
import readerController from '../controllers/reader.controller.js';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import { validateCreateReader, validateReaderId, validateReaderQuery, validateUpdateReader } from '../validators/reader.validator.js';

const router = express.Router();
// Yêu cầu đăng nhập; chỉ độc giả và thủ thư được vào các tuyến bên dưới.
router.use(loginRequired, checkRole('reader', 'librarian'));

// Độc giả chỉ được xem hồ sơ gắn với token của chính mình.
router.get('/me', checkRole('reader'), readerController.getMyProfile);

// Danh sách/tạo độc giả chỉ dành cho thủ thư.
router.route('/')
    .all(checkRole('librarian'))
    .get(validateReaderQuery, validateRequest, readerController.getAllReaders)
    .post(validateCreateReader, validateRequest, readerController.createReader);

// Tra cứu, cập nhật và xóa độc giả theo ID chỉ dành cho thủ thư.
router.route('/:id')
    .all(checkRole('librarian'))
    .get(validateReaderId, validateRequest, readerController.getReaderById)
    .put(validateUpdateReader, validateRequest, readerController.updateReader)
    .delete(validateReaderId, validateRequest, readerController.deleteReader);

export default router;