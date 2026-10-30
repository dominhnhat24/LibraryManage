// Import Report từ ../models/report.model.js để dùng trong module.
/**
 * Tệp src/services/report.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Report from '../models/report.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { PAGINATION } từ ../constants/pagination.constant.js để dùng trong module.
import { PAGINATION } from '../constants/pagination.constant.js';
// Import { STATUS } từ ../constants/status.constant.js để dùng trong module.
import { STATUS } from '../constants/status.constant.js';

// Hàm createReport: Tạo báo cáo bằng email đã xác thực hoặc email khách, không nhận trạng thái quản trị từ client.
/**
 * Hàm createReport: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: data, authenticatedUser mặc định null.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, ApiError, create.
 */
export const createReport = async (data, authenticatedUser = null) => {
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Report data must be an object');
    }
    // Khai báo payload nhận giá trị từ { ...data, email: authenticatedUser?.email || data.emai. const giữ biến không gán lại; let cho phép cập nhật.
    const payload = {
        ...data,
        // Trường email lưu authenticatedUser?.email || data.email làm giá trị trong object.
        email: authenticatedUser?.email || data.email,
        // Trường user lưu authenticatedUser?._id || null làm giá trị trong object.
        user: authenticatedUser?._id || null
    };
    // Gọi/thực thi biểu thức để thực hiện thao tác: delete payload.status
    delete payload.status;
    // return kết thúc hàm và trả Report.create(payload) về nơi gọi.
    return Report.create(payload);
};

// Hàm getAllReports: Lọc báo cáo theo trạng thái, tìm kiếm subject/email, phân trang và populate người gửi.
/**
 * Hàm getAllReports: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: filters mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: max, parseInt, min, values, includes, ApiError, trim, replace.
 */
export const getAllReports = async (filters = {}) => {
    // Khai báo page nhận giá trị từ Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filte. const giữ biến không gán lại; let cho phép cập nhật.
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    // Khai báo limit nhận giá trị từ Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parse. const giữ biến không gán lại; let cho phép cập nhật.
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const query = {};
    // if chỉ chạy nhánh này khi điều kiện filters.status đúng.
    if (filters.status) {
        // if chỉ chạy nhánh này khi điều kiện !Object.values(STATUS.REPORT).includes(filters.status) đúng.
        if (!Object.values(STATUS.REPORT).includes(filters.status)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Report status filter is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.status = filters.status
        query.status = filters.status;
    }
    // if chỉ chạy nhánh này khi điều kiện typeof filters.search === 'string' && filters.search.trim() đúng.
    if (typeof filters.search === 'string' && filters.search.trim()) {
        // Khai báo escaped nhận giá trị từ filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\. const giữ biến không gán lại; let cho phép cập nhật.
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Gọi/thực thi biểu thức để thực hiện thao tác: query.$or = [ { subject: { $regex: escaped, $options: 'i' } }, { email: { $
        query.$or = [
            { subject: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } }
        ];
    }
    // Khai báo [reports, total] nhận giá trị từ await Promise.all([ Report.find(query).populate('user',. const giữ biến không gán lại; let cho phép cập nhật.
    const [reports, total] = await Promise.all([
        Report.find(query).populate('user', 'name email role')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Report.countDocuments(query)
    ]);
    // return kết thúc hàm và trả { reports, pagination: { total, page, limit, totalPages: Math.ceil(total /  về nơi gọi.
    return { reports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getReportById: Tìm một báo cáo và populate người gửi; phát sinh lỗi 404 khi ID không tồn tại.
/**
 * Hàm getReportById: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: reportId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findById, populate, ApiError.
 */
export const getReportById = async (reportId) => {
    // Khai báo report nhận giá trị từ await Report.findById(reportId).populate('user', 'name . const giữ biến không gán lại; let cho phép cập nhật.
    const report = await Report.findById(reportId).populate('user', 'name email role');
    // if chỉ chạy nhánh này khi điều kiện !report đúng.
    if (!report) throw new ApiError(404, 'Report not found');
    // return kết thúc hàm và trả report về nơi gọi.
    return report;
};

// Hàm updateReport: Cập nhật trạng thái báo cáo theo workflow enum và trả 404 nếu không tồn tại.
/**
 * Hàm updateReport: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: reportId, data.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, values, includes, ApiError, findByIdAndUpdate.
 */
export const updateReport = async (reportId, data) => {
    // if chỉ chạy nhánh này khi điều kiện !data || typeof data !== 'object' || Array.isArray(data) || !Object.values( đúng.
    if (!data || typeof data !== 'object' || Array.isArray(data)
        || !Object.values(STATUS.REPORT).includes(data.status)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Report status is invalid');
    }
    // Khai báo report nhận giá trị từ await Report.findByIdAndUpdate( reportId, { $set: { sta. const giữ biến không gán lại; let cho phép cập nhật.
    const report = await Report.findByIdAndUpdate(
        reportId,
        { $set: { status: data.status } },
        { new: true, runValidators: true }
    );
    // if chỉ chạy nhánh này khi điều kiện !report đúng.
    if (!report) throw new ApiError(404, 'Report not found');
    // return kết thúc hàm và trả report về nơi gọi.
    return report;
};

// Hàm deleteReport: Xóa báo cáo theo ID và trả 404 nếu bản ghi không tồn tại.
/**
 * Hàm deleteReport: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: reportId.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findByIdAndDelete, ApiError.
 */
export const deleteReport = async (reportId) => {
    // Khai báo report nhận giá trị từ await Report.findByIdAndDelete(reportId). const giữ biến không gán lại; let cho phép cập nhật.
    const report = await Report.findByIdAndDelete(reportId);
    // if chỉ chạy nhánh này khi điều kiện !report đúng.
    if (!report) throw new ApiError(404, 'Report not found');
    // return kết thúc hàm và trả report về nơi gọi.
    return report;
};
