import Bookmark from '../models/bookmarks.js';
import Book from '../models/book.model.js';
import Chapter from '../models/chapter.model.js';
import ApiError from '../utils/api-error.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createBookmark: Kiểm tra sách/chương tồn tại và tạo bookmark thuộc riêng tài khoản hiện tại.
export const createBookmark = async (userId, data) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Bookmark data must be an object');
    }
    if (!(await Book.exists({ _id: data.book }))) throw new ApiError(404, 'Book not found');
    if (!(await Chapter.exists({ _id: data.chapter, book_id: data.book }))) {
        throw new ApiError(404, 'Chapter not found in this book');
    }
    return Bookmark.create({ ...data, user: userId });
};

// Hàm getAllBookmarks: Chỉ liệt kê bookmark của user hiện tại, phân trang và populate sách/chương.
export const getAllBookmarks = async (userId, filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = { user: userId };
    if (filters.book) query.book = filters.book;
    const [bookmarks, total] = await Promise.all([
        Bookmark.find(query).populate('book', 'title slug cover_url')
            .populate('chapter', 'title slug chapter_number')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Bookmark.countDocuments(query)
    ]);
    return { bookmarks, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getBookmarkById: Tìm bookmark thuộc user hiện tại và populate thông tin sách/chương; trả 404 khi không có quyền hoặc không tồn tại.
export const getBookmarkById = async (bookmarkId, userId) => {
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: userId })
        .populate('book', 'title slug cover_url').populate('chapter', 'title slug chapter_number');
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    return bookmark;
};

// Hàm updateBookmark: Chỉ sửa bookmark do user hiện tại sở hữu và xác minh chương thuộc đúng sách.
export const updateBookmark = async (bookmarkId, userId, data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Bookmark update must be an object');
    }
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: userId });
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['book', 'chapter'].includes(field)));
    if (Object.keys(payload).length === 0) throw new ApiError(400, 'Bookmark update has no editable fields');
    if (payload.book && !(await Book.exists({ _id: payload.book }))) throw new ApiError(404, 'Book not found');
    const targetBook = payload.book || bookmark.book;
    if (payload.chapter && !(await Chapter.exists({ _id: payload.chapter, book_id: targetBook }))) {
        throw new ApiError(404, 'Chapter not found in this book');
    }
    Object.assign(bookmark, payload);
    await bookmark.save();
    return bookmark;
};

// Hàm deleteBookmark: Xóa bookmark chỉ khi nó thuộc tài khoản hiện tại; trả lỗi 404 cho bản ghi khác chủ.
export const deleteBookmark = async (bookmarkId, userId) => {
    const bookmark = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: userId });
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    return bookmark;
};
