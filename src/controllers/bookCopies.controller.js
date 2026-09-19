import * as bookCopyService from '../services/bookCopies.service.js';

// Lấy danh sách tất cả bản sao (hỗ trợ lọc qua query ?bookId=...)
const getAllBookCopies = async (req, res) => {
    const { bookId } = req.query;
    const copies = await bookCopyService.getAllBookCopies(bookId);

    const formattedCopies = copies.map(copy => ({
        copyId: copy._id,
        bookTitle: copy.bookId?.title || 'Unknown',
        author: copy.bookId?.author || 'Unknown',
        status: copy.status,
        createdAt: copy.createdAt
    }));

    return res.status(200).json({
        success: true,
        message: 'Lấy danh sách bản sao thành công',
        data: formattedCopies
    });
};

// Lấy thông tin chi tiết một bản sao theo ID
const getBookCopyById = async (req, res) => {
    const { id } = req.params;
    const bookCopy = await bookCopyService.getBookCopyById(id);

    return res.status(200).json({
        success: true,
        message: 'Lấy thông tin bản sao thành công',
        data: bookCopy
    });
};

// Nhập kho: Thêm hàng loạt bản sao mới
const createBookCopy = async (req, res) => {
    const { bookId, quantity } = req.body;
    const result = await bookCopyService.createBookCopy(bookId, quantity);

    return res.status(201).json({
        success: true,
        message: result.message,
        data: result.copies
    });
};

// Cập nhật trạng thái bản sao (available, borrowed, damaged)
const updateBookCopy = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await bookCopyService.updateBookCopy(id, status);

    return res.status(200).json({
        success: true,
        message: result.message,
        data: result.bookCopy
    });
};

// Xóa / Thanh lý bản sao sách
const deleteBookCopy = async (req, res) => {
    const { id } = req.params;
    const result = await bookCopyService.deleteBookCopy(id);

    return res.status(200).json({
        success: true,
        message: result.message
    });
};

export default {
    getAllBookCopies,
    getBookCopyById,
    createBookCopy,
    updateBookCopy,
    deleteBookCopy
};