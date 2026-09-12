import BookService from '../services/book.service.js';
import asyncHandler from '../middlewares/async-handler.js';
import successResponse  from '../utils/api.response.js';

export const getAllBooks = asyncHandler(async (req, res) => {
    const books = await BookService.getAllBooks();
    return successResponse(res, {
        message: 'Books retrieved successfully',
        data: books
    });
});

export const getBookById = asyncHandler(async (req, res) => {
    const book = await BookService.getBookById(req.params.id);
    return successResponse(res, {
        message: 'Book retrieved successfully',
        data: book
    });
});

export const createBook = asyncHandler(async (req, res) => {
    const book = await BookService.createBook(req.body);
    return successResponse(res, {
        statusCode: 201,
        message: 'Book created successfully',
        data: book
    });
});

export const updateBook = asyncHandler(async (req, res) => {
    const updatedBook = await BookService.updateBook(req.params.id, req.body);

    return successResponse(res, {
        message: 'Book updated successfully',
        data: updatedBook
    });
});

export const deleteBook = asyncHandler(async (req, res) => {
    await BookService.deleteBook(req.params.id);
    return successResponse(res, {
        message: 'Book deleted successfully',
        data: null
    });
});

