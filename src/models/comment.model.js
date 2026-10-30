// [MODEL BÌNH LUẬN] Lưu bình luận/đánh giá thuộc một sách và một tài khoản đã xác thực.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/comment.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// [LƯỢC ĐỒ BÌNH LUẬN] Mỗi người dùng chỉ có một đánh giá cho một cuốn sách.
// Khai báo commentSchema nhận giá trị từ new mongoose.Schema({ book: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const commentSchema = new mongoose.Schema({
    // Trường book lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', re làm giá trị trong object.
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Trường body lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    // Trường rating lưu { type: Number, min: 1, max: 5, default: null } làm giá trị trong object.
    rating: { type: Number, min: 1, max: 5, default: null }
}, { timestamps: true });
// Gọi/thực thi commentSchema.index với các đối số để thực hiện thao tác: commentSchema.index({ book: 1, user: 1 }, { unique: true })
commentSchema.index({ book: 1, user: 1 }, { unique: true });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
