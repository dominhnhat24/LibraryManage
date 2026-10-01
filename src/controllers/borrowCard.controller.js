// Chuyển request mượn/trả sách thành lời gọi dịch vụ, dùng danh tính đã xác thực để giới hạn quyền.
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as service from '../services/borrowCard.service.js';

// Nhận copyIds, dueDate và tùy chọn readerId trong body; độc giả dùng ID token, thủ thư dùng ID body.
// Tạo phiếu mượn và trả kết quả với HTTP 201; nghiệp vụ được thực hiện trong service.
export const createBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    statusCode: 201, message: 'Borrow card created successfully',
    data: await service.createBorrowCard({
        readerId: ['librarian', 'admin'].includes(String(req.user.role || req.user.roll || '').toLowerCase())
            ? req.body.readerId
            : req.user.sub || req.user.id,
        copyIds: req.body.copyIds,
        dueDate: req.body.dueDate
    })
}));
// Nhận điều kiện lọc/phân trang từ query và người dùng từ token; trả các phiếu được phép xem.
export const listBorrowCards = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow cards retrieved successfully', data: await service.listBorrowCards(req.query, req.user)
}));
// Nhận mã phiếu từ URL và người dùng xác thực; service kiểm tra quyền sở hữu trước khi trả chi tiết.
export const getBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card retrieved successfully', data: await service.getBorrowCard(req.params.id, req.user)
}));
// Nhận mã phiếu và người dùng xác thực; yêu cầu hủy phiếu đủ điều kiện và trả trạng thái mới.
export const cancelBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card cancelled successfully', data: await service.cancelBorrowCard(req.params.id, req.user)
}));
// Nhận mã phiếu cùng ID thủ thư trong token; duyệt phiếu và trả bản ghi sau xử lý.
export const approveBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Borrow card approved successfully',
    data: await service.approveBorrow(req.params.id, req.user.sub || req.user.id)
}));
// Nhận mã phiếu, danh sách returns trong body và ID thủ thư; ghi nhận tình trạng, trả sách và khoản phạt nếu có.
export const returnBorrowCard = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Books returned successfully',
    data: await service.returnBook(req.params.id, req.body.returns, req.user.sub || req.user.id)
}));
