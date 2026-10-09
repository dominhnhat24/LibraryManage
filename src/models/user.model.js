// [MODEL USER] Hồ sơ OpenBook gồm vai trò, quyền Premium/VIP và refresh token đã băm.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// [LƯỢC ĐỒ NGƯỜI DÙNG] Lưu thông tin tối thiểu và không bao giờ trả mật khẩu/refresh token ra API.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone_number: { type: String, default: null, trim: true, maxlength: 12 },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ['free', 'vip', 'premium', 'admin'], default: 'free', required: true },
    is_premium: { type: Boolean, default: false, required: true },
    premium_expires_at: { type: Date, default: null },
    is_vip: { type: Boolean, default: false, required: true },
    vip_expires_at: { type: Date, default: null },
    refresh_token_hash: { type: String, default: null, select: false }
}, { timestamps: true });

// [KIỂM TRA QUYỀN] Premium gồm thuê bao còn hạn hoặc vai trò VIP/Admin; VIP download cần vai trò VIP còn hạn.
userSchema.methods.hasActivePremium = function hasActivePremium(now = new Date()) {
    return this.role === 'admin' || this.hasActiveVip(now)
        || (this.is_premium && this.premium_expires_at instanceof Date && this.premium_expires_at > now);
};
userSchema.methods.hasActiveVip = function hasActiveVip(now = new Date()) {
    return this.role === 'admin' || (this.role === 'vip' && this.is_vip
        && this.vip_expires_at instanceof Date && this.vip_expires_at > now);
};

// [BẢO MẬT MẬT KHẨU] So sánh mật khẩu gửi vào với bcrypt hash chỉ được nạp trong luồng đăng nhập.
userSchema.methods.verifyPassword = function verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
};

// [DỮ LIỆU CÔNG KHAI] Loại bỏ mọi trường xác thực và tính lại quyền thuê bao còn hiệu lực.
userSchema.methods.toPublicJSON = function toPublicJSON() {
    const activeVip = this.hasActiveVip();
    const activePremium = this.hasActivePremium();
    return {
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role === 'vip' && !activeVip ? 'free' : this.role,
        is_premium: activePremium,
        premium_expires_at: activePremium && this.role !== 'admin'
            ? (activeVip ? this.vip_expires_at : this.premium_expires_at) : null,
        is_vip: activeVip,
        vip_expires_at: activeVip && this.role !== 'admin' ? this.vip_expires_at : null
    };
};

export default mongoose.models.User || mongoose.model('User', userSchema);






