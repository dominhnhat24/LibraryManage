import { createHash } from 'node:crypto';
import ReadingProgress from '../models/reading-progress.model.js';
import Book from '../models/book.model.js';
import ReadingEvent from '../models/reading-event.model.js';
import ApiError from '../utils/api-error.js';
import { PAGINATION } from '../constants/pagination.constant.js';
import { ADS_CHAPTER_INTERVAL } from '../middlewares/ads.middleware.js';

const OPEN_EVENT_BUCKET_MS = 10 * 60 * 1000;

export const recordReadingOpen = async (userId, bookId, chapterId = null, action = 'chapter_open', now = new Date()) => {
    if (!userId) return false;
    if (!['chapter_open', 'file_open'].includes(action)) throw new ApiError(400, 'Reading open event is invalid');
    const bucket = Math.floor(now.getTime() / OPEN_EVENT_BUCKET_MS);
    const eventId = createHash('sha256')
        .update(`${userId}:${bookId}:${chapterId || 'file'}:${action}:${bucket}`)
        .digest('hex').slice(0, 24);
    try {
        await ReadingProgress.updateOne({ user: userId, book: bookId }, {
            $setOnInsert: { user: userId, book: bookId }
        }, { upsert: true, setDefaultsOnInsert: true });
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
    const duplicate = await ReadingEvent.exists({
        user: userId,
        book: bookId,
        chapter: chapterId,
        action,
        createdAt: { $gte: new Date(now.getTime() - OPEN_EVENT_BUCKET_MS) }
    });
    if (duplicate) return true;
    try {
        await ReadingEvent.updateOne({ _id: eventId }, { $setOnInsert: {
            user: userId, book: bookId, chapter: chapterId, action,
            createdAt: now
        } }, { upsert: true, setDefaultsOnInsert: true });
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
    return true;
};

// Hàm createReadingProgress: Tạo tiến độ đọc của user cho sách tồn tại và không nhận user ID từ payload.
export const createReadingProgress = async (userId, data) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Reading progress data must be an object');
    }
    if (!(await Book.exists({ _id: data.book }))) throw new ApiError(404, 'Book not found');
    const payload = {
        book: data.book,
        chapters_since_ad: 0,
        total_chapter_reads: 0,
        user: userId
    };
    return ReadingProgress.create(payload);
};

// A chapter counts once only after the reader explicitly reports completion.
// The conditional Mongo update makes retries/reloads idempotent for legacy rows too.
export const completeChapter = async (userId, bookId, chapterId) => {
    if (!userId) throw new ApiError(401, 'Authentication is required');
    const filter = { user: userId, book: bookId, completed_chapter_ids: { $ne: chapterId } };
    const update = [{ $set: {
        user: { $ifNull: ['$user', userId] },
        book: { $ifNull: ['$book', bookId] },
        completed_chapter_ids: { $setUnion: [{ $ifNull: ['$completed_chapter_ids', []] }, [chapterId]] },
        completed_chapter_count: { $add: [{ $ifNull: ['$completed_chapter_count', 0] }, 1] },
        completed_chapters_since_ad: { $mod: [
            { $add: [{ $ifNull: ['$completed_chapters_since_ad', 0] }, 1] },
            ADS_CHAPTER_INTERVAL
        ] },
        updatedAt: new Date()
    } }];

    let progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
    let newlyCompleted = Boolean(progress);
    if (!progress) {
        progress = await ReadingProgress.findOne({ user: userId, book: bookId });
        if (!progress) {
            try {
                progress = await ReadingProgress.create({
                    user: userId,
                    book: bookId,
                    completed_chapter_ids: [chapterId],
                    completed_chapter_count: 1,
                    completed_chapters_since_ad: 1
                });
                newlyCompleted = true;
            } catch (error) {
                if (error.code !== 11000) throw error;
                progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
                newlyCompleted = Boolean(progress);
            }
        } else if (!(progress.completed_chapter_ids || []).some((id) => String(id) === String(chapterId))) {
            progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
            newlyCompleted = Boolean(progress);
        }
    }

    if (!progress) progress = await ReadingProgress.findOne({ user: userId, book: bookId });
    if (!progress) throw new ApiError(500, 'Could not save chapter completion');

    if (newlyCompleted) {
        void ReadingEvent.create({ user: userId, book: bookId, chapter: chapterId, action: 'chapter_complete' })
            .catch((error) => console.error('HarveyBook could not record chapter completion:', error?.message || error));
    }
    return {
        newly_completed: newlyCompleted,
        completed_chapter_count: progress.completed_chapter_count || 0,
        completed_chapters_since_ad: progress.completed_chapters_since_ad || 0,
        ad_eligibility_due: newlyCompleted && progress.completed_chapters_since_ad === 0
    };
};

// Hàm getAllReadingProgress: Liệt kê tiến độ riêng của user, lọc sách tùy chọn, phân trang và populate thông tin sách.
export const getAllReadingProgress = async (userId, filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = { user: userId };
    if (filters.book) query.book = filters.book;
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = await Book.find({
            $or: [
                { title: { $regex: escaped, $options: 'i' } },
                { author_name: { $regex: escaped, $options: 'i' } }
            ]
        }).distinct('_id');
        query.book = { $in: matches };
    }
    const [progress, total] = await Promise.all([
        ReadingProgress.find(query).populate('book', 'title author_name slug cover_url')
            .sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        ReadingProgress.countDocuments(query)
    ]);
    await Promise.all(progress.map(async (item) => {
        const lastEvent = await ReadingEvent.findOne({
            user: userId,
            book: item.book?._id || item.book,
            chapter: { $ne: null },
            action: { $in: ['chapter', 'chapter_open', 'chapter_complete'] }
        }).sort({ createdAt: -1 }).populate('chapter', '_id title slug chapter_number access_level').lean();
        if (lastEvent?.chapter) item.last_read_chapter = lastEvent.chapter;
    }));
    return { progress, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReadingProgressById: Tìm một tiến độ đọc thuộc đúng user và trả 404 nếu không tồn tại hoặc không thuộc quyền sở hữu.
export const getReadingProgressById = async (progressId, userId) => {
    const progress = await ReadingProgress.findOne({ _id: progressId, user: userId })
        .populate('book', 'title author_name slug cover_url');
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

// Hàm deleteAllReadingProgress: Xóa các bản ghi tiến độ đọc của riêng tài khoản hiện tại.
export const deleteAllReadingProgress = async (userId) => {
    const result = await ReadingProgress.deleteMany({ user: userId });
    return result.deletedCount || 0;
};
