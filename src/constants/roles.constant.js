// Vai trò phân quyền API duy nhất; quyền thuê bao VIP/Premium được lưu riêng trên User.
// Khai báo ROLES nhận giá trị từ Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' }). const giữ biến không gán lại; let cho phép cập nhật.
/**
 * Tệp src/constants/roles.constant.js: chứa giá trị cố định dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
export const ROLES = Object.freeze({
    // Trường ADMIN lưu 'ADMIN' làm giá trị trong object.
    ADMIN: 'ADMIN',
    // Trường USER lưu 'USER' làm giá trị trong object.
    USER: 'USER'
});
