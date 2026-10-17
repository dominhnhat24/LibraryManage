import Chapter from '../models/chapter.model.js';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { createUniqueSlug } from '../utils/slugify.util.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createChapter: Kiểm tra sách cha và dữ liệu tiêu đề, tạo slug riêng cho chương rồi lưu bản ghi mới.
export const createChapter = async (chapterData) => {
    if (!chapterData || typeof chapterData !== 'object' || Array.isArray(chapterData)) {
        throw new ApiError(400, 'Chapter data must be an object');
    }
    if (typeof chapterData.title !== 'string' || !chapterData.title.trim()) {
        throw new ApiError(400, 'Chapter title is required');
    }
    if (!(await Book.exists({ _id: chapterData.book_id }))) throw new ApiError(404, 'Book not found');
    const payload = {
        book_id: chapterData.book_id,
        title: chapterData.title,
        content: chapterData.content,
        chapter_number: chapterData.chapter_number,
        access_level: chapterData.access_level,
        published_at: chapterData.published_at,
        slug: await createUniqueSlug(Chapter, chapterData.title)
    };
    return Chapter.create(payload);
};

// Hàm getAllChapters: Lọc theo sách/quyền truy cập, tìm tiêu đề không phân biệt hoa thường và phân trang có populate sách.
export const getAllChapters = async (filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = {};
    if (filters.book_id) query.book_id = filters.book_id;
    if (filters.access_level) query.access_level = filters.access_level;
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.title = { $regex: escaped, $options: 'i' };
    }
    const [chapters, total] = await Promise.all([
        Chapter.find(query).populate('book_id', 'title slug category cover_url')
            .sort({ book_id: 1, chapter_number: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        Chapter.countDocuments(query)
    ]);
    return { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReadableChapters: Phân trang metadata chương theo sách và các cấp quyền đã được controller xác minh.
export const getReadableChapters = async (bookId, accessLevels, filters = {}) => {
    if (!Array.isArray(accessLevels) || accessLevels.length === 0
        || accessLevels.some((level) => !['free', 'premium', 'vip'].includes(level))) {
        throw new ApiError(403, 'No readable chapter access levels are available');
    }
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = { book_id: bookId, access_level: { $in: accessLevels } };
    const [chapters, total] = await Promise.all([
        Chapter.find(query)
            .select('_id book_id title slug chapter_number access_level published_at createdAt updatedAt')
            .sort({ chapter_number: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Chapter.countDocuments(query)
    ]);
    return { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getChapterById: Tìm chương theo ID hoặc slug và populate sách cha; trả 404 nếu không tìm thấy.
export const getChapterById = async (identifier) => {
    const query = /^[\da-f]{24}$/i.test(String(identifier))
        ? { _id: identifier } : { slug: identifier };
    const chapter = await Chapter.findOne(query).populate('book_id', 'title slug category');
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    return chapter;
};

// Hàm updateChapter: Cập nhật trường hợp lệ trên chương tồn tại và tái tạo slug khi tiêu đề đổi.
export const updateChapter = async (chapterId, updateData) => {
    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
        throw new ApiError(400, 'Chapter update must be an object');
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    const allowedFields = ['title', 'content', 'chapter_number', 'access_level', 'published_at'];
    const payload = Object.fromEntries(Object.entries(updateData)
        .filter(([field]) => allowedFields.includes(field)));
    if (payload.title !== undefined) payload.slug = await createUniqueSlug(Chapter, payload.title, chapter._id);
    Object.assign(chapter, payload);
    await chapter.save();
    return chapter;
};

// Hàm deleteChapter: Xóa chương theo ID và trả lỗi 404 nếu bản ghi không tồn tại.
export const deleteChapter = async (chapterId) => {
    const chapter = await Chapter.findByIdAndDelete(chapterId);
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    return chapter;
};
