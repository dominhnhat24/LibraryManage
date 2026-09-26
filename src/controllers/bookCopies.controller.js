import * as bookCopyService from '../services/bookCopies.service.js';
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';

// Lấy danh sách tất cả bản sao (hỗ trợ lọc qua query ?bookId=...)
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
const getBookCopyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookCopy = await bookCopyService.getBookCopyById(id);

    return successResponse(res, {
        message: 'Lấy thông tin bản sao thành công',
        data: bookCopy
    });
});

// Nhập kho: Thêm hàng loạt bản sao mới
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