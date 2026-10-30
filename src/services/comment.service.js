// Import Comment từ ../models/comment.model.js để dùng trong module.
/**
 * Tệp src/services/comment.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Comment from '../models/comment.model.js';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { ROLES } từ ../constants/roles.constant.js để dùng trong module.
import { ROLES } from '../constants/roles.constant.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm getAllComments: Lấy bình luận phân trang của sách đã xuất bản, tìm kiếm nội dung và populate thông tin người viết.
/**
 * Hàm getAllComments: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookId, filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: exists, ApiError, max, parseInt, min, trim, replace, all.
 */
export const getAllComments = async (bookId, filters = {}) => {
    // if chỉ chạy nhánh này khi điều kiện !(await Book.exists({ _id: bookId, status: 'published' })) đúng.
    if (!(await Book.exists({ _id: bookId, status: 'published' }))) throw new ApiError(404, 'Book not found');
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ { book: bookId }. const giữ biến không gán lại; let cho phép cập nhật.
    const query = { book: bookId };
    // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
    if (typeof filters.search === 'string' && filters.search.trim()) {
        // Khai báo escaped nhận giá trị từ filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\. const giữ biến không gán lại; let cho phép cập nhật.
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.body = { $regex: escaped, $options: 'i' }
        query.body = { $regex: escaped, $options: 'i' };
    }
    // Khai báo [comments, total] nhận giá trị từ await Promise.all([ Comment.find(query).populate('user'. const giữ biến không gán lại; let cho phép cập nhật.
    const [comments, total] = await Promise.all([
        Comment.find(query).populate('user', 'name role').sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Comment.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / về nơi gọi.
    return { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getCommentById: Lấy một bình luận cùng thông tin user/sách liên quan và trả 404 khi không tồn tại.
/**
 * Hàm getCommentById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: commentId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findById, populate, ApiError.
 */
export const getCommentById = async (commentId) => {
    // Khai báo comment nhận giá trị từ await Comment.findById(commentId) .populate('user', 'na. const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await Comment.findById(commentId)
        .populate('user', 'name role').populate('book', 'title slug');
    // if chỉ chạy nhánh này khi điều kiện !comment đúng.
    if (!comment) throw new ApiError(404, 'Comment not found');
    // return kết thúc hàm và trả comment về nơi gọi.
    return comment;
};

// Hàm createComment: Xác nhận sách tồn tại rồi tạo bình luận gắn với user đã xác thực.
/**
 * Hàm createComment: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookId, userId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, isArray, exists, create.
 */
export const createComment = async (bookId, userId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) throw new ApiError(401, 'Authentication is required');
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Comment data must be an object');
    }
    // if chỉ chạy nhánh này khi điều kiện !(await Book.exists({ _id: bookId, status: 'published' })) đúng.
    if (!(await Book.exists({ _id: bookId, status: 'published' }))) throw new ApiError(404, 'Book not found');
    // return kết thúc hàm và trả Comment.create({ body: data.body, rating: data.rating, book: bookId, user:  về nơi gọi.
    return Comment.create({
        // Trường body lưu data.body làm giá trị trong object.
        body: data.body,
        // Trường rating lưu data.rating làm giá trị trong object.
        rating: data.rating,
        // Trường book lưu bookId làm giá trị trong object.
        book: bookId,
        // Trường user lưu userId làm giá trị trong object.
        user: userId
    });
};

// Hàm updateComment: Chỉ cho chủ bình luận hoặc ADMIN cập nhật nội dung/đánh giá; trả 404 hoặc 403 phù hợp.
/**
 * Hàm updateComment: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: commentId, user, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, isArray, fromEntries, entries, filter, includes, keys, findOneAndUpdate.
 */
export const updateComment = async (commentId, user, data) => {
    // if chỉ chạy nhánh này khi điều kiện !user || !user._id đúng.
    if (!user || !user._id) throw new ApiError(401, 'Authentication is required');
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Comment update must be an object');
    }
    // Khai báo filter nhận giá trị từ { _id: commentId }. const giữ biến không gán lại; let cho phép cập nhật.
    const filter = { _id: commentId };
    // if chỉ chạy nhánh này khi điều kiện user.role !== ROLES.ADMIN đúng.
    if (user.role !== ROLES.ADMIN) filter.user = user._id;
    // Khai báo payload nhận giá trị từ Object.fromEntries(Object.entries(data) .filter(([field. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['body', 'rating'].includes(field)));
    // if chỉ chạy nhánh này khi điều kiện Object.keys(payload).length === 0 đúng.
    if (Object.keys(payload).length === 0) throw new ApiError(400, 'Comment update has no editable fields');
    // Khai báo comment nhận giá trị từ await Comment.findOneAndUpdate(filter, { $set: payload . const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await Comment.findOneAndUpdate(filter, { $set: payload }, {
        // Trường new lưu true làm giá trị trong object.
        new: true,
        // Trường runValidators lưu true làm giá trị trong object.
        runValidators: true
    });
    // if chỉ chạy nhánh này khi điều kiện !comment đúng.
    if (!comment) {
        // Khai báo exists nhận giá trị từ await Comment.exists({ _id: commentId }). const giữ biến không gán lại; let cho phép cập nhật.
        const exists = await Comment.exists({ _id: commentId });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(exists ? 403 : 404, exists
            ? 'You cannot edit this comment' : 'Comment not found');
    }
    // return kết thúc hàm và trả comment về nơi gọi.
    return comment;
};

// Hàm deleteComment: Chỉ chủ bình luận hoặc ADMIN có thể xóa bình luận, ngăn xóa chéo tài khoản.
/**
 * Hàm deleteComment: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: commentId, user.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, findOneAndDelete, exists.
 * Được tham chiếu tại: src/controllers/comment.controller.js.
 */
export const deleteComment = async (commentId, user) => {
    // if chỉ chạy nhánh này khi điều kiện !user || !user._id đúng.
    if (!user || !user._id) throw new ApiError(401, 'Authentication is required');
    // Khai báo filter nhận giá trị từ { _id: commentId }. const giữ biến không gán lại; let cho phép cập nhật.
    const filter = { _id: commentId };
    // if chỉ chạy nhánh này khi điều kiện user.role !== ROLES.ADMIN đúng.
    if (user.role !== ROLES.ADMIN) filter.user = user._id;
    // Khai báo comment nhận giá trị từ await Comment.findOneAndDelete(filter). const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await Comment.findOneAndDelete(filter);
    // if chỉ chạy nhánh này khi điều kiện !comment đúng.
    if (!comment) {
        // Khai báo exists nhận giá trị từ await Comment.exists({ _id: commentId }). const giữ biến không gán lại; let cho phép cập nhật.
        const exists = await Comment.exists({ _id: commentId });
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(exists ? 403 : 404, exists
            ? 'You cannot delete this comment' : 'Comment not found');
    }
    // return kết thúc hàm và trả comment về nơi gọi.
    return comment;
};


// Hàm getAllAdminComments: Trả toàn bộ bình luận hệ thống theo trang, mới nhất trước; dùng riêng cho màn kiểm duyệt ADMIN.
/**
 * Hàm getAllAdminComments: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, trim, slice, replace, all, find.
 */
export const getAllAdminComments = async (filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const query = {};
    // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
    if (typeof filters.search === 'string' && filters.search.trim()) {
        // Khai báo escaped nhận giá trị từ filters.search.trim().slice(0, 120).replace(/[.*+?^${}(. const giữ biến không gán lại; let cho phép cập nhật.
        const escaped = filters.search.trim().slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.body = { $regex: escaped, $options: 'i' }
        query.body = { $regex: escaped, $options: 'i' };
    }
    // Khai báo [comments, total] nhận giá trị từ await Promise.all([ Comment.find(query) .populate('user. const giữ biến không gán lại; let cho phép cập nhật.
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
    // return kết thúc hàm và trả { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / về nơi gọi.
    return { comments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};
