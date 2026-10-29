// [TUYẾN XÁC THỰC] Đăng ký/đăng nhập, xoay refresh token, đăng xuất và xem hồ sơ.
import { Router } from 'express';
import {
    adminLogin, changePassword, login, logout, profile, refresh, register,
    resendVerification, updateProfile, verifyEmail
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { authValidation } from '../validations/auth.validation.js';
import { uploadMyAvatar, serveAvatar } from '../controllers/avatar.controller.js';
import multer from 'multer';

const router = Router();
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
router.post('/register', validateBody(authValidation.register), register);
router.post('/verify-email', validateBody(authValidation.verifyEmail), verifyEmail);
router.post('/resend-verification', validateBody(authValidation.resendVerification), resendVerification);
router.post('/login', validateBody(authValidation.login), login);
router.post('/admin-login', validateBody(authValidation.login), adminLogin);
router.post('/refresh', validateBody(authValidation.refresh), refresh);
router.get('/avatars/:key', serveAvatar);
router.patch('/me', verifyToken, validateBody(authValidation.updateProfile), updateProfile);
router.post('/me/avatar', verifyToken, avatarUpload.single('avatar'), uploadMyAvatar);
router.post('/change-password', verifyToken, validateBody(authValidation.changePassword), changePassword);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, profile);

export default router;
