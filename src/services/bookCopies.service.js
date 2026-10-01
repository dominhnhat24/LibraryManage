// Quản lý các bản sao vật lý của đầu sách, bao gồm tra cứu, nhập kho, đổi trạng thái và thanh lý.
import * as db from '../models/init.js';
import apiError from '../utils/api-error.js';

// 1. Lấy tất cả bản sao
// Nhận bookId tùy chọn; truy vấn và populate đầu sách liên quan, trả danh sách tài liệu.
export const getAllBookCopies = async (bookId) => {
    const filter = bookId ? { bookId } : {};
    const copies = await db.BookCopy.find(filter).populate('bookId');
    /* .populate là một tính năng join dùng để kết nối các value của một dữ liệu theo id trong một trường 
       dữ liệu */
    return copies;
};

// Nhận ID bản sao; trả tài liệu có đầu sách liên kết hoặc ném ApiError 404.
export const getBookCopyById = async (copyId) => {
    const copy = await db.BookCopy.findById(copyId).populate('bookId');
    if (!copy) {
        // Dùng đúng constructor ApiError (không có .default)
        throw new apiError(404, 'Book copy not found');
    }
    return copy;
};

// 3. Tạo bản sao sách
// Nhận ID đầu sách và số lượng; xác minh đầu sách/số lượng, chèn bản sao Available và trả kết quả nhập kho.
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
// Nhận ID bản sao và trạng thái mới; không cho đổi bản sao đang mượn, lưu và trả thông báo cùng tài liệu.
export const updateBookCopy = async (copyId, status) => {
    const copy = await db.BookCopy.findById(copyId);
    if (!copy) {
        throw new apiError(404, 'Book copy not found');
    }
    if (copy.status === 'Borrowed') {
        throw new apiError(409, 'Borrowed book copies can only be changed through the borrow return workflow');
    }

    copy.status = status;
    const updatedCopy = await copy.save();

    return {
        message: 'Cập nhật trạng thái bản sao thành công',
        bookCopy: updatedCopy
    };
}

// 5. Xóa / Thanh lý bản sao theo ID
// Nhận ID bản sao; từ chối bản sao đang mượn, nếu hợp lệ thì xóa và trả ID bản sao đã xóa.
export const deleteBookCopy = async (copyId) => {
    const copy = await db.BookCopy.findById(copyId);
    if (!copy) {
        throw new apiError(404, 'Book copy not found');
    }
    if (copy.status === 'Borrowed') {
        throw new apiError(409, 'Borrowed book copies cannot be deleted');
    }

    await copy.deleteOne();

    return {
        message: 'Đã xóa/thanh lý bản sao sách thành công',
        deletedCopyId: copy._id
    };
};