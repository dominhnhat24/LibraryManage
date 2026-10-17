import { Router } from 'express';
import { createBookmark, deleteBookmark, getAllBookmarks, getBookmark, updateBookmark } from '../controllers/bookmark.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.use(verifyToken);
router.get('/', validateQuery(modelValidation.bookmark.list), getAllBookmarks);
router.post('/', validateBody(modelValidation.bookmark.create), createBookmark);
router.get('/:bookmarkId', validateParams(modelValidation.params.bookmark), getBookmark);
router.patch('/:bookmarkId', validateParams(modelValidation.params.bookmark),
    validateBody(modelValidation.bookmark.update), updateBookmark);
router.delete('/:bookmarkId', validateParams(modelValidation.params.bookmark), deleteBookmark);

export default router;
