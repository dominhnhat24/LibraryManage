// [MODEL TIẾN ĐỘ ĐỌC] Theo dõi số lần mở chương để áp dụng quảng cáo sau mỗi ba lượt đọc.
import mongoose from 'mongoose';

// [LƯỢC ĐỒ TIẾN ĐỘ] Một bộ đếm độc lập theo tài khoản và sách giúp không trộn lượt đọc khác nhau.
const readingProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    chapters_since_ad: { type: Number, default: 0, min: 0, max: 2 },
    total_chapter_reads: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
readingProgressSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.models.ReadingProgress
    || mongoose.model('ReadingProgress', readingProgressSchema);
