// Import * as readingProgressService từ ../services/reading-progress.service.js để dùng trong module.
/**
 * Tệp src/controllers/reading-progress.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import * as readingProgressService from '../services/reading-progress.service.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { mapDtoList, toReadingProgressDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toReadingProgressDto } from '../utils/api-dto.js';

// Hàm createReadingProgress: Tạo tiến độ đọc của user đã đăng nhập và trả HTTP 201.
// Khai báo createReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const progress = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const createReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo progress nhận giá trị từ await readingProgressService.createReadingProgress(req.. const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await readingProgressService.createReadingProgress(req.authUser._id, { ...req.body });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', data: toReadingProgressDto(progre về nơi gọi.
    return res.status(201).json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm getAllReadingProgress: Liệt kê tiến độ thuộc tài khoản hiện tại theo query và phân trang.
// Khai báo getAllReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getAllReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await readingProgressService.getAllReadingProgress(req.. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await readingProgressService.getAllReadingProgress(req.authUser._id, { ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.progress, toReadingPr về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.progress, toReadingProgressDto) làm giá trị trong object.
        data: mapDtoList(result.progress, toReadingProgressDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm clearAllReadingProgress: Xóa toàn bộ tiến độ đọc thuộc tài khoản hiện tại.
// Khai báo clearAllReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const deletedCount =. const giữ biến không gán lại; let cho phép cập nhật.
export const clearAllReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo deletedCount nhận giá trị từ await readingProgressService.deleteAllReadingProgress(r. const giữ biến không gán lại; let cho phép cập nhật.
    const deletedCount = await readingProgressService.deleteAllReadingProgress(req.authUser._id);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Reading history cleared successfull về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Reading history cleared successfully' làm giá trị trong object.
        message: 'Reading history cleared successfully',
        // Trường data lưu { deleted_count: deletedCount } làm giá trị trong object.
        data: { deleted_count: deletedCount }
    });
});

// Hàm getReadingProgress: Đọc một tiến độ chỉ khi tài khoản hiện tại sở hữu bản ghi đó.
// Khai báo getReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const progress = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const getReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo progress nhận giá trị từ await readingProgressService.getReadingProgressById( re. const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await readingProgressService.getReadingProgressById(
        req.params.progressId, req.authUser._id
    );
    // return kết thúc hàm và trả res.json({ status: 'success', data: toReadingProgressDto(progress) }) về nơi gọi.
    return res.json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm updateReadingProgress: Cập nhật bộ đếm đọc qua service sau khi giới hạn payload bởi Joi.
// Khai báo updateReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const progress = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const updateReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo progress nhận giá trị từ await readingProgressService.updateReadingProgress( req. const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await readingProgressService.updateReadingProgress(
        req.params.progressId, req.authUser._id, { ...req.body }
    );
    // return kết thúc hàm và trả res.json({ status: 'success', data: toReadingProgressDto(progress) }) về nơi gọi.
    return res.json({ status: 'success', data: toReadingProgressDto(progress) });
});

// Hàm deleteReadingProgress: Xóa tiến độ của user hiện tại và trả thông báo thành công.
// Khai báo deleteReadingProgress nhận giá trị từ asyncHandler(async (req, res) => { const progress = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteReadingProgress = asyncHandler(async (req, res) => {
    // Khai báo progress nhận giá trị từ await readingProgressService.deleteReadingProgress(req.. const giữ biến không gán lại; let cho phép cập nhật.
    const progress = await readingProgressService.deleteReadingProgress(req.params.progressId, req.authUser._id);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Reading progress deleted successful về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Reading progress deleted successfully' làm giá trị trong object.
        message: 'Reading progress deleted successfully',
        // Trường data lưu toReadingProgressDto(progress) làm giá trị trong object.
        data: toReadingProgressDto(progress)
    });
});
