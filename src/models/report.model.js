// [MODEL BÁO CÁO] Ghi nhận yêu cầu hỗ trợ/lỗi để quản trị viên có thể tra soát về sau.
import mongoose from 'mongoose';

// [LƯỢC ĐỒ BÁO CÁO] Cho phép báo cáo gắn với người gửi nhưng không bắt buộc đăng nhập.
const reportSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, enum: ['contact', 'bug'], default: 'contact', required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' }
}, { timestamps: true });
reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
