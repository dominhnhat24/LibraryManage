const db = require('../../models');
const ApiError = require('../utils/api-error');

const getAllBooks = async () => {
    return await db.Books.findAll({
        order: [['book_id', 'ASC']]
    });
};

const getBookById = async (bookId) => {
    const bookItem = await db.Books.findByPk(bookId);

    if (!bookItem) {
        throw new ApiError(404, 'Book not found');
    }

    return bookItem;
};

const createBook = async (bookData) => {
    return await db.Books.create({
        book_name: bookData.book_name,
        author: bookData.author,
        isbn: bookData.isbn
    });
};

const updateBook = async (bookId, bookData) => {
    const bookItem = await getBookById(bookId);
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(bookData, 'book_name')) {
        updateData.book_name = bookData.book_name;
    }

    if (Object.prototype.hasOwnProperty.call(bookData, 'author')) {
        updateData.author = bookData.author;
    }

    if (Object.prototype.hasOwnProperty.call(bookData, 'isbn')) {
        updateData.isbn = bookData.isbn;
    }

    await bookItem.update(updateData);

    return bookItem;
};

const deleteBook = async (bookId) => {
    const bookItem = await getBookById(bookId);
    await bookItem.destroy();
};

    if (enrollmentCount > 0) {
        throw new ApiError(409, 'Cannot delete book because it still has enrollments');
    }

    await bookItem.destroy();
};



module.exports = {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
}