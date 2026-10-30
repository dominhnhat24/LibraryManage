// [CONTROLLER IMPORT] Chỉ expose tìm kiếm/import cho route admin đã được bảo vệ bằng verifyToken + requireAdmin.
// Import path từ node:path để dùng trong module.
/**
 * Tệp src/controllers/book-import.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import path from 'node:path';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { resolvePrivateBookFile } từ ../utils/private-book-storage.js để dùng trong module.
import { resolvePrivateBookFile } from '../utils/private-book-storage.js';
// Import { importWikisourceBook, searchWikisourceBooks } từ ../services/book-import.service.js để dùng trong module.
import { importWikisourceBook, searchWikisourceBooks } from '../services/book-import.service.js';
// Import { toBookDto } từ ../utils/api-dto.js để dùng trong module.
import { toBookDto } from '../utils/api-dto.js';

// Khai báo searchBookImportCandidates nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const searchBookImportCandidates = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await searchWikisourceBooks(req.query.q). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await searchWikisourceBooks(req.query.q);
    // return kết thúc hàm và trả res.json({ status: 'success', data: result }) về nơi gọi.
    return res.json({ status: 'success', data: result });
});

// Khai báo importBookCandidate nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const importBookCandidate = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await importWikisourceBook({ pageTitle: req.body.pageTi. const giữ biến không gán lại; let cho phép cập nhật.
    const result = await importWikisourceBook({
        // Trường pageTitle lưu req.body.pageTitle làm giá trị trong object.
        pageTitle: req.body.pageTitle,
        // Trường ownerId lưu req.authUser._id làm giá trị trong object.
        ownerId: req.authUser._id,
        // Trường confirmLicense lưu req.body.confirmLicense làm giá trị trong object.
        confirmLicense: req.body.confirmLicense,
        // Trường confirmCover lưu req.body.confirmCover làm giá trị trong object.
        confirmCover: req.body.confirmCover
    });
    // if chỉ chạy nhánh này khi điều kiện result.status === 'duplicate' đúng.
    if (result.status === 'duplicate') {
        // return kết thúc hàm và trả res.status(200).json({ status: 'success', message: 'Sách đã tồn tại, không  về nơi gọi.
        return res.status(200).json({
            // Trường status lưu 'success' làm giá trị trong object.
            status: 'success', message: 'Sách đã tồn tại, không tạo bản ghi trùng.',
            // Trường data lưu { status: result.status, book: result.book } làm giá trị trong object.
            data: { status: result.status, book: result.book }
        });
    }
    // Khai báo book nhận giá trị từ result.status === 'imported' ? await Book.findById(resu. const giữ biến không gán lại; let cho phép cập nhật.
    const book = result.status === 'imported' ? await Book.findById(result.book._id).lean() : result.book;
    // return kết thúc hàm và trả res.status(result.status === 'imported' ? 201 : 200).json({ status: 'succes về nơi gọi.
    return res.status(result.status === 'imported' ? 201 : 200).json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường message lưu result.status === 'imported' ? 'Đã xác minh và import s làm giá trị trong object.
        message: result.status === 'imported' ? 'Đã xác minh và import sách thành công.' : 'Sách này đã được import trước đó.',
        // Trường data lưu { status: result.status, book: toBookDto(book) } làm giá trị trong object.
        data: { status: result.status, book: toBookDto(book) }
    });
});

// [BÌA CÔNG KHAI] Chỉ phục vụ bìa local của sách đã xuất bản, không lộ fileKey hay đường dẫn storage.
// Khai báo getImportedBookCover nhận giá trị từ asyncHandler(async (req, res, next) => { const book = a. const giữ biến không gán lại; let cho phép cập nhật.
export const getImportedBookCover = asyncHandler(async (req, res, next) => {
    // Khai báo book nhận giá trị từ await Book.findOne({ _id: req.params.bookId, status: 'p. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' }).select('+cover_file_key');
    // if chỉ chạy nhánh này khi điều kiện !book?.cover_file_key đúng.
    if (!book?.cover_file_key) throw new ApiError(404, 'Book cover not found');
    // Khai báo filePath nhận giá trị từ await resolvePrivateBookFile(book.cover_file_key). const giữ biến không gán lại; let cho phép cập nhật.
    const filePath = await resolvePrivateBookFile(book.cover_file_key);
    // Khai báo extension nhận giá trị từ path.extname(filePath).toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const extension = path.extname(filePath).toLowerCase();
    // Khai báo contentType nhận giá trị từ extension === '.png' ? 'image/png' : extension === '.jp. const giữ biến không gán lại; let cho phép cập nhật.
    const contentType = extension === '.png' ? 'image/png' : extension === '.jpg' ? 'image/jpeg' : null;
    // if chỉ chạy nhánh này khi điều kiện !contentType đúng.
    if (!contentType) throw new ApiError(404, 'Book cover not found');
    // Gọi/thực thi res.type với các đối số để thực hiện thao tác: res.type(contentType)
    res.type(contentType);
    // return kết thúc hàm và trả res.sendFile(filePath, { headers: { 'Cache-Control': 'public, max-age=86400 về nơi gọi.
    return res.sendFile(filePath, {
        // Trường headers lưu { 'Cache-Control': 'public, max-age=86400', 'X-Content- làm giá trị trong object.
        headers: {
            // Trường 'Cache-Control' lưu 'public, max-age=86400' làm giá trị trong object.
            'Cache-Control': 'public, max-age=86400',
            // Trường 'X-Content-Type-Options' lưu 'nosniff' làm giá trị trong object.
            'X-Content-Type-Options': 'nosniff',
            // Public cover images are embedded by the separate Vite/API origins during local development.
            // Trường 'Cross-Origin-Resource-Policy' lưu 'cross-origin' làm giá trị trong object.
            'Cross-Origin-Resource-Policy': 'cross-origin',
        }
    }, (error) => {
        // if chỉ chạy nhánh này khi điều kiện error đúng.
        if (error) {
            // if chỉ chạy nhánh này khi điều kiện res.headersSent đúng.
            if (res.headersSent) return next(error);
            // return kết thúc hàm và trả next(new ApiError(404, 'Book cover could not be delivered')) về nơi gọi.
            return next(new ApiError(404, 'Book cover could not be delivered'));
        }
        // return kết thúc hàm và trả undefined về nơi gọi.
        return undefined;
    });
});
