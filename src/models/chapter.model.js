// [MODEL CHƯƠNG SÁCH] Quản lý nội dung chi tiết theo từng chương cho Webnovel/Comic.
import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: '', maxlength: 200000 },
    chapter_number: { type: Number, required: true, min: 1 },
    access_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free', required: true },
    published_at: { type: Date, default: Date.now }
}, { timestamps: true });

// [CHỈ MỤC] Đảm bảo không bị trùng số thứ tự chương trong cùng một cuốn sách và tối ưu truy vấn
chapterSchema.index({ book_id: 1, chapter_number: 1 }, { unique: true });

export default mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);