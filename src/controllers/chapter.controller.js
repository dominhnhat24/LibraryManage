// Import * as chapterService từ ../services/chapter.service.js để dùng trong module.
/**
 * Tệp src/controllers/chapter.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import * as chapterService from '../services/chapter.service.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { mapDtoList, toChapterDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toChapterDto } from '../utils/api-dto.js';
// Import * as readingProgressService từ ../services/reading-progress.service.js để dùng trong module.
import * as readingProgressService from '../services/reading-progress.service.js';

// Hàm getReadableChapterAccessLevels: Xác định cấp chương được phép liệt kê theo entitlement đang còn hạn của user.
/**
 * Hàm getReadableChapterAccessLevels: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: user.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: hasActivePremium, push, hasActiveVip.
 */
export const getReadableChapterAccessLevels = (user) => {
    // if chỉ chạy nhánh này khi điều kiện !user || typeof user.hasActivePremium !== 'function' || typeof user.hasActi đúng.
    if (!user || typeof user.hasActivePremium !== 'function' || typeof user.hasActiveVip !== 'function') {
        // return kết thúc hàm và trả [] về nơi gọi.
        return [];
    }
    // Khai báo accessLevels nhận giá trị từ ['free']. const giữ biến không gán lại; let cho phép cập nhật.
    const accessLevels = ['free'];
    // if chỉ chạy nhánh này khi điều kiện user.hasActivePremium() đúng.
    if (user.hasActivePremium()) accessLevels.push('premium');
    // if chỉ chạy nhánh này khi điều kiện user.hasActiveVip() đúng.
    if (user.hasActiveVip()) accessLevels.push('vip');
    // return kết thúc hàm và trả accessLevels về nơi gọi.
    return accessLevels;
};

// Hàm listReadableBookChapters: Trả catalog chương không có content, chỉ gồm cấp quyền tài khoản hiện tại đọc được.
// Khai báo listReadableBookChapters nhận giá trị từ asyncHandler(async (req, res) => { const accessLevels =. const giữ biến không gán lại; let cho phép cập nhật.
export const listReadableBookChapters = asyncHandler(async (req, res) => {
    // Khai báo accessLevels nhận giá trị từ req.authUser ? getReadableChapterAccessLevels(req.authU. const giữ biến không gán lại; let cho phép cập nhật.
    const accessLevels = req.authUser ? getReadableChapterAccessLevels(req.authUser) : ['free'];
    // Khai báo result nhận giá trị từ await chapterService.getReadableChapters(req.book._id, . const giữ biến không gán lại; let cho phép cập nhật.
    const result = await chapterService.getReadableChapters(req.book._id, accessLevels, { ...req.query });
    // Khai báo data nhận giá trị từ result.chapters.map((chapter) => { const dto = toChapte. const giữ biến không gán lại; let cho phép cập nhật.
    const data = result.chapters.map((chapter) => {
        // Khai báo dto nhận giá trị từ toChapterDto(chapter). const giữ biến không gán lại; let cho phép cập nhật.
        const dto = toChapterDto(chapter);
        // Khai báo excerpt nhận giá trị từ String(chapter.content || '').replace(/<[^>]*>/g, ' ') . const giữ biến không gán lại; let cho phép cập nhật.
        const excerpt = String(chapter.content || '').replace(/<[^>]*>/g, ' ')
            .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
                // Khai báo point nhận giá trị từ Number.parseInt(code[0].toLowerCase() === 'x' ? code.sl. const giữ biến không gán lại; let cho phép cập nhật.
                const point = Number.parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code,
                    code[0].toLowerCase() === 'x' ? 16 : 10);
                // return kết thúc hàm và trả Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodeP về nơi gọi.
                return Number.isFinite(point) && point > 0 && point <= 0x10ffff
                    ? String.fromCodePoint(point) : ' ';
            })
            .replace(/&(amp|nbsp|quot|apos|lt|gt);/gi, (_entity, name) => ({
                // Trường amp lưu '&' làm giá trị trong object.
                amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>'
            })[name.toLowerCase()] || ' ')
            .replace(/\s+/g, ' ').trim();
        // Gọi/thực thi excerpt.slice với các đối số để thực hiện thao tác: dto.excerpt = excerpt.length > 220 ? `${excerpt.slice(0, 220).trimEnd()}…`
        dto.excerpt = excerpt.length > 220 ? `${excerpt.slice(0, 220).trimEnd()}…` : excerpt;
        // Gọi/thực thi biểu thức để thực hiện thao tác: delete dto.content
        delete dto.content;
        // return kết thúc hàm và trả dto về nơi gọi.
        return dto;
    });
    // return kết thúc hàm và trả res.json({ status: 'success', data, pagination: result.pagination }) về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Khóa data nhận biến cùng tên làm giá trị.
        data,
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Resolve one readable chapter directly for reader resume/deep links beyond the first catalog page.
// Khai báo getReadableChapterMetadata nhận giá trị từ asyncHandler(async (req, res) => { const chapter = toCh. const giữ biến không gán lại; let cho phép cập nhật.
export const getReadableChapterMetadata = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ toChapterDto(req.chapter). const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = toChapterDto(req.chapter);
    // Gọi/thực thi biểu thức để thực hiện thao tác: delete chapter.content
    delete chapter.content;
    // return kết thúc hàm và trả res.json({ status: 'success', data: chapter }) về nơi gọi.
    return res.json({ status: 'success', data: chapter });
});

// Count a completed chapter only after the protected chapter route has verified access.
// Khai báo completeReadableChapter nhận giá trị từ asyncHandler(async (req, res) => { const data = await r. const giữ biến không gán lại; let cho phép cập nhật.
export const completeReadableChapter = asyncHandler(async (req, res) => {
    // Khai báo data nhận giá trị từ await readingProgressService.completeChapter( req.authU. const giữ biến không gán lại; let cho phép cập nhật.
    const data = await readingProgressService.completeChapter(
        req.authUser._id, req.book._id, req.chapter._id
    );
    // return kết thúc hàm và trả res.json({ status: 'success', data }) về nơi gọi.
    return res.json({ status: 'success', data });
});

// Hàm createChapter: Nhận dữ liệu chương đã validation, gọi service tạo slug/lưu DB và trả HTTP 201.
// Khai báo createChapter nhận giá trị từ asyncHandler(async (req, res) => { const chapter = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const createChapter = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ await chapterService.createChapter({ ...req.body }). const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await chapterService.createChapter({ ...req.body });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', data: toChapterDto(chapter) }) về nơi gọi.
    return res.status(201).json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm getAllChapters: Chuyển query filters sang service phân trang và trả danh sách chương kèm metadata.
// Khai báo getAllChapters nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getAllChapters = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await chapterService.getAllChapters({ ...req.query }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await chapterService.getAllChapters({ ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.chapters, toChapterDt về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.chapters, toChapterDto) làm giá trị trong object.
        data: mapDtoList(result.chapters, toChapterDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getChapter: Lấy chương theo ID hoặc slug và trả response JSON chuẩn.
// Khai báo getChapter nhận giá trị từ asyncHandler(async (req, res) => { const chapter = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const getChapter = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ await chapterService.getChapterById(req.params.chapterI. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await chapterService.getChapterById(req.params.chapterId);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toChapterDto(chapter) }) về nơi gọi.
    return res.json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm updateChapter: Cập nhật chương đã validation qua service và trả bản ghi sau cập nhật.
// Khai báo updateChapter nhận giá trị từ asyncHandler(async (req, res) => { const chapter = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const updateChapter = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ await chapterService.updateChapter(req.params.chapterId. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await chapterService.updateChapter(req.params.chapterId, { ...req.body });
    // return kết thúc hàm và trả res.json({ status: 'success', data: toChapterDto(chapter) }) về nơi gọi.
    return res.json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm deleteChapter: Xóa chương bằng service và trả thông báo thành công.
// Khai báo deleteChapter nhận giá trị từ asyncHandler(async (req, res) => { const chapter = awai. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteChapter = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ await chapterService.deleteChapter(req.params.chapterId. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await chapterService.deleteChapter(req.params.chapterId);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Chapter deleted successfully', data về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Chapter deleted successfully' làm giá trị trong object.
        message: 'Chapter deleted successfully',
        // Trường data lưu toChapterDto(chapter) làm giá trị trong object.
        data: toChapterDto(chapter)
    });
});
