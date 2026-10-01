// Định tuyến tra cứu và cập nhật khoản phạt; mọi tuyến yêu cầu người dùng hợp lệ.
import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import * as controller from '../controllers/fine.controller.js';
import { validateFineId, validateFineQuery, validateWaiveFine } from '../validators/fine.validator.js';
import validateRequest from '../middlewares/validate-request.js';

const router = express.Router();
// Độc giả và thủ thư được tra cứu; các hành động trả/miễn phạt chỉ dành cho thủ thư.
router.use(loginRequired, checkRole('reader', 'librarian'));
router.get('/', validateFineQuery, validateRequest, controller.listFines);
router.get('/:id', validateFineId, validateRequest, controller.getFine);
router.patch('/:id/pay', checkRole('librarian'), validateFineId, validateRequest, controller.payFine);
router.patch('/:id/waive', checkRole('librarian'), validateWaiveFine, validateRequest, controller.waiveFine);
export default router;
