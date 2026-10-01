// Điều phối request quản lý đầu sách giữa Express và BookService, rồi trả JSON thống nhất.
import BookService from '../services/book.service.js';
import asyncHandler from '../middlewares/async-handler.js';
import successResponse  from '../utils/api.response.js';

// Nhận bộ lọc/phân trang từ req.query; trả danh sách và thông tin phân trang.
export const getAllBooks = asyncHandler(async (req, res) => {
    const books = await BookService.getAllBooks(req.query);
    return successResponse(res, {
        message: 'Books retrieved successfully',
        data: books
    });
});

// Nhận mã đầu sách từ req.params.id; trả đầu sách cùng các bản sao liên quan.
export const getBookById = asyncHandler(async (req, res) => {
    const book = await BookService.getBookById(req.params.id);
    return successResponse(res, {
        message: 'Book retrieved successfully',
        data: book
    });
});

// Nhận dữ liệu sách từ req.body; tạo đầu sách và trả kết quả với HTTP 201.
export const createBook = asyncHandler(async (req, res) => {
    const book = await BookService.createBook(req.body);
    return successResponse(res, {
        statusCode: 201,
        message: 'Book created successfully',
        data: book
    });
});

// Nhận mã sách và các trường cập nhật; lưu thay đổi và trả đầu sách đã cập nhật.
export const updateBook = asyncHandler(async (req, res) => {
    const updatedBook = await BookService.updateBook(req.params.id, req.body);

    return successResponse(res, {
        message: 'Book updated successfully',
        data: updatedBook
    });
});

// Nhận mã sách từ URL; yêu cầu dịch vụ xóa sách rồi trả phản hồi thành công không kèm dữ liệu.
export const deleteBook = asyncHandler(async (req, res) => {
    await BookService.deleteBook(req.params.id);
    return successResponse(res, {
        message: 'Book deleted successfully',
        data: null
    });
});
