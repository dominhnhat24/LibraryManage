// [TUYẾN TƯƠNG TÁC] Cung cấp bình luận/đánh giá cho sách với xác thực ở thao tác ghi.
import { Router } from 'express';
import { createComment, deleteComment, listComments, updateComment } from '../controllers/interaction.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/books/:bookId/comments', listComments);
router.post('/books/:bookId/comments', verifyToken, createComment);
router.patch('/comments/:commentId', verifyToken, updateComment);
router.delete('/comments/:commentId', verifyToken, deleteComment);

export default router;
