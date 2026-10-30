// [MODEL CHƯƠNG SÁCH] Quản lý nội dung chi tiết theo từng chương cho Webnovel/Comic.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/chapter.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo chapterSchema nhận giá trị từ new mongoose.Schema({ book_id: { type: mongoose.Schema.. const giữ biến không gán lại; let cho phép cập nhật.
const chapterSchema = new mongoose.Schema({
    // Trường book_id lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', re làm giá trị trong object.
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    // Trường title lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // Trường slug lưu { type: String, trim: true, lowercase: true } làm giá trị trong object.
    slug: { type: String, trim: true, lowercase: true },
    // Trường content lưu { type: String, default: '', maxlength: 200000 } làm giá trị trong object.
    content: { type: String, default: '', maxlength: 200000 },
    // Trường chapter_number lưu { type: Number, required: true, min: 1 } làm giá trị trong object.
    chapter_number: { type: Number, required: true, min: 1 },
    // Trường access_level lưu { type: String, enum: ['free', 'premium', 'vip'], defau làm giá trị trong object.
    access_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free', required: true },
    // Trường published_at lưu { type: Date, default: Date.now } làm giá trị trong object.
    published_at: { type: Date, default: Date.now }
}, { timestamps: true });

// [CHỈ MỤC] Đảm bảo không bị trùng số thứ tự chương trong cùng một cuốn sách và tối ưu truy vấn
// Gọi/thực thi chapterSchema.index với các đối số để thực hiện thao tác: chapterSchema.index({ book_id: 1, chapter_number: 1 }, { unique: true })
chapterSchema.index({ book_id: 1, chapter_number: 1 }, { unique: true });
// Gọi/thực thi chapterSchema.index với các đối số để thực hiện thao tác: chapterSchema.index({ slug: 1 }, { unique: true, sparse: true })
chapterSchema.index({ slug: 1 }, { unique: true, sparse: true });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);