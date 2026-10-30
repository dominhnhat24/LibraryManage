// [TUYẾN QUẢN TRỊ] Bảo vệ mọi nghiệp vụ quản trị bằng access token và vai trò admin.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/admin.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import multer từ multer để dùng trong module.
import multer from 'multer';
// Import { approveSubscription, rejectSubscription } từ ../controllers/subscription.controller.js để dùng trong module.
import { approveSubscription, rejectSubscription } from '../controllers/subscription.controller.js';
// Import { deleteReport, getPendingSubscriptions, getRecentUsers, getReport, getRepo từ ../controllers/admin.controller.js để dùng trong module.
import { deleteReport, getPendingSubscriptions, getRecentUsers, getReport, getReports, grantPremium, grantVip, updateReportStatus, uploadBookFile } from '../controllers/admin.controller.js';
// Import { getAdminDashboard } từ ../controllers/dashboard.controller.js để dùng trong module.
import { getAdminDashboard } from '../controllers/dashboard.controller.js';
// Import { listAdminComments } từ ../controllers/interaction.controller.js để dùng trong module.
import { listAdminComments } from '../controllers/interaction.controller.js';
// Import { createBook, deleteBook, listAdminBooks, updateBook } từ ../controllers/book.controller.js để dùng trong module.
import { createBook, deleteBook, listAdminBooks, updateBook } from '../controllers/book.controller.js';
// Import { createUser, deleteUser, getAllUsers, getUser, updateUser } từ ../controllers/user.controller.js để dùng trong module.
import { createUser, deleteUser, getAllUsers, getUser, updateUser } from '../controllers/user.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { requireAdmin } từ ../middlewares/role.middleware.js để dùng trong module.
import { requireAdmin } from '../middlewares/role.middleware.js';
// Import { validateBody, validateParams, validateQuery } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
// Import { modelValidation } từ ../validations/model.validation.js để dùng trong module.
import { modelValidation } from '../validations/model.validation.js';
// Import { getAllSubscriptions, getSubscription, updateSubscription, deleteSubscript từ ../controllers/subscription.controller.js để dùng trong module.
import { getAllSubscriptions, getSubscription, updateSubscription, deleteSubscription } from '../controllers/subscription.controller.js';
// Import { importBookCandidate, searchBookImportCandidates } từ ../controllers/book-import.controller.js để dùng trong module.
import { importBookCandidate, searchBookImportCandidates } from '../controllers/book-import.controller.js';

// [GIỚI HẠN UPLOAD] Đọc vào bộ nhớ với dung lượng tối đa để tránh public temp folder hoặc upload tùy ý.
// Khai báo upload nhận giá trị từ multer({ storage: multer.memoryStorage(), limits: { fil. const giữ biến không gán lại; let cho phép cập nhật.
const upload = multer({
    // Trường storage lưu multer.memoryStorage() làm giá trị trong object.
    storage: multer.memoryStorage(),
    // Trường limits lưu { fileSize: 100 * 1024 * 1024, files: 1 } làm giá trị trong object.
    limits: { fileSize: 100 * 1024 * 1024, files: 1 }
});

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Gọi/thực thi router.use với các đối số để thực hiện thao tác: router.use(verifyToken, requireAdmin)
router.use(verifyToken, requireAdmin);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/dashboard', getAdminDashboard)
router.get('/dashboard', getAdminDashboard);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/comments', listAdminComments)
router.get('/comments', listAdminComments);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/users', validateQuery(modelValidation.userList), getAllUsers)
router.get('/users', validateQuery(modelValidation.userList), getAllUsers);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/users', validateBody(modelValidation.user.create), createUser
router.post('/users', validateBody(modelValidation.user.create), createUser);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/users/recent', getRecentUsers)
router.get('/users/recent', getRecentUsers);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/users/:userId', validateParams(modelValidation.params.user), g
router.get('/users/:userId', validateParams(modelValidation.params.user), getUser);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/users/:userId', validateParams(modelValidation.params.user),
router.patch('/users/:userId', validateParams(modelValidation.params.user),
    validateBody(modelValidation.user.update), updateUser);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/users/:userId', validateParams(modelValidation.params.user)
router.delete('/users/:userId', validateParams(modelValidation.params.user), deleteUser);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/reports', validateQuery(modelValidation.reportList), getReport
router.get('/reports', validateQuery(modelValidation.reportList), getReports);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/reports/:reportId', validateParams(modelValidation.params.repo
router.get('/reports/:reportId', validateParams(modelValidation.params.report), getReport);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/reports/:reportId', validateParams(modelValidation.params.re
router.patch('/reports/:reportId', validateParams(modelValidation.params.report),
    validateBody(modelValidation.report.update), updateReportStatus);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/reports/:reportId', validateParams(modelValidation.params.r
router.delete('/reports/:reportId', validateParams(modelValidation.params.report), deleteReport);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/subscriptions', validateQuery(modelValidation.subscription.lis
router.get('/subscriptions', validateQuery(modelValidation.subscription.list), getAllSubscriptions);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/subscriptions/pending', validateQuery(modelValidation.subscrip
router.get('/subscriptions/pending', validateQuery(modelValidation.subscription.list), getPendingSubscriptions);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/subscriptions/:subscriptionId/approve', validateParams(model
router.patch('/subscriptions/:subscriptionId/approve',
    validateParams(modelValidation.params.subscription), approveSubscription);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/subscriptions/:subscriptionId/reject', validateParams(modelV
router.patch('/subscriptions/:subscriptionId/reject',
    validateParams(modelValidation.params.subscription), rejectSubscription);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/subscriptions/:subscriptionId', validateParams(modelValidation
router.get('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription), getSubscription);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/subscriptions/:subscriptionId', validateParams(modelValidati
router.patch('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription),
    validateBody(modelValidation.subscription.update), updateSubscription);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/subscriptions/:subscriptionId', validateParams(modelValidat
router.delete('/subscriptions/:subscriptionId', validateParams(modelValidation.params.subscription), deleteSubscription);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/users/:userId/vip', validateParams(modelValidation.params.us
router.patch('/users/:userId/vip', validateParams(modelValidation.params.user),
    validateBody(modelValidation.vipGrant), grantVip);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/users/:userId/premium', validateParams(modelValidation.param
router.patch('/users/:userId/premium', validateParams(modelValidation.params.user),
    validateBody(modelValidation.premiumGrant), grantPremium);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/books', validateQuery(modelValidation.book.list), listAdminBoo
router.get('/books', validateQuery(modelValidation.book.list), listAdminBooks);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/book-import/search', searchBookImportCandidates)
router.get('/book-import/search', searchBookImportCandidates);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/book-import/import', importBookCandidate)
router.post('/book-import/import', importBookCandidate);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/books', upload.single('file'), validateBody(modelValidation.b
router.post('/books', upload.single('file'), validateBody(modelValidation.book.create), createBook);
// Gọi/thực thi router.put với các đối số để thực hiện thao tác: router.put('/books/:bookId', validateParams(modelValidation.params.book), v
router.put('/books/:bookId', validateParams(modelValidation.params.book),
    validateBody(modelValidation.book.update), updateBook);
// Gọi/thực thi router.delete với các đối số để thực hiện thao tác: router.delete('/books/:bookId', validateParams(modelValidation.params.book)
router.delete('/books/:bookId', validateParams(modelValidation.params.book), deleteBook);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/books/:bookId/file', validateParams(modelValidation.params.bo
router.post('/books/:bookId/file', validateParams(modelValidation.params.book),
    upload.single('file'), uploadBookFile);

// export default cung cấp giá trị này để module khác import.
export default router;
