import * as commentService from '../services/comment.service.js';

export const getBookComments = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const result = await commentService.getAllComments(bookId, req.query);
    res.status(200).json({ status: 'success', data: result.comments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    await commentService.deleteComment(commentId, req.user);
    res.status(200).json({ status: 'success', message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};