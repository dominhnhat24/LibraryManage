// Điều phối các thao tác hồ sơ thủ thư; dữ liệu và quy tắc lưu trữ do librarianService xử lý.
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';
import * as librarianService from '../services/librarian.service.js';

// Lấy ID thủ thư hiện tại từ payload JWT; trả về trường sub nếu có, nếu không dùng id.
const currentLibrarianId = (req) => req.user.sub || req.user.id;

// Nhận bộ lọc/phân trang từ query; trả danh sách thủ thư qua phản hồi thành công.
export const listLibrarians = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarians retrieved successfully',
    data: await librarianService.listLibrarians(req.query)
}));

// Nhận ID thủ thư từ URL; trả hồ sơ công khai hoặc chuyển tiếp lỗi nếu không tìm thấy.
export const getLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian retrieved successfully',
    data: await librarianService.getLibrarian(req.params.id)
}));

// Nhận request đã xác thực; trả hồ sơ của thủ thư hiện tại dựa trên ID trong token.
export const getMyProfile = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian profile retrieved successfully',
    data: await librarianService.getLibrarian(currentLibrarianId(req))
}));

// Nhận thông tin thủ thư mới từ body; tạo tài khoản và trả phản hồi HTTP 201.
export const createLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    statusCode: 201,
    message: 'Librarian created successfully',
    data: await librarianService.createLibrarian(req.body)
}));

// Nhận ID từ URL và trường cập nhật từ body; lưu rồi trả hồ sơ đã cập nhật.
export const updateLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian updated successfully',
    data: await librarianService.updateLibrarian(req.params.id, req.body)
}));

// Nhận body cập nhật của thủ thư hiện tại; lấy ID từ token, lưu thay đổi và trả hồ sơ.
export const updateMyProfile = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian profile updated successfully',
    data: await librarianService.updateLibrarian(currentLibrarianId(req), req.body)
}));

// Nhận ID thủ thư từ URL; chuyển trạng thái tài khoản thành bị khóa và trả hồ sơ.
export const blockLibrarian = asyncHandler(async (req, res) => successResponse(res, {
    message: 'Librarian blocked successfully',
    data: await librarianService.blockLibrarian(req.params.id)
}));
