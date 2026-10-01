// Cung cấp chuẩn hóa email và truy vấn duy nhất email trên cả hai loại tài khoản.
import { Librarians, Readers } from '../models/init.js';

// Escape ký tự đặc biệt trước khi đưa chuỗi email vào biểu thức chính quy.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Nhận email dạng chuỗi và trả dạng đã bỏ khoảng trắng ngoài, viết thường.
export const normalizeEmail = (email) => email.trim().toLowerCase();

// Nhận email và trả biểu thức khớp chính xác, không phân biệt hoa thường.
export const emailLookupPattern = (email) => new RegExp(`^${escapeRegex(normalizeEmail(email))}$`, 'i');

// Nhận email cùng ID tùy chọn cần loại trừ; kiểm tra song song độc giả/thủ thư và trả boolean.
// Chỉ đọc MongoDB; email được chuyển thành regex chính xác trước khi truy vấn.
export const emailInUse = async (email, { excludeReaderId, excludeLibrarianId } = {}) => {
    const emailPattern = emailLookupPattern(email);
    const [reader, librarian] = await Promise.all([
        Readers.exists({
            email: emailPattern,
            ...(excludeReaderId ? { _id: { $ne: excludeReaderId } } : {})
        }),
        Librarians.exists({
            email: emailPattern,
            ...(excludeLibrarianId ? { _id: { $ne: excludeLibrarianId } } : {})
        })
    ]);
    return Boolean(reader || librarian);
};
