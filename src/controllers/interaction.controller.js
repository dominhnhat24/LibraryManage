// [CONTROLLER BÌNH LUẬN] Đọc, tạo, cập nhật và xóa bình luận/đánh giá theo quyền sở hữu.
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as commentService from '../services/comment.service.js';
import { mapDtoList, toCommentDto } from '../utils/api-dto.js';

// [LIỆT KÊ BÌNH LUẬN] Trả bình luận mới nhất trước, không kèm thông tin nhạy cảm của người dùng.
export const listComments = asyncHandler(async (req, res) => {
    const result = await commentService.getAllComments(req.params.bookId, { ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.comments, toCommentDto),
        pagination: result.pagination
    });
});

// Hàm getComment: Lấy một bình luận theo ID và trả DTO đã populate dữ liệu người viết/sách.
export const getComment = asyncHandler(async (req, res) => {
    const comment = await commentService.getCommentById(req.params.commentId);
    return res.json({ status: 'success', data: toCommentDto(comment) });
});

// [TẠO BÌNH LUẬN] Cho phép mỗi người dùng một bình luận/đánh giá trên mỗi sách.
export const createComment = asyncHandler(async (req, res) => {
    const body = String(req.body.body || '').trim();
    const rating = req.body.rating === undefined || req.body.rating === null
        ? null : Number(req.body.rating);
    const violations = [];
    if (!body || body.length > 3000) violations.push({ field: 'body', message: 'Comment is required and must be at most 3000 characters' });
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        violations.push({ field: 'rating', message: 'Rating must be an integer from 1 to 5' });
    }
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);
    const comment = await commentService.createComment(req.params.bookId, req.authUser._id, { body, rating });
    return res.status(201).json({ status: 'success', data: toCommentDto(comment) });
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
    const comment = await commentService.updateComment(req.params.commentId, req.authUser, update);
    return res.json({ status: 'success', data: toCommentDto(comment) });
});

// [XÓA BÌNH LUẬN] Người viết hoặc admin có thể gỡ bình luận khỏi sách.
export const deleteComment = asyncHandler(async (req, res) => {
    const comment = await commentService.deleteComment(req.params.commentId, req.authUser);
    return res.json({
        status: 'success',
        message: 'Comment deleted successfully',
        data: toCommentDto(comment)
    });
});
