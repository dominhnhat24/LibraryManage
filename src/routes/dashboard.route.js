// Cung cấp tuyến thống kê tổng quan chỉ dành cho thủ thư đã đăng nhập.
import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import { getSummary } from '../controllers/dashboard.controller.js';

const router = express.Router();
// Xác thực JWT và vai trò trước khi truy vấn số liệu.
router.get('/', loginRequired, checkRole('librarian'), getSummary);

export default router;
