// Giới hạn phân trang mặc định cho các danh sách API.
// Khai báo PAGINATION nhận giá trị từ Object.freeze({ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX. const giữ biến không gán lại; let cho phép cập nhật.
/**
 * Tệp src/constants/pagination.constant.js: chứa giá trị cố định dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
export const PAGINATION = Object.freeze({
    // Trường DEFAULT_PAGE lưu 1 làm giá trị trong object.
    DEFAULT_PAGE: 1,
    // Trường DEFAULT_LIMIT lưu 20 làm giá trị trong object.
    DEFAULT_LIMIT: 20,
    // Trường MAX_LIMIT lưu 50 làm giá trị trong object.
    MAX_LIMIT: 50
});
