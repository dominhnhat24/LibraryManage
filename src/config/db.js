// [CONFIG] Kết nối MongoDB theo URI cấu hình và báo lỗi kết nối rõ ràng cho tiến trình khởi động.
import mongoose from 'mongoose';

// [KẾT NỐI DATABASE] Dùng MongoDB URI cấu hình và để lỗi kết nối dừng quá trình khởi động.
export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not configured');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
};
