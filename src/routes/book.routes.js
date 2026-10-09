// [TUYẾN SÁCH] Catalog công khai, nội dung chương có kiểm tra quyền và CRUD admin.
import { Router } from 'express';
import { createBook, deleteBook, getBook, getMyBooks, listBooks, loadAccessibleBook, loadReadableBook, updateBook } from '../controllers/book.controller.js';
import { downloadBook, streamBook } from '../controllers/download.controller.js';
import { readChapter } from '../controllers/ads.controller.js';
import { optionalAuth, verifyToken } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import { trackChapterRead } from '../middlewares/ads.middleware.js';

const router = Router();
router.get('/', listBooks);
router.get('/mine', verifyToken, checkRole('author'), getMyBooks);
router.get('/:bookId/stream', verifyToken, loadAccessibleBook, trackChapterRead, streamBook);
router.get('/:bookId', optionalAuth, getBook);
router.post('/', verifyToken, checkRole('admin', 'author'), createBook);
router.put('/:bookId', verifyToken, checkRole('admin', 'author'), updateBook);
router.delete('/:bookId', verifyToken, checkRole('admin'), deleteBook);
router.post('/:bookId/chapters/:chapterId/read',
    verifyToken, loadReadableBook, trackChapterRead, readChapter);

export default router;
