import * as readingProgressService from '../services/reading-progress.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { mapDtoList, toReadingProgressDto } from '../utils/api-dto.js';

// Hàm createReadingProgress: Tạo tiến độ đọc của user đã đăng nhập và trả HTTP 201.
export const createReadingProgress = asyncHandler(async (req, res) => {
    const progress = await readingProgressService.createReadingProgress(req.authUser._id, { ...req.body });
    return res.status(201).json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm getAllReadingProgress: Liệt kê tiến độ thuộc tài khoản hiện tại theo query và phân trang.
export const getAllReadingProgress = asyncHandler(async (req, res) => {
    const result = await readingProgressService.getAllReadingProgress(req.authUser._id, { ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.progress, toReadingProgressDto),
        pagination: result.pagination
    });
});

// Hàm getReadingProgress: Đọc một tiến độ chỉ khi tài khoản hiện tại sở hữu bản ghi đó.
export const getReadingProgress = asyncHandler(async (req, res) => {
    const progress = await readingProgressService.getReadingProgressById(
        req.params.progressId, req.authUser._id
    );
    return res.json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm updateReadingProgress: Cập nhật bộ đếm đọc qua service sau khi giới hạn payload bởi Joi.
export const updateReadingProgress = asyncHandler(async (req, res) => {
    const progress = await readingProgressService.updateReadingProgress(
        req.params.progressId, req.authUser._id, { ...req.body }
    );
    return res.json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm deleteReadingProgress: Xóa tiến độ của user hiện tại và trả thông báo thành công.
export const deleteReadingProgress = asyncHandler(async (req, res) => {
    const progress = await readingProgressService.deleteReadingProgress(req.params.progressId, req.authUser._id);
    return res.json({
        status: 'success',
        message: 'Reading progress deleted successfully',
        data: toReadingProgressDto(progress)
    });
});
