// Khai báo SUPPORTED_READER_FORMATS nhận giá trị từ new Set(['PDF', 'EPUB']). const giữ biến không gán lại; let cho phép cập nhật.
/**
 * Tệp src/utils/book-reader-mode.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
const SUPPORTED_READER_FORMATS = new Set(['PDF', 'EPUB']);

// Choose the reader from actual available content plus its stored file metadata.
// EPUB is recognized as a source format but the current web app has no EPUB reader.
/**
 * Hàm resolveBookReaderMode: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { file_format, file_key, hasReadableChap.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, toUpperCase, has.
 */
export const resolveBookReaderMode = ({ file_format, file_key, hasReadableChapters }) => {
    // if chỉ chạy nhánh này khi điều kiện hasReadableChapters đúng.
    if (hasReadableChapters) return 'chapters';
    // if chỉ chạy nhánh này khi điều kiện !file_key đúng.
    if (!file_key) return 'unavailable';

    // Khai báo format nhận giá trị từ String(file_format || '').trim().toUpperCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const format = String(file_format || '').trim().toUpperCase();
    // if chỉ chạy nhánh này khi điều kiện format === 'PDF' đúng.
    if (format === 'PDF') return 'pdf';
    // if chỉ chạy nhánh này khi điều kiện format === 'EPUB' đúng.
    if (format === 'EPUB') return 'unsupported';
    // if chỉ chạy nhánh này khi điều kiện SUPPORTED_READER_FORMATS.has(format) đúng.
    if (SUPPORTED_READER_FORMATS.has(format)) return 'unsupported';
    // return kết thúc hàm và trả 'unavailable' về nơi gọi.
    return 'unavailable';
};
