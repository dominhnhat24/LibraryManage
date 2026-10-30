// Import * as bookmarkService từ ../services/bookmark.service.js để dùng trong module.
/**
 * Tệp src/controllers/bookmark.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import * as bookmarkService from '../services/bookmark.service.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { mapDtoList, toBookmarkDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toBookmarkDto } from '../utils/api-dto.js';

// Hàm createBookmark: Tạo bookmark cho tài khoản đã xác thực, lấy user ID từ token thay vì request body.
// Khai báo createBookmark nhận giá trị từ asyncHandler(async (req, res) => { const bookmark = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const createBookmark = asyncHandler(async (req, res) => {
    // Khai báo bookmark nhận giá trị từ await bookmarkService.createBookmark(req.authUser._id, . const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await bookmarkService.createBookmark(req.authUser._id, { ...req.body });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', data: toBookmarkDto(bookmark) }) về nơi gọi.
    return res.status(201).json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm getAllBookmarks: Trả bookmark của user hiện tại theo bộ lọc và trang được yêu cầu.
// Khai báo getAllBookmarks nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getAllBookmarks = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await bookmarkService.getAllBookmarks(req.authUser._id,. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await bookmarkService.getAllBookmarks(req.authUser._id, { ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.bookmarks, toBookmark về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.bookmarks, toBookmarkDto) làm giá trị trong object.
        data: mapDtoList(result.bookmarks, toBookmarkDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getBookmark: Trả một bookmark chỉ khi tài khoản hiện tại là chủ sở hữu.
// Khai báo getBookmark nhận giá trị từ asyncHandler(async (req, res) => { const bookmark = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const getBookmark = asyncHandler(async (req, res) => {
    // Khai báo bookmark nhận giá trị từ await bookmarkService.getBookmarkById(req.params.bookma. const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await bookmarkService.getBookmarkById(req.params.bookmarkId, req.authUser._id);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toBookmarkDto(bookmark) }) về nơi gọi.
    return res.json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm updateBookmark: Cập nhật bookmark thuộc user hiện tại bằng các trường qua Joi validation.
// Khai báo updateBookmark nhận giá trị từ asyncHandler(async (req, res) => { const bookmark = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const updateBookmark = asyncHandler(async (req, res) => {
    // Khai báo bookmark nhận giá trị từ await bookmarkService.updateBookmark( req.params.bookma. const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await bookmarkService.updateBookmark(
        req.params.bookmarkId, req.authUser._id, { ...req.body }
    );
    // return kết thúc hàm và trả res.json({ status: 'success', data: toBookmarkDto(bookmark) }) về nơi gọi.
    return res.json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm deleteBookmark: Xóa bookmark riêng của user hiện tại và phản hồi thành công.
// Khai báo deleteBookmark nhận giá trị từ asyncHandler(async (req, res) => { const bookmark = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteBookmark = asyncHandler(async (req, res) => {
    // Khai báo bookmark nhận giá trị từ await bookmarkService.deleteBookmark(req.params.bookmar. const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await bookmarkService.deleteBookmark(req.params.bookmarkId, req.authUser._id);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Bookmark deleted successfully', dat về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Bookmark deleted successfully' làm giá trị trong object.
        message: 'Bookmark deleted successfully',
        // Trường data lưu toBookmarkDto(bookmark) làm giá trị trong object.
        data: toBookmarkDto(bookmark)
    });
});
