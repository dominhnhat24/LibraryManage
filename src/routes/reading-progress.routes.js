import { Router } from 'express';
import {
    clearAllReadingProgress, createReadingProgress, deleteReadingProgress, getAllReadingProgress,
    getReadingProgress, updateReadingProgress
} from '../controllers/reading-progress.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.use(verifyToken);
router.get('/', validateQuery(modelValidation.readingProgress.list), getAllReadingProgress);
router.post('/', validateBody(modelValidation.readingProgress.create), createReadingProgress);
router.delete('/', clearAllReadingProgress);
router.get('/:progressId', validateParams(modelValidation.params.progress), getReadingProgress);
router.patch('/:progressId', validateParams(modelValidation.params.progress),
    validateBody(modelValidation.readingProgress.update), updateReadingProgress);
router.delete('/:progressId', validateParams(modelValidation.params.progress), deleteReadingProgress);

export default router;
