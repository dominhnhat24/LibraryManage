// Import Bookmark từ ../models/bookmarks.js để dùng trong module.
/**
 * Tệp src/services/bookmark.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Bookmark from '../models/bookmarks.js';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import Chapter từ ../models/chapter.model.js để dùng trong module.
import Chapter from '../models/chapter.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createBookmark: Kiểm tra sách/chương tồn tại và tạo bookmark thuộc riêng tài khoản hiện tại.
/**
 * Hàm createBookmark: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, isArray, exists, create.
 */
export const createBookmark = async (userId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) throw new ApiError(401, 'Authentication is required');
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Bookmark data must be an object');
    }
    // if chỉ chạy nhánh này khi điều kiện !(await Book.exists({ _id: data.book })) đúng.
    if (!(await Book.exists({ _id: data.book }))) throw new ApiError(404, 'Book not found');
    // if chỉ chạy nhánh này khi điều kiện !(await Chapter.exists({ _id: data.chapter, book_id: data.book })) đúng.
    if (!(await Chapter.exists({ _id: data.chapter, book_id: data.book }))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Chapter not found in this book');
    }
    // return kết thúc hàm và trả Bookmark.create({ ...data, user: userId }) về nơi gọi.
    return Bookmark.create({ ...data, user: userId });
};

// Hàm getAllBookmarks: Chỉ liệt kê bookmark của user hiện tại, phân trang và populate sách/chương.
/**
 * Hàm getAllBookmarks: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, all, find, populate, sort, skip.
 */
export const getAllBookmarks = async (userId, filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ { user: userId }. const giữ biến không gán lại; let cho phép cập nhật.
    const query = { user: userId };
    // if chỉ chạy nhánh này khi điều kiện filters.book đúng.
    if (filters.book) query.book = filters.book;
    // Khai báo [bookmarks, total] nhận giá trị từ await Promise.all([ Bookmark.find(query).populate('book. const giữ biến không gán lại; let cho phép cập nhật.
    const [bookmarks, total] = await Promise.all([
        Bookmark.find(query).populate('book', 'title slug cover_url')
            .populate('chapter', 'title slug chapter_number')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Bookmark.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { bookmarks, pagination: { total, page, limit, totalPages: Math.ceil(total  về nơi gọi.
    return { bookmarks, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getBookmarkById: Tìm bookmark thuộc user hiện tại và populate thông tin sách/chương; trả 404 khi không có quyền hoặc không tồn tại.
/**
 * Hàm getBookmarkById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookmarkId, userId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOne, populate, ApiError.
 */
export const getBookmarkById = async (bookmarkId, userId) => {
    // Khai báo bookmark nhận giá trị từ await Bookmark.findOne({ _id: bookmarkId, user: userId . const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: userId })
        .populate('book', 'title slug cover_url').populate('chapter', 'title slug chapter_number');
    // if chỉ chạy nhánh này khi điều kiện !bookmark đúng.
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    // return kết thúc hàm và trả bookmark về nơi gọi.
    return bookmark;
};

// Hàm updateBookmark: Chỉ sửa bookmark do user hiện tại sở hữu và xác minh chương thuộc đúng sách.
/**
 * Hàm updateBookmark: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookmarkId, userId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, findOne, fromEntries, entries, filter, includes, keys.
 */
export const updateBookmark = async (bookmarkId, userId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Bookmark update must be an object');
    }
    // Khai báo bookmark nhận giá trị từ await Bookmark.findOne({ _id: bookmarkId, user: userId . const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: userId });
    // if chỉ chạy nhánh này khi điều kiện !bookmark đúng.
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    // Khai báo payload nhận giá trị từ Object.fromEntries(Object.entries(data) .filter(([field. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['book', 'chapter'].includes(field)));
    // if chỉ chạy nhánh này khi điều kiện Object.keys(payload).length === 0 đúng.
    if (Object.keys(payload).length === 0) throw new ApiError(400, 'Bookmark update has no editable fields');
    // if chỉ chạy nhánh này khi điều kiện payload.book && !(await Book.exists({ _id: payload.book })) đúng.
    if (payload.book && !(await Book.exists({ _id: payload.book }))) throw new ApiError(404, 'Book not found');
    // Khai báo targetBook nhận giá trị từ payload.book || bookmark.book. const giữ biến không gán lại; let cho phép cập nhật.
    const targetBook = payload.book || bookmark.book;
    // if chỉ chạy nhánh này khi điều kiện payload.chapter && !(await Chapter.exists({ _id: payload.chapter, book_id:  đúng.
    if (payload.chapter && !(await Chapter.exists({ _id: payload.chapter, book_id: targetBook }))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Chapter not found in this book');
    }
    // Gọi/thực thi Object.assign với các đối số để thực hiện thao tác: Object.assign(bookmark, payload)
    Object.assign(bookmark, payload);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await bookmark.save()
    await bookmark.save();
    // return kết thúc hàm và trả bookmark về nơi gọi.
    return bookmark;
};

// Hàm deleteBookmark: Xóa bookmark chỉ khi nó thuộc tài khoản hiện tại; trả lỗi 404 cho bản ghi khác chủ.
/**
 * Hàm deleteBookmark: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookmarkId, userId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOneAndDelete, ApiError.
 */
export const deleteBookmark = async (bookmarkId, userId) => {
    // Khai báo bookmark nhận giá trị từ await Bookmark.findOneAndDelete({ _id: bookmarkId, user. const giữ biến không gán lại; let cho phép cập nhật.
    const bookmark = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: userId });
    // if chỉ chạy nhánh này khi điều kiện !bookmark đúng.
    if (!bookmark) throw new ApiError(404, 'Bookmark not found');
    // return kết thúc hàm và trả bookmark về nơi gọi.
    return bookmark;
};
