// Các trạng thái nghiệp vụ được dùng trong các Model hiện tại.
// Khai báo STATUS nhận giá trị từ Object.freeze({ BOOK: Object.freeze({ DRAFT: 'draft', P. const giữ biến không gán lại; let cho phép cập nhật.
/**
 * Tệp src/constants/status.constant.js: chứa giá trị cố định dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
export const STATUS = Object.freeze({
    // Trường BOOK lưu Object.freeze({ DRAFT: 'draft', PUBLISHED: 'published'  làm giá trị trong object.
    BOOK: Object.freeze({
        // Trường DRAFT lưu 'draft' làm giá trị trong object.
        DRAFT: 'draft',
        // Trường PUBLISHED lưu 'published' làm giá trị trong object.
        PUBLISHED: 'published'
    }),
    // Trường SUBSCRIPTION lưu Object.freeze({ PENDING: 'pending', ACTIVE: 'active', R làm giá trị trong object.
    SUBSCRIPTION: Object.freeze({
        // Trường PENDING lưu 'pending' làm giá trị trong object.
        PENDING: 'pending',
        // Trường ACTIVE lưu 'active' làm giá trị trong object.
        ACTIVE: 'active',
        // Trường REJECTED lưu 'rejected' làm giá trị trong object.
        REJECTED: 'rejected',
        // Trường EXPIRED lưu 'expired' làm giá trị trong object.
        EXPIRED: 'expired'
    }),
    // Trường REPORT lưu Object.freeze({ OPEN: 'open', IN_PROGRESS: 'in_progress làm giá trị trong object.
    REPORT: Object.freeze({
        // Trường OPEN lưu 'open' làm giá trị trong object.
        OPEN: 'open',
        // Trường IN_PROGRESS lưu 'in_progress' làm giá trị trong object.
        IN_PROGRESS: 'in_progress',
        // Trường RESOLVED lưu 'resolved' làm giá trị trong object.
        RESOLVED: 'resolved'
    })
});
