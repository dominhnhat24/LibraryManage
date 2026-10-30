// [CONTROLLER TẢI NGOẠI TUYẾN] Trả tệp sách riêng tư sau khi middleware xác nhận quyền VIP.
// Import Book từ ../models/book.model.js để dùng trong module.
/**
 * Tệp src/controllers/download.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Book from '../models/book.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { resolvePrivateBookFile } từ ../utils/private-book-storage.js để dùng trong module.
import { resolvePrivateBookFile } from '../utils/private-book-storage.js';
// Import { recordReadingOpen } từ ../services/reading-progress.service.js để dùng trong module.
import { recordReadingOpen } from '../services/reading-progress.service.js';

// [PHÁT TỆP BẢO MẬT] Không lộ đường dẫn lưu trữ; buộc tải file và cấm cache/sniff nội dung.
// Khai báo downloadBook nhận giá trị từ asyncHandler(async (req, res, next) => { const book = a. const giữ biến không gán lại; let cho phép cập nhật.
export const downloadBook = asyncHandler(async (req, res, next) => {
    // Khai báo book nhận giá trị từ await Book.findOne({ _id: req.params.bookId, status: 'p. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' })
        .select('+file_key +file_original_name');
    // if chỉ chạy nhánh này khi điều kiện !book || !book.file_key đúng.
    if (!book || !book.file_key) throw new ApiError(404, 'Book file not found');
    // Khai báo filePath nhận giá trị từ await resolvePrivateBookFile(book.file_key). const giữ biến không gán lại; let cho phép cập nhật.
    const filePath = await resolvePrivateBookFile(book.file_key);
    // Khai báo safeName nhận giá trị từ `${book.title.replace(/[^\p{L}\p{N}._ -]/gu, '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const safeName = `${book.title.replace(/[^\p{L}\p{N}._ -]/gu, '').trim() || 'openbook'}`
        + `${book.file_original_name ? `-${book.file_original_name.replace(/[^A-Za-z0-9._-]/g, '')}` : ''}`;
    // Khai báo headers nhận giá trị từ { 'Cache-Control': 'private, no-store, no-cache, must-r. const giữ biến không gán lại; let cho phép cập nhật.
    const headers = {
        // Trường 'Cache-Control' lưu 'private, no-store, no-cache, must-revalidate' làm giá trị trong object.
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        // Trường Pragma lưu 'no-cache' làm giá trị trong object.
        Pragma: 'no-cache',
        // Trường 'X-Content-Type-Options' lưu 'nosniff' làm giá trị trong object.
        'X-Content-Type-Options': 'nosniff'
    };
    // return kết thúc hàm và trả res.download(filePath, safeName, { headers }, (error) => { if (error) { if  về nơi gọi.
    return res.download(filePath, safeName, { headers }, (error) => {
        // if chỉ chạy nhánh này khi điều kiện error đúng.
        if (error) {
            // if chỉ chạy nhánh này khi điều kiện res.headersSent đúng.
            if (res.headersSent) return next(error);
            // return kết thúc hàm và trả next(new ApiError(404, 'Book file could not be delivered')) về nơi gọi.
            return next(new ApiError(404, 'Book file could not be delivered'));
        }
        // return kết thúc hàm và trả undefined về nơi gọi.
        return undefined;
    });
});

// [PHÁT NỘI DUNG TRỰC TUYẾN] Stream file inline sau khi đã qua xác thực và kiểm tra quyền đọc sách.
// Khai báo streamBook nhận giá trị từ asyncHandler(async (req, res, next) => { const book = r. const giữ biến không gán lại; let cho phép cập nhật.
export const streamBook = asyncHandler(async (req, res, next) => {
    // Khai báo book nhận giá trị từ req.book. const giữ biến không gán lại; let cho phép cập nhật.
    const book = req.book;
    // if chỉ chạy nhánh này khi điều kiện !book?.file_key đúng.
    if (!book?.file_key) throw new ApiError(404, 'Book content file not found');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await recordReadingOpen(req.authUser?._id, book._id, null, 'file_open').cat
    await recordReadingOpen(req.authUser?._id, book._id, null, 'file_open').catch((error) => {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('HarveyBook could not save PDF-open progress:', error?.messag
        console.error('HarveyBook could not save PDF-open progress:', error?.message || error);
    });
    // Khai báo filePath nhận giá trị từ await resolvePrivateBookFile(book.file_key). const giữ biến không gán lại; let cho phép cập nhật.
    const filePath = await resolvePrivateBookFile(book.file_key);
    // Khai báo headers nhận giá trị từ { 'Cache-Control': 'private, no-store, no-cache, must-r. const giữ biến không gán lại; let cho phép cập nhật.
    const headers = {
        // Trường 'Cache-Control' lưu 'private, no-store, no-cache, must-revalidate' làm giá trị trong object.
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        // Trường Pragma lưu 'no-cache' làm giá trị trong object.
        Pragma: 'no-cache',
        // Trường 'X-Content-Type-Options' lưu 'nosniff' làm giá trị trong object.
        'X-Content-Type-Options': 'nosniff',
        // Trường 'Content-Disposition' lưu 'inline' làm giá trị trong object.
        'Content-Disposition': 'inline'
    };
    // return kết thúc hàm và trả res.sendFile(filePath, { headers }, (error) => { if (error) { if (res.heade về nơi gọi.
    return res.sendFile(filePath, { headers }, (error) => {
        // if chỉ chạy nhánh này khi điều kiện error đúng.
        if (error) {
            // if chỉ chạy nhánh này khi điều kiện res.headersSent đúng.
            if (res.headersSent) return next(error);
            // return kết thúc hàm và trả next(new ApiError(404, 'Book content could not be delivered')) về nơi gọi.
            return next(new ApiError(404, 'Book content could not be delivered'));
        }
        // return kết thúc hàm và trả undefined về nơi gọi.
        return undefined;
    });
});
