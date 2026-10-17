// [CONTROLLER QUẢN TRỊ] Cung cấp danh sách người dùng gần đây, xét thanh toán và upload file riêng tư.
import { removePrivateBookFile, savePrivateBookFile } from '../utils/private-book-storage.js';
import { mapDtoList, toReportDto, toSubscriptionDto, toUserDto } from '../utils/api-dto.js';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as reportService from '../services/report.service.js';
import * as userService from '../services/user.service.js';
import * as subscriptionService from '../services/subscription.service.js';

// Hàm getRecentUsers: Dùng service trả tối đa 50 hồ sơ mới nhất, không bao gồm mật khẩu hay token.
export const getRecentUsers = asyncHandler(async (req, res) => {
    const result = await userService.getAllUsers({ page: 1, limit: 50 });
    return res.json({ status: 'success', data: mapDtoList(result.users, toUserDto) });
});

// Hàm getPendingSubscriptions: Dùng service để lấy và populate yêu cầu thuê bao chờ xét duyệt.
export const getPendingSubscriptions = asyncHandler(async (req, res) => {
    const result = await subscriptionService.getAllSubscriptions({
        ...req.query, status: 'pending', page: 1, limit: 50
    });
    return res.json({
        status: 'success',
        data: mapDtoList(result.subscriptions, toSubscriptionDto),
        pagination: result.pagination
    });
});

// Hàm getReports: Dùng report service lọc/phân trang báo cáo và populate thông tin người gửi.
export const getReports = asyncHandler(async (req, res) => {
    const result = await reportService.getAllReports({ ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.reports, toReportDto),
        pagination: result.pagination
    });
});

// Hàm updateReportStatus: Cập nhật trạng thái báo cáo theo workflow đã validation và trả kết quả qua service.
export const updateReportStatus = asyncHandler(async (req, res) => {
    const status = req.body.status;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
        throw new ApiError(400, 'Report status must be open, in_progress, or resolved');
    }
    const report = await reportService.updateReport(req.params.reportId, { status });
    return res.json({ status: 'success', data: toReportDto(report) });
});

// Hàm getReport: Lấy chi tiết báo cáo theo ID qua service và trả dữ liệu người gửi đã populate.
export const getReport = asyncHandler(async (req, res) => {
    const report = await reportService.getReportById(req.params.reportId);
    return res.json({ status: 'success', data: toReportDto(report) });
});

// Hàm deleteReport: Xóa báo cáo theo ID bằng service sau khi quyền Admin đã được xác nhận ở route.
export const deleteReport = asyncHandler(async (req, res) => {
    const report = await reportService.deleteReport(req.params.reportId);
    return res.json({
        status: 'success',
        message: 'Report deleted successfully',
        data: toReportDto(report)
    });
});

// [UPLOAD SÁCH] Ghi tệp vào kho không public, chỉ lưu khóa ngẫu nhiên vào DB và dọn file nếu ghi DB lỗi.
export const uploadBookFile = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'A book file is required');
    const book = await Book.findById(req.params.bookId).select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    const privateFile = await savePrivateBookFile(req.file, book.category);
    const previousFileKey = book.file_key;
    try {
        book.file_key = privateFile.file_key;
        book.file_original_name = privateFile.original_name;
        await book.save();
    } catch (error) {
        await removePrivateBookFile(privateFile.file_key);
        throw error;
    }
    if (previousFileKey) await removePrivateBookFile(previousFileKey);
    return res.json({
        status: 'success',
        message: 'Book file uploaded to private storage',
        data: { book_id: book.id, original_name: book.file_original_name }
    });
});

// Hàm grantVip: Gọi service cấp quyền VIP có thời hạn cho USER mà không thay đổi role ADMIN/USER.
export const grantVip = asyncHandler(async (req, res) => {
    const user = await userService.grantVipToUser(req.params.userId, req.body.vip_expires_at);
    return res.json({ status: 'success', data: toUserDto(user) });
});
