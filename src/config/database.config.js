// Import mongoose từ mongoose để dùng trong module.
/**
 * Tệp src/config/database.config.js: cấu hình dịch vụ dùng chung. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoose from 'mongoose';

// Hàm connectDB: Kết nối MongoDB bằng URI trong môi trường và dừng khởi động nếu thiếu cấu hình hoặc kết nối thất bại.
/**
 * Hàm connectDB: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Error, connect, log.
 */
export const connectDB = async () => {
    // Khai báo uri nhận giá trị từ process.env.MONGODB_URI. const giữ biến không gán lại; let cho phép cập nhật.
    const uri = process.env.MONGODB_URI;
    // if chỉ chạy nhánh này khi điều kiện !uri đúng.
    if (!uri) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new Error('MONGODB_URI is not configured');
    }
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await mongoose.connect(uri)
    await mongoose.connect(uri);
    // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log('MongoDB connected successfully')
    console.log('MongoDB connected successfully');
};
