// [MODEL USER] Hồ sơ OpenBook gồm vai trò, quyền Premium/VIP và refresh token đã băm.
// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/models/user.model.js: định nghĩa cấu trúc dữ liệu MongoDB. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';
// Import bcrypt từ bcryptjs để dùng trong module.
import bcrypt from 'bcryptjs';
// Import { ROLES } từ ../constants/roles.constant.js để dùng trong module.
import { ROLES } from '../constants/roles.constant.js';

// [LƯỢC ĐỒ NGƯỜI DÙNG] Lưu thông tin tối thiểu và không bao giờ trả mật khẩu/refresh token ra API.
// Khai báo userSchema nhận giá trị từ new mongoose.Schema({ name: { type: String, required: t. const giữ biến không gán lại; let cho phép cập nhật.
const userSchema = new mongoose.Schema({
    // Trường name lưu { type: String, required: true, trim: true, maxlength:  làm giá trị trong object.
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Trường email lưu { type: String, required: true, unique: true, lowercase làm giá trị trong object.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Trường avatar_url lưu { type: String, default: null, trim: true, maxlength: 2 làm giá trị trong object.
    avatar_url: { type: String, default: null, trim: true, maxlength: 2048 },
    // Trường phone_number lưu { type: String, default: null, trim: true, maxlength: 1 làm giá trị trong object.
    phone_number: { type: String, default: null, trim: true, maxlength: 12 },
    // Trường password_hash lưu { type: String, required: true, select: false } làm giá trị trong object.
    password_hash: { type: String, required: true, select: false },
    // Trường role lưu { type: String, enum: Object.values(ROLES), default: RO làm giá trị trong object.
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, required: true },
    // Trường email_verified lưu { type: Boolean, default: true, required: true } làm giá trị trong object.
    email_verified: { type: Boolean, default: true, required: true },
    // Trường email_otp_hash lưu { type: String, default: null, select: false } làm giá trị trong object.
    email_otp_hash: { type: String, default: null, select: false },
    // Trường email_otp_expires_at lưu { type: Date, default: null, select: false } làm giá trị trong object.
    email_otp_expires_at: { type: Date, default: null, select: false },
    // Trường email_otp_sent_at lưu { type: Date, default: null, select: false } làm giá trị trong object.
    email_otp_sent_at: { type: Date, default: null, select: false },
    // Trường email_otp_attempts lưu { type: Number, default: 0, select: false } làm giá trị trong object.
    email_otp_attempts: { type: Number, default: 0, select: false },
    // Trường is_premium lưu { type: Boolean, default: false, required: true } làm giá trị trong object.
    is_premium: { type: Boolean, default: false, required: true },
    // Trường premium_expires_at lưu { type: Date, default: null } làm giá trị trong object.
    premium_expires_at: { type: Date, default: null },
    // Trường is_vip lưu { type: Boolean, default: false, required: true } làm giá trị trong object.
    is_vip: { type: Boolean, default: false, required: true },
    // Trường vip_expires_at lưu { type: Date, default: null } làm giá trị trong object.
    vip_expires_at: { type: Date, default: null },
    // Trường refresh_token_hash lưu { type: String, default: null, select: false } làm giá trị trong object.
    refresh_token_hash: { type: String, default: null, select: false },
    // Trường password_otp_hash lưu { type: String, default: null, select: false } làm giá trị trong object.
    password_otp_hash: { type: String, default: null, select: false },
    // Trường password_otp_expires_at lưu { type: Date, default: null, select: false } làm giá trị trong object.
    password_otp_expires_at: { type: Date, default: null, select: false },
    // Trường password_otp_sent_at lưu { type: Date, default: null, select: false } làm giá trị trong object.
    password_otp_sent_at: { type: Date, default: null, select: false },
    // Trường password_otp_attempts lưu { type: Number, default: 0, select: false } làm giá trị trong object.
    password_otp_attempts: { type: Number, default: 0, select: false }
}, { timestamps: true });

// Hàm hasActivePremium: Kiểm tra quyền Premium còn hạn, bao gồm quyền VIP đang hoạt động và quyền Admin.
// Gọi/thực thi hasActivePremium với các đối số để thực hiện thao tác: userSchema.methods.hasActivePremium = function hasActivePremium(now = new D
userSchema.methods.hasActivePremium = function hasActivePremium(now = new Date()) {
    // return kết thúc hàm và trả this.role === ROLES.ADMIN || (this.is_premium && this.premium_expires_at in về nơi gọi.
    return this.role === ROLES.ADMIN
        || (this.is_premium && this.premium_expires_at instanceof Date && this.premium_expires_at > now);
};

// Hàm hasActiveVip: Kiểm tra cờ VIP và ngày hết hạn độc lập với role phân quyền ADMIN/USER.
// Gọi/thực thi hasActiveVip với các đối số để thực hiện thao tác: userSchema.methods.hasActiveVip = function hasActiveVip(now = new Date()) {
userSchema.methods.hasActiveVip = function hasActiveVip(now = new Date()) {
    // return kết thúc hàm và trả this.role === ROLES.ADMIN || this.hasActivePremium(now) || (this.is_vip &&  về nơi gọi.
    return this.role === ROLES.ADMIN || this.hasActivePremium(now) || (this.is_vip
        && this.vip_expires_at instanceof Date && this.vip_expires_at > now);
};

// Hàm verifyPassword: So sánh mật khẩu đăng nhập với bcrypt hash chỉ được nạp trong luồng xác thực.
// Gọi/thực thi verifyPassword với các đối số để thực hiện thao tác: userSchema.methods.verifyPassword = function verifyPassword(password) { ret
userSchema.methods.verifyPassword = function verifyPassword(password) {
    // return kết thúc hàm và trả bcrypt.compare(password, this.password_hash) về nơi gọi.
    return bcrypt.compare(password, this.password_hash);
};

// Hàm toPublicJSON: Tạo dữ liệu hồ sơ an toàn, không xuất mật khẩu/token và trả quyền thuê bao đang hiệu lực.
// Gọi/thực thi toPublicJSON với các đối số để thực hiện thao tác: userSchema.methods.toPublicJSON = function toPublicJSON() { const activeVip
userSchema.methods.toPublicJSON = function toPublicJSON() {
    // Khai báo activeVip nhận giá trị từ this.hasActiveVip(). const giữ biến không gán lại; let cho phép cập nhật.
    const activeVip = this.hasActiveVip();
    // Khai báo activePremium nhận giá trị từ this.hasActivePremium(). const giữ biến không gán lại; let cho phép cập nhật.
    const activePremium = this.hasActivePremium();
    // return kết thúc hàm và trả { id: this.id, name: this.name, email: this.email, role: this.role, is_prem về nơi gọi.
    return {
        // Trường id lưu this.id làm giá trị trong object.
        id: this.id,
        // Trường name lưu this.name làm giá trị trong object.
        name: this.name,
        // Trường email lưu this.email làm giá trị trong object.
        email: this.email,
        // Trường role lưu this.role làm giá trị trong object.
        role: this.role,
        // Trường is_premium lưu activePremium làm giá trị trong object.
        is_premium: activePremium,
        // Trường premium_expires_at lưu activePremium && this.role !== ROLES.ADMIN ? this.premi làm giá trị trong object.
        premium_expires_at: activePremium && this.role !== ROLES.ADMIN ? this.premium_expires_at : null,
        // Trường is_vip lưu activeVip làm giá trị trong object.
        is_vip: activeVip,
        // Trường vip_expires_at lưu activeVip && this.role !== ROLES.ADMIN ? (activePremium làm giá trị trong object.
        vip_expires_at: activeVip && this.role !== ROLES.ADMIN
            ? (activePremium ? this.premium_expires_at : this.vip_expires_at) : null,
        // Trường avatar_url lưu this.avatar_url || null làm giá trị trong object.
        avatar_url: this.avatar_url || null
    };
};

// export default cung cấp giá trị này để module khác import.
export default mongoose.models.User || mongoose.model('User', userSchema);




