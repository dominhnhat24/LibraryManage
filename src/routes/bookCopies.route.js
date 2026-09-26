import express from 'express';
import bookCopyController from '../controllers/bookCopies.controller.js';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import { validateCreateBookCopy, validateUpdateBookCopy } from '../validators/bookCopies.validator.js';

const router = express.Router();

router.route('/')
    .get(bookCopyController.getAllBookCopies)
    .post(loginRequired, checkRole('librarian'), validateCreateBookCopy, validateRequest, bookCopyController.createBookCopy);

router.route('/:id')
    .get(bookCopyController.getBookCopyById)
    .put(loginRequired, checkRole('librarian'), validateUpdateBookCopy, validateRequest, bookCopyController.updateBookCopy)
    .delete(loginRequired, checkRole('librarian'), bookCopyController.deleteBookCopy);

export default router;