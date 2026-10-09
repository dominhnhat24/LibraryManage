// [TUYẾN XÁC THỰC] Đăng ký/đăng nhập, xoay refresh token, đăng xuất và xem hồ sơ.
import { Router } from 'express';
import { login, logout, profile, refresh, register } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, profile);

export default router;
