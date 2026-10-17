import * as chapterService from '../services/chapter.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { mapDtoList, toChapterDto } from '../utils/api-dto.js';

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
    const accessLevels = getReadableChapterAccessLevels(req.authUser);
    const result = await chapterService.getReadableChapters(req.book._id, accessLevels, { ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.chapters, toChapterDto),
        pagination: result.pagination
    });
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
