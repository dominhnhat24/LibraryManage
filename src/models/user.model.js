// [MODEL USER] Hồ sơ OpenBook gồm vai trò, quyền Premium/VIP và refresh token đã băm.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.constant.js';

// [LƯỢC ĐỒ NGƯỜI DÙNG] Lưu thông tin tối thiểu và không bao giờ trả mật khẩu/refresh token ra API.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    avatar_url: { type: String, default: null, trim: true, maxlength: 2048 },
    phone_number: { type: String, default: null, trim: true, maxlength: 12 },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, required: true },
    email_verified: { type: Boolean, default: true, required: true },
    email_otp_hash: { type: String, default: null, select: false },
    email_otp_expires_at: { type: Date, default: null, select: false },
    email_otp_sent_at: { type: Date, default: null, select: false },
    email_otp_attempts: { type: Number, default: 0, select: false },
    is_premium: { type: Boolean, default: false, required: true },
    premium_expires_at: { type: Date, default: null },
    is_vip: { type: Boolean, default: false, required: true },
    vip_expires_at: { type: Date, default: null },
    refresh_token_hash: { type: String, default: null, select: false },
    password_otp_hash: { type: String, default: null, select: false },
    password_otp_expires_at: { type: Date, default: null, select: false },
    password_otp_sent_at: { type: Date, default: null, select: false },
    password_otp_attempts: { type: Number, default: 0, select: false }
}, { timestamps: true });

// Hàm hasActivePremium: Kiểm tra quyền Premium còn hạn, bao gồm quyền VIP đang hoạt động và quyền Admin.
userSchema.methods.hasActivePremium = function hasActivePremium(now = new Date()) {
    return this.role === ROLES.ADMIN
        || (this.is_premium && this.premium_expires_at instanceof Date && this.premium_expires_at > now);
};

// Hàm hasActiveVip: Kiểm tra cờ VIP và ngày hết hạn độc lập với role phân quyền ADMIN/USER.
userSchema.methods.hasActiveVip = function hasActiveVip(now = new Date()) {
    return this.role === ROLES.ADMIN || this.hasActivePremium(now) || (this.is_vip
        && this.vip_expires_at instanceof Date && this.vip_expires_at > now);
};

// Hàm verifyPassword: So sánh mật khẩu đăng nhập với bcrypt hash chỉ được nạp trong luồng xác thực.
userSchema.methods.verifyPassword = function verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
};

// Hàm toPublicJSON: Tạo dữ liệu hồ sơ an toàn, không xuất mật khẩu/token và trả quyền thuê bao đang hiệu lực.
userSchema.methods.toPublicJSON = function toPublicJSON() {
    const activeVip = this.hasActiveVip();
    const activePremium = this.hasActivePremium();
    return {
        id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
        is_premium: activePremium,
        premium_expires_at: activePremium && this.role !== ROLES.ADMIN ? this.premium_expires_at : null,
        is_vip: activeVip,
        vip_expires_at: activeVip && this.role !== ROLES.ADMIN
            ? (activePremium ? this.premium_expires_at : this.vip_expires_at) : null,
        avatar_url: this.avatar_url || null
    };
};

export default mongoose.models.User || mongoose.model('User', userSchema);




