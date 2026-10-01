// Định tuyến quản lý thủ thư; toàn bộ API trong router yêu cầu tài khoản thủ thư đã xác thực.
import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import * as controller from '../controllers/librarian.controller.js';
import {
    validateCreateLibrarian,
    validateLibrarianId,
    validateLibrarianQuery,
    validateProfileUpdate,
    validateUpdateLibrarian
} from '../validators/librarian.validator.js';

const router = express.Router();
router.use(loginRequired, checkRole('librarian'));

// Hồ sơ cá nhân không nhận ID từ client; các tuyến bên dưới quản lý tài khoản theo quyền thủ thư.
router.get('/me', controller.getMyProfile);
router.put('/me', validateProfileUpdate, validateRequest, controller.updateMyProfile);
router.get('/', validateLibrarianQuery, validateRequest, controller.listLibrarians);
router.post('/', validateCreateLibrarian, validateRequest, controller.createLibrarian);
router.get('/:id', validateLibrarianId, validateRequest, controller.getLibrarian);
router.put('/:id', validateUpdateLibrarian, validateRequest, controller.updateLibrarian);
router.patch('/:id/block', validateLibrarianId, validateRequest, controller.blockLibrarian);

export default router;
