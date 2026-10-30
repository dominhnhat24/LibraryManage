// [MODEL BÁO CÁO] Ghi nhận yêu cầu hỗ trợ/lỗi để quản trị viên có thể tra soát về sau.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/report.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// [LƯỢC ĐỒ BÁO CÁO] Cho phép báo cáo gắn với người gửi nhưng không bắt buộc đăng nhập.
// Khai báo reportSchema nhận giá trị từ new mongoose.Schema({ user: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const reportSchema = new mongoose.Schema({
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', de làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Trường email lưu { type: String, required: true, lowercase: true, trim:  làm giá trị trong object.
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    // Trường subject lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    // Trường message lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    // Trường type lưu { type: String, enum: ['contact', 'bug'], default: 'con làm giá trị trong object.
    type: { type: String, enum: ['contact', 'bug'], default: 'contact', required: true },
    // Trường status lưu { type: String, enum: ['open', 'in_progress', 'resolved làm giá trị trong object.
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' }
}, { timestamps: true });
// Gọi/thực thi reportSchema.index với các đối số để thực hiện thao tác: reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ status: 1, createdAt: -1 });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Report || mongoose.model('Report', reportSchema);
