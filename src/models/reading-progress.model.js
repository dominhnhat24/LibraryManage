// [MODEL TIẾN ĐỘ ĐỌC] Theo dõi lượt đọc và mốc quảng cáo theo tài khoản/sách.
import mongoose from 'mongoose';

// [LƯỢC ĐỒ TIẾN ĐỘ] Một bộ đếm độc lập theo tài khoản và sách giúp không trộn lượt đọc khác nhau.
const readingProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    chapters_since_ad: { type: Number, default: 0, min: 0, max: 5 },
    total_chapter_reads: { type: Number, default: 0, min: 0 },
    completed_chapter_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    completed_chapter_count: { type: Number, default: 0, min: 0 },
    completed_chapters_since_ad: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true });
readingProgressSchema.index({ user: 1, book: 1 }, { unique: true });

export default mongoose.models.ReadingProgress
    || mongoose.model('ReadingProgress', readingProgressSchema);
