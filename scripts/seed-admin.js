// [TIỆN ÍCH QUẢN TRỊ] Tạo/cập nhật tài khoản admin ban đầu, không dùng thông tin đăng nhập mặc định.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/user.model.js';

// [KIỂM TRA CẤU HÌNH] Bắt buộc cung cấp danh tính và mật khẩu riêng qua biến môi trường.
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (at least 12 characters) before seeding');
}

// [TẠO ADMIN] Lưu mật khẩu bcrypt và quyền admin; không in bí mật ra log.
try {
    await connectDB();
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const user = await User.findOneAndUpdate(
        { email },
        { $set: { name: ADMIN_NAME.trim(), password_hash, role: 'admin' } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    console.log(`Admin account is ready: ${user.email}`);
} catch (error) {
    console.error('Failed to seed admin account:', error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
