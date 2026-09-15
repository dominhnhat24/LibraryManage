import * as db from '../models/init.js';
import * as apiError from '../utils/api-error.js';


export const createBookCopy = async (bookId, quantity) => {
    const book = await db.Book.findByPk(bookId);
    // Kiểm tra xem đầu sách có tồn tại không
    if(!book) {
        throw new apiError.default(404, 'Book not found');
    }

    // Tạo các bản sao vật lý mới
    const newCopies = [];
    for (let i = 0; i < quantity; i++) {
        const newCopy = await db.BookCopy.create({
            bookId: book.id,
            status: 'available' // Trạng thái mặc định là "available"
        });
        newCopies.push(newCopy);
    }

    // Cập nhật mảng copies của đầu sách
    const createdCopies = await db.Books_Copies.insertMany(copiesToInsert);

    return {
        message: `Đã nhập kho thành công ${quantity} bản sao cho sách: ${book.title}`,
        copies: createdCopies
    }
};