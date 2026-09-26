import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import * as controller from '../controllers/fine.controller.js';
import { validateFineId, validateFineQuery, validateWaiveFine } from '../validators/fine.validator.js';
import validateRequest from '../middlewares/validate-request.js';

const router = express.Router();
router.use(loginRequired, checkRole('reader', 'librarian'));
router.get('/', validateFineQuery, validateRequest, controller.listFines);
router.get('/:id', validateFineId, validateRequest, controller.getFine);
router.patch('/:id/pay', checkRole('librarian'), validateFineId, validateRequest, controller.payFine);
router.patch('/:id/waive', checkRole('librarian'), validateWaiveFine, validateRequest, controller.waiveFine);
export default router;
