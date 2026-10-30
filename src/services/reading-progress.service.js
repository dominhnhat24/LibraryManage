// Import { createHash } từ node:crypto để dùng trong module.
/**
 * Tệp src/services/reading-progress.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { createHash } from 'node:crypto';
// Import ReadingProgress từ ../models/reading-progress.model.js để dùng trong module.
import ReadingProgress from '../models/reading-progress.model.js';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import ReadingEvent từ ../models/reading-event.model.js để dùng trong module.
import ReadingEvent from '../models/reading-event.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';
// Import { ADS_CHAPTER_INTERVAL } từ ../middlewares/ads.middleware.js để dùng trong module.
import { ADS_CHAPTER_INTERVAL } from '../middlewares/ads.middleware.js';

// Khai báo OPEN_EVENT_BUCKET_MS nhận giá trị từ 10 * 60 * 1000. const giữ biến không gán lại; let cho phép cập nhật.
const OPEN_EVENT_BUCKET_MS = 10 * 60 * 1000;

/**
 * Hàm recordReadingOpen: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, bookId, chapterId mặc định null, action mặc định 'chapter_open', now mặc định new Date().
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: includes, ApiError, floor, getTime, createHash, update, digest, slice.
 */
export const recordReadingOpen = async (userId, bookId, chapterId = null, action = 'chapter_open', now = new Date()) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) return false;
    // if chỉ chạy nhánh này khi điều kiện !['chapter_open', 'file_open'].includes(action) đúng.
    if (!['chapter_open', 'file_open'].includes(action)) throw new ApiError(400, 'Reading open event is invalid');
    // Khai báo bucket nhận giá trị từ Math.floor(now.getTime() / OPEN_EVENT_BUCKET_MS). const giữ biến không gán lại; let cho phép cập nhật.
    const bucket = Math.floor(now.getTime() / OPEN_EVENT_BUCKET_MS);
    // Khai báo eventId nhận giá trị từ createHash('sha256') .update(`${userId}:${bookId}:${cha. const giữ biến không gán lại; let cho phép cập nhật.
    const eventId = createHash('sha256')
        .update(`${userId}:${bookId}:${chapterId || 'file'}:${action}:${bucket}`)
        .digest('hex').slice(0, 24);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await ReadingProgress.updateOne({ user: userId, book: bookId }, { $setOnIns
        await ReadingProgress.updateOne({ user: userId, book: bookId }, {
            // Trường $setOnInsert lưu { user: userId, book: bookId } làm giá trị trong object.
            $setOnInsert: { user: userId, book: bookId }
        }, { upsert: true, setDefaultsOnInsert: true });
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.code !== 11000 đúng.
        if (error.code !== 11000) throw error;
    }
    // Khai báo duplicate nhận giá trị từ await ReadingEvent.exists({ user: userId, book: bookId,. const giữ biến không gán lại; let cho phép cập nhật.
    const duplicate = await ReadingEvent.exists({
        // Trường user lưu userId làm giá trị trong object.
        user: userId,
        // Trường book lưu bookId làm giá trị trong object.
        book: bookId,
        // Trường chapter lưu chapterId làm giá trị trong object.
        chapter: chapterId,
        // Khóa action nhận biến cùng tên làm giá trị.
        action,
        // Trường createdAt lưu { $gte: new Date(now.getTime() - OPEN_EVENT_BUCKET_MS)  làm giá trị trong object.
        createdAt: { $gte: new Date(now.getTime() - OPEN_EVENT_BUCKET_MS) }
    });
    // if chỉ chạy nhánh này khi điều kiện duplicate đúng.
    if (duplicate) return true;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await ReadingEvent.updateOne({ _id: eventId }, { $setOnInsert: { user: user
        await ReadingEvent.updateOne({ _id: eventId }, { $setOnInsert: {
            // Trường user lưu userId làm giá trị trong object.
            user: userId, book: bookId, chapter: chapterId, action,
            // Trường createdAt lưu now làm giá trị trong object.
            createdAt: now
        } }, { upsert: true, setDefaultsOnInsert: true });
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.code !== 11000 đúng.
        if (error.code !== 11000) throw error;
    }
    // return kết thúc hàm và trả true về nơi gọi.
    return true;
};

// Hàm createReadingProgress: Tạo tiến độ đọc của user cho sách tồn tại và không nhận user ID từ payload.
/**
 * Hàm createReadingProgress: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, isArray, exists, create.
 */
export const createReadingProgress = async (userId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) throw new ApiError(401, 'Authentication is required');
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Reading progress data must be an object');
    }
    // if chỉ chạy nhánh này khi điều kiện !(await Book.exists({ _id: data.book })) đúng.
    if (!(await Book.exists({ _id: data.book }))) throw new ApiError(404, 'Book not found');
    // Khai báo payload nhận giá trị từ { book: data.book, chapters_since_ad: 0, total_chapter_. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = {
        // Trường book lưu data.book làm giá trị trong object.
        book: data.book,
        // Trường chapters_since_ad lưu 0 làm giá trị trong object.
        chapters_since_ad: 0,
        // Trường total_chapter_reads lưu 0 làm giá trị trong object.
        total_chapter_reads: 0,
        // Trường user lưu userId làm giá trị trong object.
        user: userId
    };
    // return kết thúc hàm và trả ReadingProgress.create(payload) về nơi gọi.
    return ReadingProgress.create(payload);
};

// A chapter counts once only after the reader explicitly reports completion.
// The conditional Mongo update makes retries/reloads idempotent for legacy rows too.
/**
 * Hàm completeChapter: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, bookId, chapterId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, Date, findOneAndUpdate, Boolean, findOne, create, some, String.
 */
export const completeChapter = async (userId, bookId, chapterId) => {
    // if chỉ chạy nhánh này khi điều kiện !userId đúng.
    if (!userId) throw new ApiError(401, 'Authentication is required');
    // Khai báo filter nhận giá trị từ { user: userId, book: bookId, completed_chapter_ids: { . const giữ biến không gán lại; let cho phép cập nhật.
    const filter = { user: userId, book: bookId, completed_chapter_ids: { $ne: chapterId } };
    // Khai báo update nhận giá trị từ [{ $set: { user: { $ifNull: ['$user', userId] }, book: . const giữ biến không gán lại; let cho phép cập nhật.
    const update = [{ $set: {
        // Trường user lưu { $ifNull: ['$user', userId] } làm giá trị trong object.
        user: { $ifNull: ['$user', userId] },
        // Trường book lưu { $ifNull: ['$book', bookId] } làm giá trị trong object.
        book: { $ifNull: ['$book', bookId] },
        // Trường completed_chapter_ids lưu { $setUnion: [{ $ifNull: ['$completed_chapter_ids', []] làm giá trị trong object.
        completed_chapter_ids: { $setUnion: [{ $ifNull: ['$completed_chapter_ids', []] }, [chapterId]] },
        // Trường completed_chapter_count lưu { $add: [{ $ifNull: ['$completed_chapter_count', 0] },  làm giá trị trong object.
        completed_chapter_count: { $add: [{ $ifNull: ['$completed_chapter_count', 0] }, 1] },
        // Trường completed_chapters_since_ad lưu { $mod: [ { $add: [{ $ifNull: ['$completed_chapters_sin làm giá trị trong object.
        completed_chapters_since_ad: { $mod: [
            { $add: [{ $ifNull: ['$completed_chapters_since_ad', 0] }, 1] },
            ADS_CHAPTER_INTERVAL
        ] },
        // Trường updatedAt lưu new Date() làm giá trị trong object.
        updatedAt: new Date()
    } }];

    // Khai báo progress nhận giá trị từ await ReadingProgress.findOneAndUpdate(filter, update, . const giữ biến không gán lại; let cho phép cập nhật.
    let progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
    // Khai báo newlyCompleted nhận giá trị từ Boolean(progress). const giữ biến không gán lại; let cho phép cập nhật.
    let newlyCompleted = Boolean(progress);
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: progress = await ReadingProgress.findOne({ user: userId, book: bookId })
        progress = await ReadingProgress.findOne({ user: userId, book: bookId });
        // if chỉ chạy nhánh này khi điều kiện !progress đúng.
        if (!progress) {
            // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
            try {
                // await chờ tác vụ bất đồng bộ xong trước bước sau: progress = await ReadingProgress.create({ user: userId, book: bookId, compl
                progress = await ReadingProgress.create({
                    // Trường user lưu userId làm giá trị trong object.
                    user: userId,
                    // Trường book lưu bookId làm giá trị trong object.
                    book: bookId,
                    // Trường completed_chapter_ids lưu [chapterId] làm giá trị trong object.
                    completed_chapter_ids: [chapterId],
                    // Trường completed_chapter_count lưu 1 làm giá trị trong object.
                    completed_chapter_count: 1,
                    // Trường completed_chapters_since_ad lưu 1 làm giá trị trong object.
                    completed_chapters_since_ad: 1
                });
                // Gọi/thực thi biểu thức để thực hiện thao tác: newlyCompleted = true
                newlyCompleted = true;
            } catch (error) {
                // if chỉ chạy nhánh này khi điều kiện error.code !== 11000 đúng.
                if (error.code !== 11000) throw error;
                // await chờ tác vụ bất đồng bộ xong trước bước sau: progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: tr
                progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
                // Gọi/thực thi Boolean với các đối số để thực hiện thao tác: newlyCompleted = Boolean(progress)
                newlyCompleted = Boolean(progress);
            }
        } else if (!(progress.completed_chapter_ids || []).some((id) => String(id) === String(chapterId))) {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: tr
            progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
            // Gọi/thực thi Boolean với các đối số để thực hiện thao tác: newlyCompleted = Boolean(progress)
            newlyCompleted = Boolean(progress);
        }
    }

    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) progress = await ReadingProgress.findOne({ user: userId, book: bookId });
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) throw new ApiError(500, 'Could not save chapter completion');

    // if chỉ chạy nhánh này khi điều kiện newlyCompleted đúng.
    if (newlyCompleted) {
        // Gọi/thực thi ReadingEvent.create với các đối số để thực hiện thao tác: void ReadingEvent.create({ user: userId, book: bookId, chapter: chapterId,
        void ReadingEvent.create({ user: userId, book: bookId, chapter: chapterId, action: 'chapter_complete' })
            .catch((error) => console.error('HarveyBook could not record chapter completion:', error?.message || error));
    }
    // return kết thúc hàm và trả { newly_completed: newlyCompleted, completed_chapter_count: progress.comple về nơi gọi.
    return {
        // Trường newly_completed lưu newlyCompleted làm giá trị trong object.
        newly_completed: newlyCompleted,
        // Trường completed_chapter_count lưu progress.completed_chapter_count || 0 làm giá trị trong object.
        completed_chapter_count: progress.completed_chapter_count || 0,
        // Trường completed_chapters_since_ad lưu progress.completed_chapters_since_ad || 0 làm giá trị trong object.
        completed_chapters_since_ad: progress.completed_chapters_since_ad || 0,
        // Trường ad_eligibility_due lưu newlyCompleted && progress.completed_chapters_since_ad  làm giá trị trong object.
        ad_eligibility_due: newlyCompleted && progress.completed_chapters_since_ad === 0
    };
};

// Hàm getAllReadingProgress: Liệt kê tiến độ riêng của user, lọc sách tùy chọn, phân trang và populate thông tin sách.
/**
 * Hàm getAllReadingProgress: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId, filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, trim, replace, find, distinct, all.
 */
export const getAllReadingProgress = async (userId, filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ { user: userId }. const giữ biến không gán lại; let cho phép cập nhật.
    const query = { user: userId };
    // if chỉ chạy nhánh này khi điều kiện filters.book đúng.
    if (filters.book) query.book = filters.book;
    // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
    if (typeof filters.search === 'string' && filters.search.trim()) {
        // Khai báo escaped nhận giá trị từ filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\. const giữ biến không gán lại; let cho phép cập nhật.
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Khai báo matches nhận giá trị từ await Book.find({ $or: [ { title: { $regex: escaped, $o. const giữ biến không gán lại; let cho phép cập nhật.
        const matches = await Book.find({
            // Trường $or lưu [ { title: { $regex: escaped, $options: 'i' } }, { auth làm giá trị trong object.
            $or: [
                { title: { $regex: escaped, $options: 'i' } },
                { author_name: { $regex: escaped, $options: 'i' } }
            ]
        }).distinct('_id');
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.book = { $in: matches }
        query.book = { $in: matches };
    }
    // Khai báo [progress, total] nhận giá trị từ await Promise.all([ ReadingProgress.find(query).populat. const giữ biến không gán lại; let cho phép cập nhật.
    const [progress, total] = await Promise.all([
        ReadingProgress.find(query).populate('book', 'title author_name slug cover_url')
            .sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        ReadingProgress.countDocuments(query)
    ]);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Promise.all(progress.map(async (item) => { const lastEvent = await Re
    await Promise.all(progress.map(async (item) => {
        // Khai báo lastEvent nhận giá trị từ await ReadingEvent.findOne({ user: userId, book: item.b. const giữ biến không gán lại; let cho phép cập nhật.
        const lastEvent = await ReadingEvent.findOne({
            // Trường user lưu userId làm giá trị trong object.
            user: userId,
            // Trường book lưu item.book?._id || item.book làm giá trị trong object.
            book: item.book?._id || item.book,
            // Trường chapter lưu { $ne: null } làm giá trị trong object.
            chapter: { $ne: null },
            // Trường action lưu { $in: ['chapter', 'chapter_open', 'chapter_complete']  làm giá trị trong object.
            action: { $in: ['chapter', 'chapter_open', 'chapter_complete'] }
        }).sort({ createdAt: -1 }).populate('chapter', '_id title slug chapter_number access_level').lean();
        // if chỉ chạy nhánh này khi điều kiện lastEvent?.chapter đúng.
        if (lastEvent?.chapter) item.last_read_chapter = lastEvent.chapter;
    }));
    // return kết thúc hàm và trả { progress, pagination: { total, page, limit, totalPages: Math.ceil(total / về nơi gọi.
    return { progress, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReadingProgressById: Tìm một tiến độ đọc thuộc đúng user và trả 404 nếu không tồn tại hoặc không thuộc quyền sở hữu.
/**
 * Hàm getReadingProgressById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: progressId, userId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOne, populate, ApiError.
 */
export const getReadingProgressById = async (progressId, userId) => {
    // Khai báo progress nhận giá trị từ await ReadingProgress.findOne({ _id: progressId, user: . const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await ReadingProgress.findOne({ _id: progressId, user: userId })
        .populate('book', 'title author_name slug cover_url');
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    // return kết thúc hàm và trả progress về nơi gọi.
    return progress;
};

// Hàm updateReadingProgress: Cập nhật bộ đếm hợp lệ trên tiến độ của user, không cho đổi user hoặc sách liên kết.
/**
 * Hàm updateReadingProgress: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: progressId, userId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, findOne, fromEntries, entries, filter, includes, keys.
 */
export const updateReadingProgress = async (progressId, userId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Reading progress update must be an object');
    }
    // Khai báo progress nhận giá trị từ await ReadingProgress.findOne({ _id: progressId, user: . const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await ReadingProgress.findOne({ _id: progressId, user: userId });
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    // Khai báo payload nhận giá trị từ Object.fromEntries(Object.entries(data) .filter(([field. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = Object.fromEntries(Object.entries(data)
        .filter(([field]) => ['chapters_since_ad', 'total_chapter_reads'].includes(field)));
    // if chỉ chạy nhánh này khi điều kiện Object.keys(payload).length === 0 đúng.
    if (Object.keys(payload).length === 0) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Reading progress update has no editable fields');
    }
    // Gọi/thực thi Object.assign với các đối số để thực hiện thao tác: Object.assign(progress, payload)
    Object.assign(progress, payload);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await progress.save()
    await progress.save();
    // return kết thúc hàm và trả progress về nơi gọi.
    return progress;
};

// Hàm deleteReadingProgress: Xóa tiến độ đọc thuộc đúng tài khoản hiện tại và trả 404 nếu không tìm thấy.
/**
 * Hàm deleteReadingProgress: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: progressId, userId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOneAndDelete, ApiError.
 */
export const deleteReadingProgress = async (progressId, userId) => {
    // Khai báo progress nhận giá trị từ await ReadingProgress.findOneAndDelete({ _id: progressI. const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await ReadingProgress.findOneAndDelete({ _id: progressId, user: userId });
    // if chỉ chạy nhánh này khi điều kiện !progress đúng.
    if (!progress) throw new ApiError(404, 'Reading progress not found');
    // return kết thúc hàm và trả progress về nơi gọi.
    return progress;
};

// Hàm deleteAllReadingProgress: Xóa các bản ghi tiến độ đọc của riêng tài khoản hiện tại.
/**
 * Hàm deleteAllReadingProgress: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: userId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: deleteMany.
 */
export const deleteAllReadingProgress = async (userId) => {
    // Khai báo result nhận giá trị từ await ReadingProgress.deleteMany({ user: userId }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await ReadingProgress.deleteMany({ user: userId });
    // return kết thúc hàm và trả result.deletedCount || 0 về nơi gọi.
    return result.deletedCount || 0;
};
