// [CONTROLLER BÌNH LUẬN] Đọc, tạo, cập nhật và xóa bình luận/đánh giá theo quyền sở hữu.
// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/controllers/interaction.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import * as commentService từ ../services/comment.service.js để dùng trong module.
import * as commentService from '../services/comment.service.js';
// Import { mapDtoList, toCommentDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toCommentDto } from '../utils/api-dto.js';

// [KIỂM DUYỆT ADMIN] Danh sách bình luận toàn hệ thống có tìm kiếm và phân trang.
// Khai báo listAdminComments nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const listAdminComments = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await commentService.getAllAdminComments({ ...req.query. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await commentService.getAllAdminComments({ ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.comments, toCommentDt về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.comments, toCommentDto) làm giá trị trong object.
        data: mapDtoList(result.comments, toCommentDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// [LIỆT KÊ BÌNH LUẬN] Trả bình luận mới nhất trước, không kèm thông tin nhạy cảm của người dùng.
// Khai báo listComments nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const listComments = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await commentService.getAllComments(req.params.bookId, . const giữ biến không gán lại; let cho phép cập nhật.
    const result = await commentService.getAllComments(req.params.bookId, { ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.comments, toCommentDt về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.comments, toCommentDto) làm giá trị trong object.
        data: mapDtoList(result.comments, toCommentDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getComment: Lấy một bình luận theo ID và trả DTO đã populate dữ liệu người viết/sách.
// Khai báo getComment nhận giá trị từ asyncHandler(async (req, res) => { const comment = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const getComment = asyncHandler(async (req, res) => {
    // Khai báo comment nhận giá trị từ await commentService.getCommentById(req.params.commentI. const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await commentService.getCommentById(req.params.commentId);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toCommentDto(comment) }) về nơi gọi.
    return res.json({ status: 'success', data: toCommentDto(comment) });
});

// [TẠO BÌNH LUẬN] Cho phép mỗi người dùng một bình luận/đánh giá trên mỗi sách.
// Khai báo createComment nhận giá trị từ asyncHandler(async (req, res) => { const body = String(. const giữ biến không gán lại; let cho phép cập nhật.
export const createComment = asyncHandler(async (req, res) => {
    // Khai báo body nhận giá trị từ String(req.body.body || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const body = String(req.body.body || '').trim();
    // Khai báo rating nhận giá trị từ req.body.rating === undefined || req.body.rating === nu. const giữ biến không gán lại; let cho phép cập nhật.
    const rating = req.body.rating === undefined || req.body.rating === null
        ? null : Number(req.body.rating);
    // Khai báo violations nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const violations = [];
    // if chỉ chạy nhánh này khi điều kiện !body || body.length > 3000 đúng.
    if (!body || body.length > 3000) violations.push({ field: 'body', message: 'Comment is required and must be at most 3000 characters' });
    // if chỉ chạy nhánh này khi điều kiện rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5) đúng.
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        // Gọi/thực thi violations.push với các đối số để thực hiện thao tác: violations.push({ field: 'rating', message: 'Rating must be an integer from
        violations.push({ field: 'rating', message: 'Rating must be an integer from 1 to 5' });
    }
    // if chỉ chạy nhánh này khi điều kiện violations.length đúng.
    if (violations.length) throw new ApiError(400, 'Request validation failed', violations);
    // Khai báo comment nhận giá trị từ await commentService.createComment(req.params.bookId, r. const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await commentService.createComment(req.params.bookId, req.authUser._id, { body, rating });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', data: toCommentDto(comment) }) về nơi gọi.
    return res.status(201).json({ status: 'success', data: toCommentDto(comment) });
});

// [SỬA BÌNH LUẬN] Chỉ chủ sở hữu hoặc admin được sửa nội dung và điểm đánh giá.
// Khai báo updateComment nhận giá trị từ asyncHandler(async (req, res) => { const update = {}; i. const giữ biến không gán lại; let cho phép cập nhật.
export const updateComment = asyncHandler(async (req, res) => {
    // Khai báo update nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const update = {};
    // if chỉ chạy nhánh này khi điều kiện req.body.body !== undefined đúng.
    if (req.body.body !== undefined) {
        // Khai báo body nhận giá trị từ String(req.body.body).trim(). const giữ biến không gán lại; let cho phép cập nhật.
        const body = String(req.body.body).trim();
        // if chỉ chạy nhánh này khi điều kiện !body || body.length > 3000 đúng.
        if (!body || body.length > 3000) throw new ApiError(400, 'Comment is invalid');
        // Gọi/thực thi biểu thức để thực hiện thao tác: update.body = body
        update.body = body;
    }
    // if chỉ chạy nhánh này khi điều kiện req.body.rating !== undefined đúng.
    if (req.body.rating !== undefined) {
        // Khai báo rating nhận giá trị từ req.body.rating === null ? null : Number(req.body.ratin. const giữ biến không gán lại; let cho phép cập nhật.
        const rating = req.body.rating === null ? null : Number(req.body.rating);
        // if chỉ chạy nhánh này khi điều kiện rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5) đúng.
        if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Rating must be an integer from 1 to 5');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: update.rating = rating
        update.rating = rating;
    }
    // Khai báo comment nhận giá trị từ await commentService.updateComment(req.params.commentId. const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await commentService.updateComment(req.params.commentId, req.authUser, update);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toCommentDto(comment) }) về nơi gọi.
    return res.json({ status: 'success', data: toCommentDto(comment) });
});

// [XÓA BÌNH LUẬN] Người viết hoặc admin có thể gỡ bình luận khỏi sách.
// Khai báo deleteComment nhận giá trị từ asyncHandler(async (req, res) => { const comment = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteComment = asyncHandler(async (req, res) => {
    // Khai báo comment nhận giá trị từ await commentService.deleteComment(req.params.commentId. const giữ biến không gán lại; let cho phép cập nhật.
    const comment = await commentService.deleteComment(req.params.commentId, req.authUser);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Comment deleted successfully', data về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Comment deleted successfully' làm giá trị trong object.
        message: 'Comment deleted successfully',
        // Trường data lưu toCommentDto(comment) làm giá trị trong object.
        data: toCommentDto(comment)
    });
});
