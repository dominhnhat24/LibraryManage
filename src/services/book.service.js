import * as db from '../models/init.js';
import * as apiError from '../utils/api-error.js';


const getAllBooks = async () => {
    return await db.Books.find({}).sort({ createdAt: -1 });
};


const getBookById = async (bookId) => {
    const bookItem = await db.Books.findById(bookId);

    if (!bookItem) {
        throw new apiError.default(404, 'Book not found');
    }

    return bookItem;
};


const createBook = async (bookData) => {
    return await db.Books.create({
        title: bookData.title,
        author: bookData.author,
        publish_year: bookData.publish_year,
        category: bookData.category
    });
};


const updateBook = async (bookId, bookData) => {
    const bookItem = await getBookById(bookId);

    if (Object.prototype.hasOwnProperty.call(bookData, 'title')) {
        bookItem.title = bookData.title;
    }

    if (Object.prototype.hasOwnProperty.call(bookData, 'author')) {
        bookItem.author = bookData.author;
    }

    if (Object.prototype.hasOwnProperty.call(bookData, 'publish_year')) {
        bookItem.publish_year = bookData.publish_year;
    }

    if (Object.prototype.hasOwnProperty.call(bookData, 'category')) {
        bookItem.category = bookData.category;
    }

    await bookItem.save();

    return bookItem;
};

const deleteBook = async (bookId) => {
    const bookItem = await getBookById(bookId);

    // Kiểm tra xem đầu sách này còn bản sao vật lý nào trong mảng copies không
    if (bookItem.copies && bookItem.copies.length > 0) {
        throw new apiError.default(409, 'Cannot delete book because it still has physical copies in inventory');
    }

    await db.Books.findByIdAndDelete(bookId);
};

export default {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
};