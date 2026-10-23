// [MODEL LỊCH SỬ ĐỌC] Ghi nhận từng lần người đọc mở chương hoặc file để dashboard có số liệu theo ngày.
import mongoose from 'mongoose';

const readingEventSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', default: null },
    action: { type: String, enum: ['chapter', 'file'], required: true, default: 'chapter' }
}, { timestamps: { createdAt: true, updatedAt: false } });

readingEventSchema.index({ createdAt: -1 });

export default mongoose.models.ReadingEvent
    || mongoose.model('ReadingEvent', readingEventSchema);
