// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/subscription.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Khai báo subscriptionSchema nhận giá trị từ new mongoose.Schema({ user: { type: mongoose.Schema.Typ. const giữ biến không gán lại; let cho phép cập nhật.
const subscriptionSchema = new mongoose.Schema({
    // Trường user lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', re làm giá trị trong object.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Trường plan lưu { type: String, enum: ['vip_monthly', 'premium_monthly' làm giá trị trong object.
    plan: { type: String, enum: ['vip_monthly', 'premium_monthly'], default: 'premium_monthly', required: true },
    // Trường amount_vnd lưu { type: Number, immutable: true, required: true, defaul làm giá trị trong object.
    amount_vnd: { type: Number, immutable: true, required: true, default: 20000 },
    // Trường status lưu { type: String, enum: ['pending', 'active', 'rejected', làm giá trị trong object.
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending', required: true },
    // Trường starts_at lưu { type: Date, default: null } làm giá trị trong object.
    starts_at: { type: Date, default: null },
    // Trường expires_at lưu { type: Date, default: null } làm giá trị trong object.
    expires_at: { type: Date, default: null },
    // Trường payment_reference lưu { type: String, trim: true, maxlength: 120, default: nu làm giá trị trong object.
    payment_reference: { type: String, trim: true, maxlength: 120, default: null },
    // Trường transfer_note lưu { type: String, required: true, immutable: true } làm giá trị trong object.
    transfer_note: { type: String, required: true, immutable: true },
    
    // Bổ sung cho luồng webhook tự động & dự phòng
    // Trường gateway lưu { type: String, enum: ['manual', 'momo', 'sepay', 'cass làm giá trị trong object.
    gateway: { type: String, enum: ['manual', 'momo', 'sepay', 'casso'], default: 'manual' },
    // Trường transaction_id lưu { type: String, default: null } làm giá trị trong object.
    transaction_id: { type: String, default: null },
    // Trường auto_approved lưu { type: Boolean, default: false } làm giá trị trong object.
    auto_approved: { type: Boolean, default: false },
    // Trường reviewed_by lưu { type: mongoose.Schema.Types.ObjectId, ref: 'User', de làm giá trị trong object.
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Gọi/thực thi subscriptionSchema.index với các đối số để thực hiện thao tác: subscriptionSchema.index({ user: 1, status: 1, createdAt: -1 })
subscriptionSchema.index({ user: 1, status: 1, createdAt: -1 });
// Gọi/thực thi subscriptionSchema.index với các đối số để thực hiện thao tác: subscriptionSchema.index({ user: 1 }, { unique: true, partialFilterExpressi
subscriptionSchema.index({ user: 1 }, {
    // Trường unique lưu true làm giá trị trong object.
    unique: true,
    // Trường partialFilterExpression lưu { status: 'pending' } làm giá trị trong object.
    partialFilterExpression: { status: 'pending' }
});
// Gọi/thực thi subscriptionSchema.index với các đối số để thực hiện thao tác: subscriptionSchema.index({ gateway: 1, transaction_id: 1 }, { unique: true,
subscriptionSchema.index({ gateway: 1, transaction_id: 1 }, {
    // Trường unique lưu true làm giá trị trong object.
    unique: true,
    // Trường partialFilterExpression lưu { transaction_id: { $type: 'string' } } làm giá trị trong object.
    partialFilterExpression: { transaction_id: { $type: 'string' } }
});

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
