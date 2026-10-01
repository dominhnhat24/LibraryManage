// Điều phối request tra cứu và xử lý khoản phạt; quyền của người dùng được truyền xuống service.
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as service from '../services/fine.service.js';

// Nhận bộ lọc query và người dùng xác thực; trả danh sách khoản phạt trong phạm vi quyền truy cập.
export const listFines = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fines retrieved successfully', data: await service.listFines(req.query, req.user)
}));
// Nhận mã khoản phạt trên URL và người dùng xác thực; trả chi tiết sau khi service kiểm tra quyền xem.
export const getFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine retrieved successfully', data: await service.getFine(req.params.id, req.user)
}));
// Nhận mã khoản phạt; chuyển khoản phạt đang chờ sang trạng thái đã trả và trả bản ghi mới.
export const payFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine marked as paid', data: await service.payFine(req.params.id)
}));
// Nhận mã khoản phạt và waiverReason từ body; miễn khoản phạt đang chờ và trả bản ghi đã cập nhật.
export const waiveFine = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Fine waived', data: await service.waiveFine(req.params.id, req.body.waiverReason)
}));
