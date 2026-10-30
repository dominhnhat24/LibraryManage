// [TUYẾN SÁCH] Catalog công khai, nội dung chương có kiểm tra quyền và CRUD admin.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/book.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { createBook, deleteBook, deleteBulkBooks, getBook, importBooksExcelControl từ ../controllers/book.controller.js để dùng trong module.
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
// Import { downloadBook, streamBook } từ ../controllers/download.controller.js để dùng trong module.
import { downloadBook, streamBook } from '../controllers/download.controller.js';
// Import { readChapter } từ ../controllers/ads.controller.js để dùng trong module.
import { readChapter } from '../controllers/ads.controller.js';
// Import { completeReadableChapter, getReadableChapterMetadata, listReadableBookChap từ ../controllers/chapter.controller.js để dùng trong module.
import { completeReadableChapter, getReadableChapterMetadata, listReadableBookChapters } from '../controllers/chapter.controller.js';
// Import { optionalAuth, verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { optionalAuth, verifyToken } from '../middlewares/auth.middleware.js';
// Import { checkDownloadPermission, requireAdmin } từ ../middlewares/role.middleware.js để dùng trong module.
import { checkDownloadPermission, requireAdmin } from '../middlewares/role.middleware.js';
// Import { validateBody, validateParams, validateQuery } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';
// Import multer từ multer để dùng trong module.
import multer from 'multer';
// Import { getImportedBookCover } từ ../controllers/book-import.controller.js để dùng trong module.
import { getImportedBookCover } from '../controllers/book-import.controller.js';

// Khai báo upload nhận giá trị từ multer({ storage: multer.memoryStorage() }). const giữ biến không gán lại; let cho phép cập nhật.
const upload = multer({ storage: multer.memoryStorage() }); // Lưu tạm file trên RAM để đọc
// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();

// Route nhận file Excel từ frontend gửi lên (đã tích hợp bảo vệ quyền Admin và xác thực token)
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/import-excel', verifyToken, requireAdmin, upload.single('file
router.post('/import-excel', verifyToken, requireAdmin, upload.single('file'), importBooksExcelController);

// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId/cover', validateParams(modelValidation.params.book), g
router.get('/:bookId/cover', validateParams(modelValidation.params.book), getImportedBookCover);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/', validateQuery(modelValidation.book.list), listBooks)
router.get('/', validateQuery(modelValidation.book.list), listBooks);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId/stream', validateParams(modelValidation.params.book),
router.get('/:bookId/stream', validateParams(modelValidation.params.book),
    optionalAuth, loadAccessibleBook, streamBook);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId/download', validateParams(modelValidation.params.book)
router.get('/:bookId/download', validateParams(modelValidation.params.book),
    verifyToken, checkDownloadPermission, downloadBook);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId/chapters', validateParams(modelValidation.params.book)
router.get('/:bookId/chapters', validateParams(modelValidation.params.book),
    optionalAuth, loadAccessibleBook, validateQuery(modelValidation.chapterCatalog), listReadableBookChapters);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId/chapters/:chapterId', validateParams(modelValidation.p
router.get('/:bookId/chapters/:chapterId', validateParams(modelValidation.params.bookChapter),
    optionalAuth, loadReadableBook, getReadableChapterMetadata);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/:bookId', validateParams(modelValidation.params.bookIdentifier
router.get('/:bookId', validateParams(modelValidation.params.bookIdentifier), optionalAuth, getBook);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/', verifyToken, requireAdmin, validateBody(modelValidation.bo
router.post('/', verifyToken, requireAdmin, validateBody(modelValidation.book.create), createBook);
// Gọi/thực thi router.put với các đối số để thực hiện thao tác: router.put('/:bookId', verifyToken, requireAdmin, validateParams(modelValid
router.put('/:bookId', verifyToken, requireAdmin, validateParams(modelValidation.params.book),
    validateBody(modelValidation.book.update), updateBook);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/bulk', verifyToken, requireAdmin, deleteBulkBooks)
router.delete('/bulk', verifyToken, requireAdmin, deleteBulkBooks);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/:bookId', verifyToken, requireAdmin, validateParams(modelVa
router.delete('/:bookId', verifyToken, requireAdmin, validateParams(modelValidation.params.book), deleteBook);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/:bookId/chapters/:chapterId/read', validateParams(modelValida
router.post('/:bookId/chapters/:chapterId/read',
    validateParams(modelValidation.params.bookChapter), optionalAuth, loadReadableBook, readChapter);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/:bookId/chapters/:chapterId/complete', validateParams(modelVa
router.post('/:bookId/chapters/:chapterId/complete',
    validateParams(modelValidation.params.bookChapter), verifyToken, loadReadableBook, completeReadableChapter);

// export default cung cấp giá trị này để module khác import.
export default router;
