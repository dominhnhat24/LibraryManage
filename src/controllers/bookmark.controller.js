import * as bookmarkService from '../services/bookmark.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { mapDtoList, toBookmarkDto } from '../utils/api-dto.js';

// Hàm createBookmark: Tạo bookmark cho tài khoản đã xác thực, lấy user ID từ token thay vì request body.
export const createBookmark = asyncHandler(async (req, res) => {
    const bookmark = await bookmarkService.createBookmark(req.authUser._id, { ...req.body });
    return res.status(201).json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm getAllBookmarks: Trả bookmark của user hiện tại theo bộ lọc và trang được yêu cầu.
export const getAllBookmarks = asyncHandler(async (req, res) => {
    const result = await bookmarkService.getAllBookmarks(req.authUser._id, { ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.bookmarks, toBookmarkDto),
        pagination: result.pagination
    });
});

// Hàm getBookmark: Trả một bookmark chỉ khi tài khoản hiện tại là chủ sở hữu.
export const getBookmark = asyncHandler(async (req, res) => {
    const bookmark = await bookmarkService.getBookmarkById(req.params.bookmarkId, req.authUser._id);
    return res.json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm updateBookmark: Cập nhật bookmark thuộc user hiện tại bằng các trường qua Joi validation.
export const updateBookmark = asyncHandler(async (req, res) => {
    const bookmark = await bookmarkService.updateBookmark(
        req.params.bookmarkId, req.authUser._id, { ...req.body }
    );
    return res.json({ status: 'success', data: toBookmarkDto(bookmark) });
});

// Hàm deleteBookmark: Xóa bookmark riêng của user hiện tại và phản hồi thành công.
export const deleteBookmark = asyncHandler(async (req, res) => {
    const bookmark = await bookmarkService.deleteBookmark(req.params.bookmarkId, req.authUser._id);
    return res.json({
        status: 'success',
        message: 'Bookmark deleted successfully',
        data: toBookmarkDto(bookmark)
    });
});
