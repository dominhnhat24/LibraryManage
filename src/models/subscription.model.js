import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['vip_monthly', 'premium_monthly'], default: 'premium_monthly', required: true },
    amount_vnd: { type: Number, immutable: true, required: true, default: 20000 },
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending', required: true },
    starts_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
    payment_reference: { type: String, trim: true, maxlength: 120, default: null },
    transfer_note: { type: String, required: true, immutable: true },
    
    // Bổ sung cho luồng webhook tự động & dự phòng
    gateway: { type: String, enum: ['manual', 'momo', 'sepay', 'casso'], default: 'manual' },
    transaction_id: { type: String, default: null },
    auto_approved: { type: Boolean, default: false },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1, createdAt: -1 });
subscriptionSchema.index({ user: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'pending' }
});
subscriptionSchema.index({ gateway: 1, transaction_id: 1 }, {
    unique: true,
    partialFilterExpression: { transaction_id: { $type: 'string' } }
});

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
