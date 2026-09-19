import * as db from '../models/init.js';
import apiError from '../utils/api-error.js';

// 1. Lấy tất cả bản sao
export const getAllBookCopies = async () => {
    const copies = await db.BookCopy.find().populate('bookId');
    return copies;
};

// 2. Lấy bản sao theo ID (Dòng 22 lỗi nằm ở đây)
export const getBookCopyById = async (copyId) => {
    const copy = await db.BookCopy.findById(copyId).populate('bookId');
    if (!copy) {
        // Dùng đúng constructor ApiError (không có .default)
        throw new apiError(404, 'Book copy not found');
    }
    return copy;
};

// 3. Tạo bản sao sách
export const createBookCopy = async (bookId, quantity) => {
    const book = await db.Books.findById(bookId);
    if (!book) {
        throw new apiError(404, 'Book not found to create copies');
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
        throw new apiError(400, 'Quantity must be a positive number');
    }

    const copiesToInsert = [];
    for (let i = 0; i < qty; i++) {
        copiesToInsert.push({
            bookId: bookId,
            status: 'Available'
        });
    }

    const createdCopies = await db.BookCopy.insertMany(copiesToInsert);

    return {
        message: `Successfully imported ${createdCopies.length} physical copies`,
        copies: createdCopies
    };
};

// 4. Cập nhật trạng thái bản sao (Ví dụ: available -> borrowed)
export const updateBookCopy = async (copyId, status) => {
    const updatedCopy = await db.BookCopy.findByIdAndUpdate(
        copyId,
        { status },
        { new: true, runValidators: true } // Trả về data mới sau khi update và check schema validation
    );

    if (!updatedCopy) {
        throw new apiError.default(404, 'Book copy not found');
    }

    return {
        message: 'Cập nhật trạng thái bản sao thành công',
        bookCopy: updatedCopy
    };
}

// 5. Xóa / Thanh lý bản sao theo ID
export const deleteBookCopy = async (copyId) => {
    const deletedCopy = await db.BookCopy.findByIdAndDelete(copyId);

    if (!deletedCopy) {
        throw new apiError.default(404, 'Book copy not found');
    }

    return {
        message: 'Đã xóa/thanh lý bản sao sách thành công',
        deletedCopyId: deletedCopy._id
    };
}