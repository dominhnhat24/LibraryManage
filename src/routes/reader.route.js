import express from 'express';
import readerController from '../controllers/reader.controller.js';
import { loginRequired } from '../middlewares/jwt.js';
import { checkRole } from '../middlewares/checkRole.js';
import validateRequest from '../middlewares/validate-request.js';
import { validateCreateReader, validateReaderId, validateReaderQuery, validateUpdateReader } from '../validators/reader.validator.js';

const router = express.Router();
router.use(loginRequired, checkRole('librarian'));

router.route('/')
    .get(validateReaderQuery, validateRequest, readerController.getAllReaders)
    .post(validateCreateReader, validateRequest, readerController.createReader);

router.route('/:id')
    .get(validateReaderId, validateRequest, readerController.getReaderById)
    .put(validateUpdateReader, validateRequest, readerController.updateReader)
    .delete(validateReaderId, validateRequest, readerController.deleteReader);

export default router;