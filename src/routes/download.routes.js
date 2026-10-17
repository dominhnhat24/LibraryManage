// [TUYẾN TẢI OFFLINE] Bắt buộc access token hợp lệ và quyền VIP còn hạn trước khi gửi tài nguyên.
import { Router } from 'express';
import { downloadBook } from '../controllers/download.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { checkDownloadPermission } from '../middlewares/role.middleware.js';
import { validateParams } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.get('/:bookId', validateParams(modelValidation.params.book),
    verifyToken, checkDownloadPermission, downloadBook);

export default router;
