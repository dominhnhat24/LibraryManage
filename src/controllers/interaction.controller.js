// [CONTROLLER BÌNH LUẬN] Đọc, tạo, cập nhật và xóa bình luận/đánh giá theo quyền sở hữu.
import Comment from '../models/comment.model.js';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// [LIỆT KÊ BÌNH LUẬN] Trả bình luận mới nhất trước, không kèm thông tin nhạy cảm của người dùng.
export const listComments = asyncHandler(async (req, res) => {
    if (!(await Book.exists({ _id: req.params.bookId, status: 'published' }))) {
        throw new ApiError(404, 'Book not found');
    }
    const comments = await Comment.find({ book: req.params.bookId })
        .populate('user', 'name role').sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ status: 'success', data: comments });
});

// [TẠO BÌNH LUẬN] Cho phép mỗi người dùng một bình luận/đánh giá trên mỗi sách.
export const createComment = asyncHandler(async (req, res) => {
    if (!(await Book.exists({ _id: req.params.bookId, status: 'published' }))) {
        throw new ApiError(404, 'Book not found');
    }
    const body = String(req.body.body || '').trim();
    const rating = req.body.rating === undefined || req.body.rating === null
        ? null : Number(req.body.rating);
    const violations = [];
    if (!body || body.length > 3000) violations.push({ field: 'body', message: 'Comment is required and must be at most 3000 characters' });
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        violations.push({ field: 'rating', message: 'Rating must be an integer from 1 to 5' });
    }
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);
    const comment = await Comment.create({
        book: req.params.bookId, user: req.authUser._id, body, rating
    });
    return res.status(201).json({ status: 'success', data: comment });
});

// [SỬA BÌNH LUẬN] Chỉ chủ sở hữu hoặc admin được sửa nội dung và điểm đánh giá.
export const updateComment = asyncHandler(async (req, res) => {
    const update = {};
    if (req.body.body !== undefined) {
        const body = String(req.body.body).trim();
        if (!body || body.length > 3000) throw new ApiError(400, 'Comment is invalid');
        update.body = body;
    }
    if (req.body.rating !== undefined) {
        const rating = req.body.rating === null ? null : Number(req.body.rating);
        if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
            throw new ApiError(400, 'Rating must be an integer from 1 to 5');
        }
        update.rating = rating;
    }
    const filter = { _id: req.params.commentId };
    if (req.authUser.role !== 'admin') filter.user = req.authUser._id;
    const comment = await Comment.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    if (!comment) {
        const exists = await Comment.exists({ _id: req.params.commentId });
        throw new ApiError(exists ? 403 : 404, exists ? 'You cannot edit this comment' : 'Comment not found');
    }
    return res.json({ status: 'success', data: comment });
});

// [XÓA BÌNH LUẬN] Người viết hoặc admin có thể gỡ bình luận khỏi sách.
export const deleteComment = asyncHandler(async (req, res) => {
    const filter = { _id: req.params.commentId };
    if (req.authUser.role !== 'admin') filter.user = req.authUser._id;
    const comment = await Comment.findOneAndDelete(filter);
    if (!comment) {
        const exists = await Comment.exists({ _id: req.params.commentId });
        throw new ApiError(exists ? 403 : 404, exists ? 'You cannot delete this comment' : 'Comment not found');
    }
    return res.json({ status: 'success', message: 'Comment deleted successfully' });
});
