import Comment from '../models/comment.model.js';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { ROLES } from '../constants/roles.constant.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm getAllComments: Lấy bình luận phân trang của sách đã xuất bản, tìm kiếm nội dung và populate thông tin người viết.
export const getAllComments = async (bookId, filters = {}) => {
    if (!(await Book.exists({ _id: bookId, status: 'published' }))) throw new ApiError(404, 'Book not found');
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = { book: bookId };
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.body = { $regex: escaped, $options: 'i' };
    }
    const [comments, total] = await Promise.all([
        Comment.find(query).populate('user', 'name role').sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Comment.countDocuments(query)
    ]);
    return { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getCommentById: Lấy một bình luận cùng thông tin user/sách liên quan và trả 404 khi không tồn tại.
export const getCommentById = async (commentId) => {
    const comment = await Comment.findById(commentId)
        .populate('user', 'name role').populate('book', 'title slug');
    if (!comment) throw new ApiError(404, 'Comment not found');
    return comment;
};

// Hàm createComment: Xác nhận sách tồn tại rồi tạo bình luận gắn với user đã xác thực.
export const createComment = async (bookId, userId, data) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Comment data must be an object');
    }
    if (!(await Book.exists({ _id: bookId, status: 'published' }))) throw new ApiError(404, 'Book not found');
    return Comment.create({
        body: data.body,
        rating: data.rating,
        book: bookId,
        user: userId
    });
};

// Hàm updateComment: Chỉ cho chủ bình luận hoặc ADMIN cập nhật nội dung/đánh giá; trả 404 hoặc 403 phù hợp.
export const updateComment = async (commentId, user, data) => {
    if (!user || !user._id) throw new ApiError(401, 'Authentication is required');
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Comment update must be an object');
    }
    const filter = { _id: commentId };
    if (user.role !== ROLES.ADMIN) filter.user = user._id;
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['body', 'rating'].includes(field)));
    if (Object.keys(payload).length === 0) throw new ApiError(400, 'Comment update has no editable fields');
    const comment = await Comment.findOneAndUpdate(filter, { $set: payload }, {
        new: true,
        runValidators: true
    });
    if (!comment) {
        const exists = await Comment.exists({ _id: commentId });
        throw new ApiError(exists ? 403 : 404, exists
            ? 'You cannot edit this comment' : 'Comment not found');
    }
    return comment;
};

// Hàm deleteComment: Chỉ chủ bình luận hoặc ADMIN có thể xóa bình luận, ngăn xóa chéo tài khoản.
export const deleteComment = async (commentId, user) => {
    if (!user || !user._id) throw new ApiError(401, 'Authentication is required');
    const filter = { _id: commentId };
    if (user.role !== ROLES.ADMIN) filter.user = user._id;
    const comment = await Comment.findOneAndDelete(filter);
    if (!comment) {
        const exists = await Comment.exists({ _id: commentId });
        throw new ApiError(exists ? 403 : 404, exists
            ? 'You cannot delete this comment' : 'Comment not found');
    }
    return comment;
};


// Hàm getAllAdminComments: Trả toàn bộ bình luận hệ thống theo trang, mới nhất trước; dùng riêng cho màn kiểm duyệt ADMIN.
export const getAllAdminComments = async (filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = {};
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.body = { $regex: escaped, $options: 'i' };
    }
    const [comments, total] = await Promise.all([
        Comment.find(query)
            .populate('user', 'name email role')
            .populate('book', 'title slug')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Comment.countDocuments(query)
    ]);
    return { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};
