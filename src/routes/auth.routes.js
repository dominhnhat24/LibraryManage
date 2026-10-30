// [TUYẾN XÁC THỰC] Đăng ký/đăng nhập, xoay refresh token, đăng xuất và xem hồ sơ.
// Import { Router } từ express để dùng trong module.
/**
 * Tệp src/routes/auth.routes.js: định tuyến HTTP, nối URL với middleware/controller. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { Router } from 'express';
// Import { adminLogin, changePassword, login, logout, profile, refresh, register, re từ ../controllers/auth.controller.js để dùng trong module.
import {
    adminLogin, changePassword, login, logout, profile, refresh, register,
    resendVerification, updateProfile, verifyEmail
} from '../controllers/auth.controller.js';
// Import { verifyToken } từ ../middlewares/auth.middleware.js để dùng trong module.
import { verifyToken } from '../middlewares/auth.middleware.js';
// Import { validateBody } từ ../middlewares/validation.middleware.js để dùng trong module.
import { validateBody } from '../middlewares/validation.middleware.js';
// Import { authValidation } từ ../validations/auth.validation.js để dùng trong module.
import { authValidation } from '../validations/auth.validation.js';
// Import { uploadMyAvatar, serveAvatar } từ ../controllers/avatar.controller.js để dùng trong module.
import { uploadMyAvatar, serveAvatar } from '../controllers/avatar.controller.js';
// Import multer từ multer để dùng trong module.
import multer from 'multer';

// Khai báo router nhận giá trị từ Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = Router();
// Khai báo avatarUpload nhận giá trị từ multer({ storage: multer.memoryStorage(), limits: { fil. const giữ biến không gán lại; let cho phép cập nhật.
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/register', validateBody(authValidation.register), register)
router.post('/register', validateBody(authValidation.register), register);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/verify-email', validateBody(authValidation.verifyEmail), veri
router.post('/verify-email', validateBody(authValidation.verifyEmail), verifyEmail);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/resend-verification', validateBody(authValidation.resendVerif
router.post('/resend-verification', validateBody(authValidation.resendVerification), resendVerification);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/login', validateBody(authValidation.login), login)
router.post('/login', validateBody(authValidation.login), login);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/admin-login', validateBody(authValidation.login), adminLogin)
router.post('/admin-login', validateBody(authValidation.login), adminLogin);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/refresh', validateBody(authValidation.refresh), refresh)
router.post('/refresh', validateBody(authValidation.refresh), refresh);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/avatars/:key', serveAvatar)
router.get('/avatars/:key', serveAvatar);
// Gọi/thực thi router.patch với các đối số để thực hiện thao tác: router.patch('/me', verifyToken, validateBody(authValidation.updateProfile)
router.patch('/me', verifyToken, validateBody(authValidation.updateProfile), updateProfile);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/me/avatar', verifyToken, avatarUpload.single('avatar'), uploa
router.post('/me/avatar', verifyToken, avatarUpload.single('avatar'), uploadMyAvatar);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/change-password', verifyToken, validateBody(authValidation.ch
router.post('/change-password', verifyToken, validateBody(authValidation.changePassword), changePassword);
// Gọi/thực thi router.post với các đối số để thực hiện thao tác: router.post('/logout', verifyToken, logout)
router.post('/logout', verifyToken, logout);
// Gọi/thực thi router.get với các đối số để thực hiện thao tác: router.get('/me', verifyToken, profile)
router.get('/me', verifyToken, profile);

// export default cung cấp giá trị này để module khác import.
export default router;
