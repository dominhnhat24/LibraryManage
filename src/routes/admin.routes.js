// [TUYẾN QUẢN TRỊ] Bảo vệ mọi nghiệp vụ quản trị bằng access token và vai trò admin.
import { Router } from 'express';
import multer from 'multer';
import { approveSubscription, rejectSubscription } from '../controllers/subscription.controller.js';
import { deleteReport, getPendingSubscriptions, getRecentUsers, getReport, getReports, grantPremium, grantVip, updateReportStatus, uploadBookFile } from '../controllers/admin.controller.js';
import { getAdminDashboard } from '../controllers/dashboard.controller.js';
import { listAdminComments } from '../controllers/interaction.controller.js';
import { createBook, deleteBook, listAdminBooks, updateBook } from '../controllers/book.controller.js';
import { createUser, deleteUser, getAllUsers, getUser, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';
import { getAllSubscriptions, getSubscription, updateSubscription, deleteSubscription } from '../controllers/subscription.controller.js';
import { importBookCandidate, searchBookImportCandidates } from '../controllers/book-import.controller.js';

// [GIỚI HẠN UPLOAD] Đọc vào bộ nhớ với dung lượng tối đa để tránh public temp folder hoặc upload tùy ý.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024, files: 1 }
});

const router = Router();
router.use(verifyToken, requireAdmin);
router.get('/dashboard', getAdminDashboard);
router.get('/comments', listAdminComments);
router.get('/users', validateQuery(modelValidation.userList), getAllUsers);
router.post('/users', validateBody(modelValidation.user.create), createUser);
router.get('/users/recent', getRecentUsers);
router.get('/users/:userId', validateParams(modelValidation.params.user), getUser);
router.patch('/users/:userId', validateParams(modelValidation.params.user),
    validateBody(modelValidation.user.update), updateUser);
router.delete('/users/:userId', validateParams(modelValidation.params.user), deleteUser);
router.get('/reports', validateQuery(modelValidation.reportList), getReports);
router.get('/reports/:reportId', validateParams(modelValidation.params.report), getReport);
router.patch('/reports/:reportId', validateParams(modelValidation.params.report),
    validateBody(modelValidation.report.update), updateReportStatus);
router.delete('/reports/:reportId', validateParams(modelValidation.params.report), deleteReport);
router.get('/subscriptions', validateQuery(modelValidation.subscription.list), getAllSubscriptions);
router.get('/subscriptions/pending', validateQuery(modelValidation.subscription.list), getPendingSubscriptions);
router.patch('/subscriptions/:subscriptionId/approve',
    validateParams(modelValidation.params.subscription), approveSubscription);
router.patch('/subscriptions/:subscriptionId/reject',
    validateParams(modelValidation.params.subscription), rejectSubscription);
router.get('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription), getSubscription);
router.patch('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription),
    validateBody(modelValidation.subscription.update), updateSubscription);
router.delete('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription), deleteSubscription);
router.patch('/users/:userId/vip', validateParams(modelValidation.params.user),
    validateBody(modelValidation.vipGrant), grantVip);
router.patch('/users/:userId/premium', validateParams(modelValidation.params.user),
    validateBody(modelValidation.premiumGrant), grantPremium);
router.get('/books', validateQuery(modelValidation.book.list), listAdminBooks);
router.get('/book-import/search', searchBookImportCandidates);
router.post('/book-import/import', importBookCandidate);
router.post('/books', upload.single('file'), validateBody(modelValidation.book.create), createBook);
router.put('/books/:bookId', validateParams(modelValidation.params.book),
    validateBody(modelValidation.book.update), updateBook);
router.delete('/books/:bookId', validateParams(modelValidation.params.book), deleteBook);
router.post('/books/:bookId/file', validateParams(modelValidation.params.book),
    upload.single('file'), uploadBookFile);

export default router;
