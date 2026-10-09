// [CONTROLLER TẢI NGOẠI TUYẾN] Trả tệp sách riêng tư sau khi middleware xác nhận quyền VIP.
import Book from '../models/book.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { resolvePrivateBookFile } from '../utils/private-book-storage.js';

// [PHÁT TỆP BẢO MẬT] Không lộ đường dẫn lưu trữ; buộc tải file và cấm cache/sniff nội dung.
export const downloadBook = asyncHandler(async (req, res, next) => {
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' })
        .select('+file_key +file_original_name');
    if (!book || !book.file_key) throw new ApiError(404, 'Book file not found');
    const filePath = await resolvePrivateBookFile(book.file_key);
    const safeName = `${book.title.replace(/[^\p{L}\p{N}._ -]/gu, '').trim() || 'openbook'}`
        + `${book.file_original_name ? `-${book.file_original_name.replace(/[^A-Za-z0-9._-]/g, '')}` : ''}`;
    const headers = {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    };
    return res.download(filePath, safeName, { headers }, (error) => {
        if (error) {
            if (res.headersSent) return next(error);
            return next(new ApiError(404, 'Book file could not be delivered'));
        }
        return undefined;
    });
});

// [PHÁT NỘI DUNG TRỰC TUYẾN] Stream file inline sau khi đã qua xác thực và kiểm tra quyền đọc sách.
export const streamBook = asyncHandler(async (req, res, next) => {
    const book = req.book;
    if (!book?.file_key) throw new ApiError(404, 'Book content file not found');
    const filePath = await resolvePrivateBookFile(book.file_key);
    const headers = {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'X-OpenBook-Show-Ad': String(req.adDecision?.showAd === true),
        'X-OpenBook-Ad-Reason': req.adDecision?.reason || 'unavailable'
    };
    return res.sendFile(filePath, { headers }, (error) => {
        if (error) {
            if (res.headersSent) return next(error);
            return next(new ApiError(404, 'Book content could not be delivered'));
        }
        return undefined;
    });
});
