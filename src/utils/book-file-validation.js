// Import { extname } từ node:path để dùng trong module.
/**
 * Tệp src/utils/book-file-validation.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { extname } from 'node:path';
// Import ApiError từ ./api-error.js để dùng trong module.
import ApiError from './api-error.js';

// Khai báo MIME_TYPES nhận giá trị từ Object.freeze({ '.epub': ['application/epub+zip', 'appl. const giữ biến không gán lại; let cho phép cập nhật.
const MIME_TYPES = Object.freeze({
    // Trường '.epub' lưu ['application/epub+zip', 'application/zip'] làm giá trị trong object.
    '.epub': ['application/epub+zip', 'application/zip'],
    // Trường '.pdf' lưu ['application/pdf'] làm giá trị trong object.
    '.pdf': ['application/pdf'],
    // Trường '.mp3' lưu ['audio/mpeg', 'audio/mp3'] làm giá trị trong object.
    '.mp3': ['audio/mpeg', 'audio/mp3'],
    // Trường '.m4a' lưu ['audio/mp4', 'audio/x-m4a'] làm giá trị trong object.
    '.m4a': ['audio/mp4', 'audio/x-m4a'],
    // Trường '.mp4' lưu ['video/mp4', 'audio/mp4'] làm giá trị trong object.
    '.mp4': ['video/mp4', 'audio/mp4'],
    // Trường '.webm' lưu ['video/webm', 'audio/webm'] làm giá trị trong object.
    '.webm': ['video/webm', 'audio/webm']
});

// Khai báo categoryExtensions nhận giá trị từ Object.freeze({ ebook: ['.epub', '.pdf'], audiobook: ['. const giữ biến không gán lại; let cho phép cập nhật.
const categoryExtensions = Object.freeze({
    // Trường ebook lưu ['.epub', '.pdf'] làm giá trị trong object.
    ebook: ['.epub', '.pdf'],
    // Trường audiobook lưu ['.mp3', '.m4a'] làm giá trị trong object.
    audiobook: ['.mp3', '.m4a'],
    // Trường comic lưu ['.pdf', '.epub', '.mp4', '.webm'] làm giá trị trong object.
    comic: ['.pdf', '.epub', '.mp4', '.webm'],
    // Trường webnovel lưu ['.pdf', '.epub'] làm giá trị trong object.
    webnovel: ['.pdf', '.epub']
});

// Hàm hasValidSignature: Kiểm tra magic bytes của file để không tin riêng extension/MIME do client gửi.
/**
 * Hàm hasValidSignature: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: buffer, extension.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isBuffer, subarray, toString, includes, from, equals.
 */
const hasValidSignature = (buffer, extension) => {
    // if chỉ chạy nhánh này khi điều kiện !Buffer.isBuffer(buffer) đúng.
    if (!Buffer.isBuffer(buffer)) return false;
    // if chỉ chạy nhánh này khi điều kiện extension === '.pdf' đúng.
    if (extension === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    // if chỉ chạy nhánh này khi điều kiện extension === '.epub' đúng.
    if (extension === '.epub') {
        // return kết thúc hàm và trả buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer.in về nơi gọi.
        return buffer.length >= 4
            && buffer[0] === 0x50 && buffer[1] === 0x4b
            && buffer.includes(Buffer.from('mimetype'))
            && buffer.includes(Buffer.from('application/epub+zip'));
    }
    // if chỉ chạy nhánh này khi điều kiện extension === '.mp3' đúng.
    if (extension === '.mp3') {
        // return kết thúc hàm và trả buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer.length >= 2 && về nơi gọi.
        return buffer.subarray(0, 3).toString('ascii') === 'ID3'
            || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    }
    // if chỉ chạy nhánh này khi điều kiện ['.m4a', '.mp4'].includes(extension) đúng.
    if (['.m4a', '.mp4'].includes(extension)) {
        // return kết thúc hàm và trả buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp' về nơi gọi.
        return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    }
    // if chỉ chạy nhánh này khi điều kiện extension === '.webm' đúng.
    if (extension === '.webm') {
        // return kết thúc hàm và trả buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, về nơi gọi.
        return buffer.length >= 4
            && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    // return kết thúc hàm và trả false về nơi gọi.
    return false;
};

// Hàm validateBookFile: Đối chiếu loại file, MIME, danh mục sách và signature trước khi ghi vào kho riêng.
/**
 * Hàm validateBookFile: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { buffer, originalname, mimetype, catego.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: extname, String, toLowerCase, includes, ApiError, hasValidSignature.
 */
export const validateBookFile = ({ buffer, originalname, mimetype, category }) => {
    // Khai báo extension nhận giá trị từ extname(String(originalname || '')).toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const extension = extname(String(originalname || '')).toLowerCase();
    // Khai báo acceptedMimeTypes nhận giá trị từ MIME_TYPES[extension]. const giữ biến không gán lại; let cho phép cập nhật.
    const acceptedMimeTypes = MIME_TYPES[extension];
    // if chỉ chạy nhánh này khi điều kiện !acceptedMimeTypes || !acceptedMimeTypes.includes(String(mimetype || '').to đúng.
    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(String(mimetype || '').toLowerCase())) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'File extension and MIME type are not supported');
    }
    // if chỉ chạy nhánh này khi điều kiện categoryExtensions[category] && !categoryExtensions[category].includes(exte đúng.
    if (categoryExtensions[category] && !categoryExtensions[category].includes(extension)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'File type does not match the book category');
    }
    // if chỉ chạy nhánh này khi điều kiện !hasValidSignature(buffer, extension) đúng.
    if (!hasValidSignature(buffer, extension)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Uploaded file content does not match its declared file type');
    }
    // return kết thúc hàm và trả extension về nơi gọi.
    return extension;
};
