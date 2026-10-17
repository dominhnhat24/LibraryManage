import { Router } from 'express';
import { getBookComments, deleteComment } from '../controllers/comment.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/books/:bookId/comments', getBookComments);
router.delete('/comments/:commentId', verifyToken, deleteComment);

export default router;