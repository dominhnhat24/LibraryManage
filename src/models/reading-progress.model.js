// [MODEL TIẾN ĐỘ ĐỌC] Theo dõi lượt đọc và mốc quảng cáo theo tài khoản/sách.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/reading-progress.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// [LƯỢC ĐỒ TIẾN ĐỘ] Một bộ đếm độc lập theo tài khoản và sách giúp không trộn lượt đọc khác nhau.
// Khai báo readingProgressSchema nhận giá trị từ new mongoose.Schema({ user: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const readingProgressSchema = new mongoose.Schema({
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Trường book lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', re làm giá trị trong object.
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    // Trường chapters_since_ad lưu { type: Number, default: 0, min: 0, max: 5 } làm giá trị trong object.
    chapters_since_ad: { type: Number, default: 0, min: 0, max: 5 },
    // Trường total_chapter_reads lưu { type: Number, default: 0, min: 0 } làm giá trị trong object.
    total_chapter_reads: { type: Number, default: 0, min: 0 },
    // Trường completed_chapter_ids lưu [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' làm giá trị trong object.
    completed_chapter_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    // Trường completed_chapter_count lưu { type: Number, default: 0, min: 0 } làm giá trị trong object.
    completed_chapter_count: { type: Number, default: 0, min: 0 },
    // Trường completed_chapters_since_ad lưu { type: Number, default: 0, min: 0, max: 5 } làm giá trị trong object.
    completed_chapters_since_ad: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });
// Gọi/thực thi readingProgressSchema.index với các đối số để thực hiện thao tác: readingProgressSchema.index({ user: 1, book: 1 }, { unique: true })
readingProgressSchema.index({ user: 1, book: 1 }, { unique: true });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.ReadingProgress
    || mongoose.model('ReadingProgress', readingProgressSchema);
