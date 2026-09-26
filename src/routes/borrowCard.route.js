import express from 'express';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import * as controller from '../controllers/borrowCard.controller.js';
import { validateBorrowCardId, validateBorrowCardQuery, validateCreateBorrowCard, validateReturnBorrowCard } from '../validators/borrowCard.validator.js';
import validateRequest from '../middlewares/validate-request.js';

const router = express.Router();
router.use(loginRequired, checkRole('reader', 'librarian'));
router.post('/', validateCreateBorrowCard, validateRequest, controller.createBorrowCard);
router.get('/', validateBorrowCardQuery, validateRequest, controller.listBorrowCards);
router.get('/:id', validateBorrowCardId, validateRequest, controller.getBorrowCard);
router.patch('/:id/cancel', checkRole('reader'), validateBorrowCardId, validateRequest, controller.cancelBorrowCard);
router.patch('/:id/approve', checkRole('librarian'), validateBorrowCardId, validateRequest, controller.approveBorrowCard);
router.patch('/:id/return', checkRole('librarian'), validateReturnBorrowCard, validateRequest, controller.returnBorrowCard);
export default router;
