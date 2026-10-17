import ReadingProgress from '../models/reading-progress.model.js';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createReadingProgress: Tạo tiến độ đọc của user cho sách tồn tại và không nhận user ID từ payload.
export const createReadingProgress = async (userId, data) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Reading progress data must be an object');
    }
    if (!(await Book.exists({ _id: data.book }))) throw new ApiError(404, 'Book not found');
    const payload = {
        book: data.book,
        chapters_since_ad: data.chapters_since_ad,
        total_chapter_reads: data.total_chapter_reads,
        user: userId
    };
    return ReadingProgress.create(payload);
};

// Hàm getAllReadingProgress: Liệt kê tiến độ riêng của user, lọc sách tùy chọn, phân trang và populate thông tin sách.
export const getAllReadingProgress = async (userId, filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = { user: userId };
    if (filters.book) query.book = filters.book;
    const [progress, total] = await Promise.all([
        ReadingProgress.find(query).populate('book', 'title slug cover_url')
            .sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        ReadingProgress.countDocuments(query)
    ]);
    return { progress, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReadingProgressById: Tìm một tiến độ đọc thuộc đúng user và trả 404 nếu không tồn tại hoặc không thuộc quyền sở hữu.
export const getReadingProgressById = async (progressId, userId) => {
    const progress = await ReadingProgress.findOne({ _id: progressId, user: userId })
        .populate('book', 'title slug cover_url');
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    return progress;
};

// Hàm updateReadingProgress: Cập nhật bộ đếm hợp lệ trên tiến độ của user, không cho đổi user hoặc sách liên kết.
export const updateReadingProgress = async (progressId, userId, data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Reading progress update must be an object');
    }
    const progress = await ReadingProgress.findOne({ _id: progressId, user: userId });
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['chapters_since_ad', 'total_chapter_reads'].includes(field)));
    if (Object.keys(payload).length === 0) {
        throw new ApiError(400, 'Reading progress update has no editable fields');
    }
    Object.assign(progress, payload);
    await progress.save();
    return progress;
};

// Hàm deleteReadingProgress: Xóa tiến độ đọc thuộc đúng tài khoản hiện tại và trả 404 nếu không tìm thấy.
export const deleteReadingProgress = async (progressId, userId) => {
    const progress = await ReadingProgress.findOneAndDelete({ _id: progressId, user: userId });
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    return progress;
};
