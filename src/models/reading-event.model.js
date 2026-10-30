// [MODEL LỊCH SỬ ĐỌC] Tách lượt mở nội dung khỏi chương được người dùng đánh dấu hoàn thành.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/reading-event.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo readingEventSchema nhận giá trị từ new mongoose.Schema({ user: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const readingEventSchema = new mongoose.Schema({
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Trường book lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', re làm giá trị trong object.
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    // Trường chapter lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', làm giá trị trong object.
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', default: null },
    // Trường action lưu { type: String, enum: ['chapter', 'file', 'chapter_open làm giá trị trong object.
    action: { type: String, enum: ['chapter', 'file', 'chapter_open', 'file_open', 'chapter_complete'], required: true, default: 'chapter' }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Gọi/thực thi readingEventSchema.index với các đối số để thực hiện thao tác: readingEventSchema.index({ createdAt: -1 })
readingEventSchema.index({ createdAt: -1 });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.ReadingEvent
    || mongoose.model('ReadingEvent', readingEventSchema);
