// Tạo hoặc cập nhật tài khoản thủ thư quản trị từ biến môi trường rồi ngắt kết nối MongoDB.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB, Librarians } from '../src/models/init.js';

// Cấu hình tài khoản bằng biến môi trường; dùng giá trị mặc định khi không khai báo.
const admin = {
    user_name: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@library.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    full_name: process.env.ADMIN_FULL_NAME || 'Library Administrator'
};

// Luồng thực thi có tác dụng phụ: kết nối DB, băm mật khẩu và ghi hoặc cập nhật hồ sơ thủ thư.
try {
    await connectDB();
    const hashPass = await bcrypt.hash(admin.password, 10);
    const existing = await Librarians.findOne({
        $or: [{ user_name: admin.user_name }, { email: admin.email }]
    });

    // Đồng bộ hồ sơ nếu tìm thấy theo tên đăng nhập/email; nếu chưa có thì tạo tài khoản mới.
    if (existing) {
        existing.user_name = admin.user_name;
        existing.email = admin.email;
        existing.full_name = admin.full_name;
        existing.hash_pass = hashPass;
        existing.roll = 'librarian';
        existing.status = 'Active';
        await existing.save();
        console.log(`Admin account updated: ${admin.email}`);
    } else {
        await Librarians.create({
            user_name: admin.user_name,
            email: admin.email,
            full_name: admin.full_name,
            hash_pass: hashPass,
            roll: 'librarian',
            status: 'Active'
        });
        console.log(`Admin account created: ${admin.email}`);
    }
    console.log(`Password: ${admin.password}`);
// Báo lỗi qua log và mã thoát; ngắt kết nối MongoDB dù thao tác thành công hay thất bại.
} catch (error) {
    console.error('Failed to seed admin account:', error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
