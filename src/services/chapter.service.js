// Import Chapter từ ../models/chapter.model.js để dùng trong module.
/**
 * Tệp src/services/chapter.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Chapter from '../models/chapter.model.js';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { createUniqueSlug } từ ../utils/slugify.util.js để dùng trong module.
import { createUniqueSlug } from '../utils/slugify.util.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createChapter: Kiểm tra sách cha và dữ liệu tiêu đề, tạo slug riêng cho chương rồi lưu bản ghi mới.
/**
 * Hàm createChapter: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: chapterData.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, trim, exists, createUniqueSlug, create.
 */
export const createChapter = async (chapterData) => {
    // if chỉ chạy nhánh này khi điều kiện !chapterData || typeof chapterData !== 'object' || Array.isArray(chapterDat đúng.
    if (!chapterData || typeof chapterData !== 'object' || Array.isArray(chapterData)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Chapter data must be an object');
    }
    // if chỉ chạy nhánh này khi điều kiện typeof chapterData.title !== 'string' || !chapterData.title.trim() đúng.
    if (typeof chapterData.title !== 'string' || !chapterData.title.trim()) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Chapter title is required');
    }
    // if chỉ chạy nhánh này khi điều kiện !(await Book.exists({ _id: chapterData.book_id })) đúng.
    if (!(await Book.exists({ _id: chapterData.book_id }))) throw new ApiError(404, 'Book not found');
    // Khai báo payload nhận giá trị từ { book_id: chapterData.book_id, title: chapterData.titl. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = {
        // Trường book_id lưu chapterData.book_id làm giá trị trong object.
        book_id: chapterData.book_id,
        // Trường title lưu chapterData.title làm giá trị trong object.
        title: chapterData.title,
        // Trường content lưu chapterData.content làm giá trị trong object.
        content: chapterData.content,
        // Trường chapter_number lưu chapterData.chapter_number làm giá trị trong object.
        chapter_number: chapterData.chapter_number,
        // Trường access_level lưu chapterData.access_level làm giá trị trong object.
        access_level: chapterData.access_level,
        // Trường published_at lưu chapterData.published_at làm giá trị trong object.
        published_at: chapterData.published_at,
        // Trường slug lưu await createUniqueSlug(Chapter, chapterData.title) làm giá trị trong object.
        slug: await createUniqueSlug(Chapter, chapterData.title)
    };
    // return kết thúc hàm và trả Chapter.create(payload) về nơi gọi.
    return Chapter.create(payload);
};

// Hàm getAllChapters: Lọc theo sách/quyền truy cập, tìm tiêu đề không phân biệt hoa thường và phân trang có populate sách.
/**
 * Hàm getAllChapters: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, trim, replace, all, find, populate.
 */
export const getAllChapters = async (filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const query = {};
    // if chỉ chạy nhánh này khi điều kiện filters.book_id đúng.
    if (filters.book_id) query.book_id = filters.book_id;
    // if chỉ chạy nhánh này khi điều kiện filters.access_level đúng.
    if (filters.access_level) query.access_level = filters.access_level;
    // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
    if (typeof filters.search === 'string' && filters.search.trim()) {
        // Khai báo escaped nhận giá trị từ filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\. const giữ biến không gán lại; let cho phép cập nhật.
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.title = { $regex: escaped, $options: 'i' }
        query.title = { $regex: escaped, $options: 'i' };
    }
    // Khai báo [chapters, total] nhận giá trị từ await Promise.all([ Chapter.find(query).populate('book_. const giữ biến không gán lại; let cho phép cập nhật.
    const [chapters, total] = await Promise.all([
        Chapter.find(query).populate('book_id', 'title slug category cover_url')
            .sort({ book_id: 1, chapter_number: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        Chapter.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / về nơi gọi.
    return { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReadableChapters: Phân trang metadata chương theo sách và các cấp quyền đã được controller xác minh.
/**
 * Hàm getReadableChapters: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: bookId, accessLevels, filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, some, includes, ApiError, max, parseInt, min, all.
 */
export const getReadableChapters = async (bookId, accessLevels, filters = {}) => {
    // if chỉ chạy nhánh này khi điều kiện !Array.isArray(accessLevels) || accessLevels.length === 0 || accessLevels.s đúng.
    if (!Array.isArray(accessLevels) || accessLevels.length === 0
        || accessLevels.some((level) => !['free', 'premium', 'vip'].includes(level))) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'No readable chapter access levels are available');
    }
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ { book_id: bookId, access_level: { $in: accessLevels } . const giữ biến không gán lại; let cho phép cập nhật.
    const query = { book_id: bookId, access_level: { $in: accessLevels } };
    // Khai báo [chapters, total] nhận giá trị từ await Promise.all([ Chapter.find(query) .select('_id bo. const giữ biến không gán lại; let cho phép cập nhật.
    const [chapters, total] = await Promise.all([
        Chapter.find(query)
            .select('_id book_id title slug chapter_number access_level published_at createdAt updatedAt')
            .sort({ chapter_number: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Chapter.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / về nơi gọi.
    return { chapters, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getChapterById: Tìm chương theo ID hoặc slug và populate sách cha; trả 404 nếu không tìm thấy.
/**
 * Hàm getChapterById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: identifier.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: test, String, findOne, populate, ApiError.
 */
export const getChapterById = async (identifier) => {
    // Khai báo query nhận giá trị từ /^[\da-f]{24}$/i.test(String(identifier)) ? { _id: iden. const giữ biến không gán lại; let cho phép cập nhật.
    const query = /^[\da-f]{24}$/i.test(String(identifier))
        ? { _id: identifier } : { slug: identifier };
    // Khai báo chapter nhận giá trị từ await Chapter.findOne(query).populate('book_id', 'title. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await Chapter.findOne(query).populate('book_id', 'title slug category');
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    // return kết thúc hàm và trả chapter về nơi gọi.
    return chapter;
};

// Hàm updateChapter: Cập nhật trường hợp lệ trên chương tồn tại và tái tạo slug khi tiêu đề đổi.
/**
 * Hàm updateChapter: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: chapterId, updateData.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, findById, fromEntries, entries, filter, includes, createUniqueSlug.
 */
export const updateChapter = async (chapterId, updateData) => {
    // if chỉ chạy nhánh này khi điều kiện !updateData || typeof updateData !== 'object' || Array.isArray(updateData) đúng.
    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Chapter update must be an object');
    }
    // Khai báo chapter nhận giá trị từ await Chapter.findById(chapterId). const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await Chapter.findById(chapterId);
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    // Khai báo allowedFields nhận giá trị từ ['title', 'content', 'chapter_number', 'access_level', . const giữ biến không gán lại; let cho phép cập nhật.
    const allowedFields = ['title', 'content', 'chapter_number', 'access_level', 'published_at'];
    // Khai báo payload nhận giá trị từ Object.fromEntries(Object.entries(updateData) .filter((. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = Object.fromEntries(Object.entries(updateData)
        .filter(([field]) => allowedFields.includes(field)));
    // if chỉ chạy nhánh này khi điều kiện payload.title !== undefined đúng.
    if (payload.title !== undefined) payload.slug = await createUniqueSlug(Chapter, payload.title, chapter._id);
    // Gọi/thực thi Object.assign với các đối số để thực hiện thao tác: Object.assign(chapter, payload)
    Object.assign(chapter, payload);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await chapter.save()
    await chapter.save();
    // return kết thúc hàm và trả chapter về nơi gọi.
    return chapter;
};

// Hàm deleteChapter: Xóa chương theo ID và trả lỗi 404 nếu bản ghi không tồn tại.
/**
 * Hàm deleteChapter: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: chapterId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findByIdAndDelete, ApiError.
 */
export const deleteChapter = async (chapterId) => {
    // Khai báo chapter nhận giá trị từ await Chapter.findByIdAndDelete(chapterId). const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await Chapter.findByIdAndDelete(chapterId);
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    // return kết thúc hàm và trả chapter về nơi gọi.
    return chapter;
};
