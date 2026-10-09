// [TUYẾN QUẢN TRỊ] Bảo vệ mọi nghiệp vụ quản trị bằng access token và vai trò admin.
import { Router } from 'express';
import multer from 'multer';
import { approveSubscription, rejectSubscription } from '../controllers/subscription.controller.js';
import { getPendingSubscriptions, getRecentUsers, getReports, grantVip, updateReportStatus, uploadBookFile } from '../controllers/admin.controller.js';
import { createBook, deleteBook, updateBook } from '../controllers/book.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';

// [GIỚI HẠN UPLOAD] Đọc vào bộ nhớ với dung lượng tối đa để tránh public temp folder hoặc upload tùy ý.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024, files: 1 }
});

const router = Router();
router.use(verifyToken, checkRole('admin'));
router.get('/users/recent', getRecentUsers);
router.get('/reports', getReports);
router.patch('/reports/:reportId', updateReportStatus);
router.get('/subscriptions/pending', getPendingSubscriptions);
router.patch('/subscriptions/:subscriptionId/approve', approveSubscription);
router.patch('/subscriptions/:subscriptionId/reject', rejectSubscription);
router.patch('/users/:userId/vip', grantVip);
router.post('/books', createBook);
router.put('/books/:bookId', updateBook);
router.delete('/books/:bookId', deleteBook);
router.post('/books/:bookId/file', upload.single('file'), uploadBookFile);

export default router;
