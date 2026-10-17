import mongoose from 'mongoose';

// Hàm connectDB: Kết nối MongoDB bằng URI trong môi trường và dừng khởi động nếu thiếu cấu hình hoặc kết nối thất bại.
export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not configured');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
};
