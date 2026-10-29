import * as chapterService from '../services/chapter.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { mapDtoList, toChapterDto } from '../utils/api-dto.js';
import * as readingProgressService from '../services/reading-progress.service.js';

// Hàm getReadableChapterAccessLevels: Xác định cấp chương được phép liệt kê theo entitlement đang còn hạn của user.
export const getReadableChapterAccessLevels = (user) => {
    if (!user || typeof user.hasActivePremium !== 'function' || typeof user.hasActiveVip !== 'function') {
        return [];
    }
    const accessLevels = ['free'];
    if (user.hasActivePremium()) accessLevels.push('premium');
    if (user.hasActiveVip()) accessLevels.push('vip');
    return accessLevels;
};

// Hàm listReadableBookChapters: Trả catalog chương không có content, chỉ gồm cấp quyền tài khoản hiện tại đọc được.
export const listReadableBookChapters = asyncHandler(async (req, res) => {
    const accessLevels = req.authUser ? getReadableChapterAccessLevels(req.authUser) : ['free'];
    const result = await chapterService.getReadableChapters(req.book._id, accessLevels, { ...req.query });
    const data = result.chapters.map((chapter) => {
        const dto = toChapterDto(chapter);
        const excerpt = String(chapter.content || '').replace(/<[^>]*>/g, ' ')
            .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
                const point = Number.parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code,
                    code[0].toLowerCase() === 'x' ? 16 : 10);
                return Number.isFinite(point) && point > 0 && point <= 0x10ffff
                    ? String.fromCodePoint(point) : ' ';
            })
            .replace(/&(amp|nbsp|quot|apos|lt|gt);/gi, (_entity, name) => ({
                amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>'
            })[name.toLowerCase()] || ' ')
            .replace(/\s+/g, ' ').trim();
        dto.excerpt = excerpt.length > 220 ? `${excerpt.slice(0, 220).trimEnd()}…` : excerpt;
        delete dto.content;
        return dto;
    });
    return res.json({
        status: 'success',
        data,
        pagination: result.pagination
    });
});

// Resolve one readable chapter directly for reader resume/deep links beyond the first catalog page.
export const getReadableChapterMetadata = asyncHandler(async (req, res) => {
    const chapter = toChapterDto(req.chapter);
    delete chapter.content;
    return res.json({ status: 'success', data: chapter });
});

// Count a completed chapter only after the protected chapter route has verified access.
export const completeReadableChapter = asyncHandler(async (req, res) => {
    const data = await readingProgressService.completeChapter(
        req.authUser._id, req.book._id, req.chapter._id
    );
    return res.json({ status: 'success', data });
});

// Hàm createChapter: Nhận dữ liệu chương đã validation, gọi service tạo slug/lưu DB và trả HTTP 201.
export const createChapter = asyncHandler(async (req, res) => {
    const chapter = await chapterService.createChapter({ ...req.body });
    return res.status(201).json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm getAllChapters: Chuyển query filters sang service phân trang và trả danh sách chương kèm metadata.
export const getAllChapters = asyncHandler(async (req, res) => {
    const result = await chapterService.getAllChapters({ ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.chapters, toChapterDto),
        pagination: result.pagination
    });
});

// Hàm getChapter: Lấy chương theo ID hoặc slug và trả response JSON chuẩn.
export const getChapter = asyncHandler(async (req, res) => {
    const chapter = await chapterService.getChapterById(req.params.chapterId);
    return res.json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm updateChapter: Cập nhật chương đã validation qua service và trả bản ghi sau cập nhật.
export const updateChapter = asyncHandler(async (req, res) => {
    const chapter = await chapterService.updateChapter(req.params.chapterId, { ...req.body });
    return res.json({ status: 'success', data: toChapterDto(chapter) });
});

// Hàm deleteChapter: Xóa chương bằng service và trả thông báo thành công.
export const deleteChapter = asyncHandler(async (req, res) => {
    const chapter = await chapterService.deleteChapter(req.params.chapterId);
    return res.json({
        status: 'success',
        message: 'Chapter deleted successfully',
        data: toChapterDto(chapter)
    });
});
