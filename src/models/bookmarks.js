// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/bookmarks.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo bookmarkSchema nhận giá trị từ new mongoose.Schema({ user: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const bookmarkSchema = new mongoose.Schema({
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Trường book lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', re làm giá trị trong object.
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    // Trường chapter lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', làm giá trị trong object.
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true }
}, { timestamps: true });

// Gọi/thực thi bookmarkSchema.index với các đối số để thực hiện thao tác: bookmarkSchema.index({ user: 1, book: 1 }, { unique: true })
bookmarkSchema.index({ user: 1, book: 1 }, { unique: true });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

