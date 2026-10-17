import { Router } from 'express';
import { createChapter, deleteChapter, getAllChapters, getChapter, updateChapter } from '../controllers/chapter.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.use(verifyToken, requireAdmin);
router.get('/', validateQuery(modelValidation.chapter.list), getAllChapters);
router.post('/', validateBody(modelValidation.chapter.create), createChapter);
router.get('/:chapterId', validateParams(modelValidation.params.chapterIdentifier), getChapter);
router.patch('/:chapterId', validateParams(modelValidation.params.chapter),
    validateBody(modelValidation.chapter.update), updateChapter);
router.delete('/:chapterId', validateParams(modelValidation.params.chapter), deleteChapter);

export default router;
