// [CONTROLLER IMPORT] Chỉ expose tìm kiếm/import cho route admin đã được bảo vệ bằng verifyToken + requireAdmin.
import path from 'node:path';
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { resolvePrivateBookFile } from '../utils/private-book-storage.js';
import { importWikisourceBook, searchWikisourceBooks } from '../services/book-import.service.js';
import { toBookDto } from '../utils/api-dto.js';

export const searchBookImportCandidates = asyncHandler(async (req, res) => {
    const result = await searchWikisourceBooks(req.query.q);
    return res.json({ status: 'success', data: result });
});

export const importBookCandidate = asyncHandler(async (req, res) => {
    const result = await importWikisourceBook({
        pageTitle: req.body.pageTitle,
        ownerId: req.authUser._id,
        confirmLicense: req.body.confirmLicense,
        confirmCover: req.body.confirmCover
    });
    if (result.status === 'duplicate') {
        return res.status(200).json({
            status: 'success', message: 'Sách đã tồn tại, không tạo bản ghi trùng.',
            data: { status: result.status, book: result.book }
        });
    }
    const book = result.status === 'imported' ? await Book.findById(result.book._id).lean() : result.book;
    return res.status(result.status === 'imported' ? 201 : 200).json({
        status: 'success',
        message: result.status === 'imported' ? 'Đã xác minh và import sách thành công.' : 'Sách này đã được import trước đó.',
        data: { status: result.status, book: toBookDto(book) }
    });
});

// [BÌA CÔNG KHAI] Chỉ phục vụ bìa local của sách đã xuất bản, không lộ fileKey hay đường dẫn storage.
export const getImportedBookCover = asyncHandler(async (req, res, next) => {
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' }).select('+cover_file_key');
    if (!book?.cover_file_key) throw new ApiError(404, 'Book cover not found');
    const filePath = await resolvePrivateBookFile(book.cover_file_key);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = extension === '.png' ? 'image/png' : extension === '.jpg' ? 'image/jpeg' : null;
    if (!contentType) throw new ApiError(404, 'Book cover not found');
    res.type(contentType);
    return res.sendFile(filePath, {
        headers: {
            'Cache-Control': 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff',
            // Public cover images are embedded by the separate Vite/API origins during local development.
            'Cross-Origin-Resource-Policy': 'cross-origin',
        }
    }, (error) => {
        if (error) {
            if (res.headersSent) return next(error);
            return next(new ApiError(404, 'Book cover could not be delivered'));
        }
        return undefined;
    });
});
