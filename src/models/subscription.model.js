// [MODEL THUÊ BAO] Lưu yêu cầu chuyển khoản Premium và trạng thái xác nhận thủ công.
import mongoose from 'mongoose';

// [LƯỢC ĐỒ THUÊ BAO] Phí Premium cố định 20.000 VND/tháng; quyền chỉ kích hoạt sau khi admin duyệt.
const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['vip_monthly', 'premium_monthly'], default: 'premium_monthly', required: true },
    amount_vnd: { type: Number, immutable: true, required: true },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending', required: true },
    starts_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
    payment_reference: { type: String, trim: true, maxlength: 120, default: null },
    transfer_note: { type: String, required: true, immutable: true },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1, createdAt: -1 });
subscriptionSchema.index({ user: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'pending' }
});

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
