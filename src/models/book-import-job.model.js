// [KHÓA IMPORT] Dùng _id duy nhất làm khóa nguồn để ngăn hai import đồng thời cùng một tác phẩm.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/book-import-job.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo bookImportJobSchema nhận giá trị từ new mongoose.Schema({ _id: { type: String, required: tr. const giữ biến không gán lại; let cho phép cập nhật.
const bookImportJobSchema = new mongoose.Schema({
    // Trường _id lưu { type: String, required: true } làm giá trị trong object.
    _id: { type: String, required: true },
    // Trường source lưu { type: String, required: true } làm giá trị trong object.
    source: { type: String, required: true },
    // Trường source_id lưu { type: String, required: true } làm giá trị trong object.
    source_id: { type: String, required: true },
    // Trường status lưu { type: String, enum: ['importing', 'imported', 'duplic làm giá trị trong object.
    status: { type: String, enum: ['importing', 'imported', 'duplicate', 'failed'], required: true },
    // Trường lock_token lưu { type: String, default: null, select: false } làm giá trị trong object.
    lock_token: { type: String, default: null, select: false },
    // Trường lease_expires_at lưu { type: Date, default: null } làm giá trị trong object.
    lease_expires_at: { type: Date, default: null },
    // Trường book_id lưu { type: mongoose.Schema.Types.ObjectId, ref: 'Book', de làm giá trị trong object.
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    // Trường last_error lưu { type: String, default: null } làm giá trị trong object.
    last_error: { type: String, default: null },
    // Trường attempts lưu { type: Number, default: 0 } làm giá trị trong object.
    attempts: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false, collection: 'book_import_jobs' });

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.BookImportJob
    || mongoose.model('BookImportJob', bookImportJobSchema);
