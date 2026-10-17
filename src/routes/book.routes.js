// [TUYẾN SÁCH] Catalog công khai, nội dung chương có kiểm tra quyền và CRUD admin.
import { Router } from 'express';
import {
  createBook,
  deleteBook,
  deleteBulkBooks,
  getBook,
  importBooksExcelController,
  listBooks,
  loadAccessibleBook,
  loadReadableBook,
  updateBook,
} from '../controllers/book.controller.js';
import { downloadBook, streamBook } from '../controllers/download.controller.js';
import { readChapter } from '../controllers/ads.controller.js';
import { listReadableBookChapters } from '../controllers/chapter.controller.js';
import { optionalAuth, verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';
import { trackChapterRead } from '../middlewares/ads.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() }); // Lưu tạm file trên RAM để đọc
const router = Router();

// Route nhận file Excel từ frontend gửi lên (đã tích hợp bảo vệ quyền Admin và xác thực token)
router.post('/import-excel', verifyToken, requireAdmin, upload.single('file'), importBooksExcelController);

router.get('/', validateQuery(modelValidation.book.list), listBooks);
router.get('/:bookId/stream', validateParams(modelValidation.params.book),
    verifyToken, loadAccessibleBook, trackChapterRead, streamBook);
router.get('/:bookId/download', validateParams(modelValidation.params.book),
    verifyToken, downloadBook);
router.get('/:bookId/chapters', validateParams(modelValidation.params.book),
    verifyToken, loadAccessibleBook, validateQuery(modelValidation.chapterCatalog), listReadableBookChapters);
router.get('/:bookId', validateParams(modelValidation.params.bookIdentifier), optionalAuth, getBook);
router.post('/', verifyToken, requireAdmin, validateBody(modelValidation.book.create), createBook);
router.put('/:bookId', verifyToken, requireAdmin, validateParams(modelValidation.params.book),
    validateBody(modelValidation.book.update), updateBook);
router.delete('/bulk', verifyToken, requireAdmin, deleteBulkBooks);
router.delete('/:bookId', verifyToken, requireAdmin, validateParams(modelValidation.params.book), deleteBook);
router.post('/:bookId/chapters/:chapterId/read',
    validateParams(modelValidation.params.bookChapter), verifyToken, loadReadableBook, trackChapterRead, readChapter);

export default router;