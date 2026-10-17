// [TUYẾN XÁC THỰC] Đăng ký/đăng nhập, xoay refresh token, đăng xuất và xem hồ sơ.
import { Router } from 'express';
import {
    adminLogin, login, logout, profile, refresh, register, resendVerification, verifyEmail
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { authValidation } from '../validations/auth.validation.js';

const router = Router();
router.post('/register', validateBody(authValidation.register), register);
router.post('/verify-email', validateBody(authValidation.verifyEmail), verifyEmail);
router.post('/resend-verification', validateBody(authValidation.resendVerification), resendVerification);
router.post('/login', validateBody(authValidation.login), login);
router.post('/admin-login', validateBody(authValidation.login), adminLogin);
router.post('/refresh', validateBody(authValidation.refresh), refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, profile);

export default router;
