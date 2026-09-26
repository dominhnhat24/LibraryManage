import * as db from '../models/init.js';
import apiError from '../utils/api-error.js';
import { getPaginationAndFilter } from '../utils/apiFeatures.js';

// queryParams gồm có: filter, skip, limit, page, sort
const getAllBooks = async (queryParams) => {
    // Chỉ định các trường cho phép tìm kiếm trong bảng Books
    const { filter, skip, limit, page, sort } = getPaginationAndFilter(queryParams, ['title', 'author', 'category']);

    if (queryParams.category) {
        filter.category = queryParams.category;
    }

    const [books, total] = await Promise.all([
        db.Books.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        db.Books.countDocuments(filter)
    ]);

    return {
        data: books,
        pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit: limit
        }
    };
};


const getBookById = async (bookId) => {
    const bookItem = await db.Books.findById(bookId).populate('copies');
    if (!bookItem) {
        throw new apiError(404, 'Book not found');
    }
    return bookItem;
};


const createBook = async (bookData) => {
    return await db.Books.create({
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        publish_year: bookData.publish_year,
        category: bookData.category,
        description: bookData.description
    });
};


const updateBook = async (bookId, bookData) => {
    const bookItem = await getBookById(bookId);

    for (const field of ['isbn', 'title', 'author', 'publish_year', 'category', 'description']) {
        if (Object.prototype.hasOwnProperty.call(bookData, field)) {
            bookItem[field] = bookData[field];
        }
    }

    await bookItem.save();

    return bookItem;
};

const deleteBook = async (bookId) => {
    // 1. Kiểm tra xem đầu sách có tồn tại không (hàm getBookById đã lo việc này và ném lỗi 404 nếu không thấy)
    await getBookById(bookId);

    // 2. Dùng countDocuments để kiểm tra xem bảng BookCopy còn bản sao nào của sách này không
    const copyCount = await db.BookCopy.countDocuments({ bookId: bookId });
    
    if (copyCount > 0) {
        throw new apiError(409, 'Cannot delete book because it still has physical copies in inventory');
    }

    // 3. Nếu không còn bản sao nào, tiến hành xóa đầu sách
    await db.Books.findByIdAndDelete(bookId);
};

export default {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
};