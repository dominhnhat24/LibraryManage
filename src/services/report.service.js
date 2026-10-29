import Report from '../models/report.model.js';
import ApiError from '../utils/api-error.js';
import { PAGINATION } from '../constants/pagination.constant.js';
import { STATUS } from '../constants/status.constant.js';

// Hàm createReport: Tạo báo cáo bằng email đã xác thực hoặc email khách, không nhận trạng thái quản trị từ client.
export const createReport = async (data, authenticatedUser = null) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new ApiError(400, 'Report data must be an object');
    }
    const payload = {
        ...data,
        email: authenticatedUser?.email || data.email,
        user: authenticatedUser?._id || null
    };
    delete payload.status;
    return Report.create(payload);
};

// Hàm getAllReports: Lọc báo cáo theo trạng thái, tìm kiếm subject/email, phân trang và populate người gửi.
export const getAllReports = async (filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = {};
    if (filters.status) {
        if (!Object.values(STATUS.REPORT).includes(filters.status)) {
            throw new ApiError(400, 'Report status filter is invalid');
        }
        query.status = filters.status;
    }
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
            { subject: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } }
        ];
    }
    const [reports, total] = await Promise.all([
        Report.find(query).populate('user', 'name email role')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Report.countDocuments(query)
    ]);
    return { reports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReportById: Tìm một báo cáo và populate người gửi; phát sinh lỗi 404 khi ID không tồn tại.
export const getReportById = async (reportId) => {
    const report = await Report.findById(reportId).populate('user', 'name email role');
    if (!report) throw new ApiError(404, 'Report not found');
    return report;
};

// Hàm updateReport: Cập nhật trạng thái báo cáo theo workflow enum và trả 404 nếu không tồn tại.
export const updateReport = async (reportId, data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)
        || !Object.values(STATUS.REPORT).includes(data.status)) {
        throw new ApiError(400, 'Report status is invalid');
    }
    const report = await Report.findByIdAndUpdate(
        reportId,
        { $set: { status: data.status } },
        { new: true, runValidators: true }
    );
    if (!report) throw new ApiError(404, 'Report not found');
    return report;
};

// Hàm deleteReport: Xóa báo cáo theo ID và trả 404 nếu bản ghi không tồn tại.
export const deleteReport = async (reportId) => {
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) throw new ApiError(404, 'Report not found');
    return report;
};
