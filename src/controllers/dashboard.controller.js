// Cung cấp điểm truy cập HTTP cho số liệu tổng quan được tổng hợp từ dịch vụ dashboard.
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import { getDashboardSummary } from '../services/dashboard.service.js';

// Không nhận tham số nghiệp vụ; lấy số liệu tổng quan và trả JSON thành công, lỗi được chuyển tiếp.
export const getSummary = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Dashboard summary retrieved successfully',
    data: await getDashboardSummary()
}));
