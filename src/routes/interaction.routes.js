// [TUYẾN TƯƠNG TÁC] Cung cấp bình luận/đánh giá cho sách với xác thực ở thao tác ghi.
import { Router } from 'express';
import { createComment, deleteComment, getComment, listComments, updateComment } from '../controllers/interaction.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import { modelValidation } from '../validations/model.validation.js';

const router = Router();
router.get('/books/:bookId/comments', validateParams(modelValidation.params.book),
    validateQuery(modelValidation.comment.list), listComments);
router.post('/books/:bookId/comments', verifyToken, validateParams(modelValidation.params.book),
    validateBody(modelValidation.comment.create), createComment);
router.get('/comments/:commentId', validateParams(modelValidation.params.comment), getComment);
router.patch('/comments/:commentId', verifyToken, validateParams(modelValidation.params.comment),
    validateBody(modelValidation.comment.update), updateComment);
router.delete('/comments/:commentId', verifyToken, validateParams(modelValidation.params.comment), deleteComment);

export default router;
