import express from 'express';
import * as bookController from '../controllers/book.controller.js';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import { validateCreateBook, validateGetAllBook, validateGetBookById, validateUpdateBook } from '../validators/book.validator.js';

const router = express.Router();

router.get('/', validateGetAllBook, validateRequest, bookController.getAllBooks);
router.get('/:id', validateGetBookById, validateRequest, bookController.getBookById);

router.post(
    '/',
    loginRequired,
    checkRole('librarian'),
    validateCreateBook,
    validateRequest,
    bookController.createBook
);

router.put(
    '/:id',
    loginRequired,
    checkRole('librarian'),
    validateUpdateBook,
    validateRequest,
    bookController.updateBook
);

router.delete(
    '/:id',
    loginRequired,
    checkRole('librarian'),
    bookController.deleteBook
);

export default router;
