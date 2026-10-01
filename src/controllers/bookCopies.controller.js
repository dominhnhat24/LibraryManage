// Điều phối thao tác HTTP trên bản sao sách; service thực hiện nghiệp vụ và controller định dạng phản hồi.
import * as bookCopyService from '../services/bookCopies.service.js';
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';

// Lấy danh sách tất cả bản sao (hỗ trợ lọc qua query ?bookId=...)
// Nhận bookId tùy chọn từ query; trả bản sao kèm dữ liệu hiển thị của đầu sách liên kết.
const getAllBookCopies = asyncHandler(async (req, res) => {
    const { bookId } = req.query;
    const copies = await bookCopyService.getAllBookCopies(bookId);

    const formattedCopies = copies.map(copy => ({
        copyId: copy._id,
        bookId: copy.bookId?._id?.toString(),
        bookTitle: copy.bookId?.title || 'Unknown',
        author: copy.bookId?.author || 'Unknown',
        status: copy.status,
        createdAt: copy.createdAt
    }));

    return successResponse(res, {
        message: 'Lấy danh sách bản sao thành công',
        data: formattedCopies
    });
});

// Lấy thông tin chi tiết một bản sao theo ID
// Nhận mã bản sao từ req.params.id; trả bản sao theo mã đó hoặc chuyển tiếp lỗi dịch vụ.
const getBookCopyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookCopy = await bookCopyService.getBookCopyById(id);

    return successResponse(res, {
        message: 'Lấy thông tin bản sao thành công',
        data: bookCopy
    });
});

// Nhập kho: Thêm hàng loạt bản sao mới
// Nhận bookId và quantity từ req.body; tạo bản sao và trả danh sách mới với HTTP 201.
const createBookCopy = asyncHandler(async (req, res) => {
    const { bookId, quantity } = req.body;
    const result = await bookCopyService.createBookCopy(bookId, quantity);

    return successResponse(res, {
        statusCode: 201,
        message: result.message,
        data: result.copies
    });
});

// Cập nhật trạng thái bản sao (available, borrowed, damaged)
// Nhận id trên URL và status trong body; cập nhật trạng thái, trả bản ghi đã lưu.
const updateBookCopy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await bookCopyService.updateBookCopy(id, status);

    return successResponse(res, {
        message: result.message,
        data: result.bookCopy
    });
});

// Xóa / Thanh lý bản sao sách
// Nhận id trên URL; xóa bản sao phù hợp và trả thông báo kết quả.
const deleteBookCopy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await bookCopyService.deleteBookCopy(id);

    return successResponse(res, {
        message: result.message
    });
});

export default {
    getAllBookCopies,
    getBookCopyById,
    createBookCopy,
    updateBookCopy,
    deleteBookCopy
};