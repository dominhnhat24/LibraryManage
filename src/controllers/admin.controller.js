// [CONTROLLER QUẢN TRỊ] Cung cấp danh sách người dùng gần đây, xét thanh toán và upload file riêng tư.
// Import { removePrivateBookFile, savePrivateBookFile } từ ../utils/private-book-storage.js để dùng trong module.
/**
 * Tệp src/controllers/admin.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { removePrivateBookFile, savePrivateBookFile } from '../utils/private-book-storage.js';
// Import { mapDtoList, toReportDto, toSubscriptionDto, toUserDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toReportDto, toSubscriptionDto, toUserDto } from '../utils/api-dto.js';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import * as reportService từ ../services/report.service.js để dùng trong module.
import * as reportService from '../services/report.service.js';
// Import * as userService từ ../services/user.service.js để dùng trong module.
import * as userService from '../services/user.service.js';
// Import * as subscriptionService từ ../services/subscription.service.js để dùng trong module.
import * as subscriptionService from '../services/subscription.service.js';

// Hàm getRecentUsers: Dùng service trả tối đa 50 hồ sơ mới nhất, không bao gồm mật khẩu hay token.
// Khai báo getRecentUsers nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getRecentUsers = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await userService.getAllUsers({ page: 1, limit: 50 }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await userService.getAllUsers({ page: 1, limit: 50 });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.users, toUserDto) }) về nơi gọi.
    return res.json({ status: 'success', data: mapDtoList(result.users, toUserDto) });
});

// Hàm getPendingSubscriptions: Dùng service để lấy và populate yêu cầu thuê bao chờ xét duyệt.
// Khai báo getPendingSubscriptions nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getPendingSubscriptions = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await subscriptionService.getAllSubscriptions({ ...req.. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await subscriptionService.getAllSubscriptions({
        ...req.query, status: 'pending', page: 1, limit: 50
    });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.subscriptions, toSubs về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.subscriptions, toSubscriptionDto) làm giá trị trong object.
        data: mapDtoList(result.subscriptions, toSubscriptionDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getReports: Dùng report service lọc/phân trang báo cáo và populate thông tin người gửi.
// Khai báo getReports nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getReports = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await reportService.getAllReports({ ...req.query }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await reportService.getAllReports({ ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.reports, toReportDto) về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.reports, toReportDto) làm giá trị trong object.
        data: mapDtoList(result.reports, toReportDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm updateReportStatus: Cập nhật trạng thái báo cáo theo workflow đã validation và trả kết quả qua service.
// Khai báo updateReportStatus nhận giá trị từ asyncHandler(async (req, res) => { const status = req.b. const giữ biến không gán lại; let cho phép cập nhật.
export const updateReportStatus = asyncHandler(async (req, res) => {
    // Khai báo status nhận giá trị từ req.body.status. const giữ biến không gán lại; let cho phép cập nhật.
    const status = req.body.status;
    // if chỉ chạy nhánh này khi điều kiện !['open', 'in_progress', 'resolved'].includes(status) đúng.
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Report status must be open, in_progress, or resolved');
    }
    // Khai báo report nhận giá trị từ await reportService.updateReport(req.params.reportId, {. const giữ biến không gán lại; let cho phép cập nhật.
    const report = await reportService.updateReport(req.params.reportId, { status });
    // return kết thúc hàm và trả res.json({ status: 'success', data: toReportDto(report) }) về nơi gọi.
    return res.json({ status: 'success', data: toReportDto(report) });
});

// Hàm getReport: Lấy chi tiết báo cáo theo ID qua service và trả dữ liệu người gửi đã populate.
// Khai báo getReport nhận giá trị từ asyncHandler(async (req, res) => { const report = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getReport = asyncHandler(async (req, res) => {
    // Khai báo report nhận giá trị từ await reportService.getReportById(req.params.reportId). const giữ biến không gán lại; let cho phép cập nhật.
    const report = await reportService.getReportById(req.params.reportId);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toReportDto(report) }) về nơi gọi.
    return res.json({ status: 'success', data: toReportDto(report) });
});

// Hàm deleteReport: Xóa báo cáo theo ID bằng service sau khi quyền Admin đã được xác nhận ở route.
// Khai báo deleteReport nhận giá trị từ asyncHandler(async (req, res) => { const report = await. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteReport = asyncHandler(async (req, res) => {
    // Khai báo report nhận giá trị từ await reportService.deleteReport(req.params.reportId). const giữ biến không gán lại; let cho phép cập nhật.
    const report = await reportService.deleteReport(req.params.reportId);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Report deleted successfully', data: về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Report deleted successfully' làm giá trị trong object.
        message: 'Report deleted successfully',
        // Trường data lưu toReportDto(report) làm giá trị trong object.
        data: toReportDto(report)
    });
});

// [UPLOAD SÁCH] Ghi tệp vào kho không public, chỉ lưu khóa ngẫu nhiên vào DB và dọn file nếu ghi DB lỗi.
// Khai báo uploadBookFile nhận giá trị từ asyncHandler(async (req, res) => { if (!req.file) throw. const giữ biến không gán lại; let cho phép cập nhật.
export const uploadBookFile = asyncHandler(async (req, res) => {
    // if chỉ chạy nhánh này khi điều kiện !req.file đúng.
    if (!req.file) throw new ApiError(400, 'A book file is required');
    // Khai báo book nhận giá trị từ await Book.findById(req.params.bookId).select('+file_ke. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await Book.findById(req.params.bookId).select('+file_key');
    // if chỉ chạy nhánh này khi điều kiện !book đúng.
    if (!book) throw new ApiError(404, 'Book not found');
    // Khai báo privateFile nhận giá trị từ await savePrivateBookFile(req.file, book.category). const giữ biến không gán lại; let cho phép cập nhật.
    const privateFile = await savePrivateBookFile(req.file, book.category);
    // Khai báo previousFileKey nhận giá trị từ book.file_key. const giữ biến không gán lại; let cho phép cập nhật.
    const previousFileKey = book.file_key;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Gọi/thực thi biểu thức để thực hiện thao tác: book.file_key = privateFile.file_key
        book.file_key = privateFile.file_key;
        // Gọi/thực thi biểu thức để thực hiện thao tác: book.file_original_name = privateFile.original_name
        book.file_original_name = privateFile.original_name;
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await book.save()
        await book.save();
    } catch (error) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await removePrivateBookFile(privateFile.file_key)
        await removePrivateBookFile(privateFile.file_key);
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // if chỉ chạy nhánh này khi điều kiện previousFileKey đúng.
    if (previousFileKey) await removePrivateBookFile(previousFileKey);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Book file uploaded to private stora về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu 'Book file uploaded to private storage' làm giá trị trong object.
        message: 'Book file uploaded to private storage',
        // Trường data lưu { book_id: book.id, original_name: book.file_original_n làm giá trị trong object.
        data: { book_id: book.id, original_name: book.file_original_name }
    });
});

// Hàm grantVip: Gọi service cấp quyền VIP có thời hạn cho USER mà không thay đổi role ADMIN/USER.
// Khai báo grantVip nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const grantVip = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.grantVipToUser(req.params.userId, req. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.grantVipToUser(req.params.userId, req.body.vip_expires_at);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Khai báo grantPremium nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const grantPremium = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.grantPremiumToUser(req.params.userId,. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.grantPremiumToUser(req.params.userId, req.body.premium_expires_at);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(user) });
});
