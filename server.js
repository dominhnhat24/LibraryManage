// Điểm khởi tạo ứng dụng Express: cấu hình CORS, bộ phân tích request và các tuyến API.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import bookRouter from './src/routes/book.route.js';
import bookCopiesRouter from './src/routes/bookCopies.route.js';
import readerRouter from './src/routes/reader.route.js';
import authRouter from './src/routes/auth.route.js';
import { connectDB } from './src/models/init.js';
import errorHandler from './src/middlewares/error-handler.js';
import borrowCardRouter from './src/routes/borrowCard.route.js';
import fineRouter from './src/routes/fine.route.js';
import apiError from './src/utils/api-error.js';
import librarianRouter from './src/routes/librarian.route.js';
import dashboardRouter from './src/routes/dashboard.route.js';

export const app = express();
const PORT = process.env.PORT || 5001;
const configuredOrigins = new Set(
    (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
);

app.use(cors({
    // Callback CORS nhận Origin và callback kết quả; không thay đổi response mà quyết định cho phép nguồn.
    origin(origin, callback) {
        // Cho phép nguồn không có Origin, nguồn cấu hình rõ ràng và nguồn LAN khi không ở production.
        const isLocalDevelopmentOrigin = typeof origin === 'string'
            && /^http:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):\d+$/.test(origin);
        const isAllowed = !origin
            || configuredOrigins.has(origin)
            || (process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin);
        callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware để đọc dữ liệu JSON từ request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint kiểm tra nhanh trạng thái phục vụ của API; không truy cập cơ sở dữ liệu.
// Nhận request bất kỳ tại / và gửi JSON báo trạng thái thành công.
// Gọi hàm kết nối MongoDB
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API Running'
    });
});

app.use('/api/v1/books', bookRouter);
app.use('/api/v1/book-copies', bookCopiesRouter);
app.use('/api/v1/readers', readerRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/borrow-cards', borrowCardRouter);
app.use('/api/v1/fines', fineRouter);
app.use('/api/v1/librarians', librarianRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// Chuyển URL không khớp tuyến thành lỗi 404 để bộ xử lý lỗi định dạng phản hồi.
// Middleware nhận req/res/next và chuyển ApiError 404 qua next(), không tự gửi response.
app.use((req, res, next) => next(new apiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));
app.use(errorHandler);

// Kết nối MongoDB rồi mở cổng HTTP; dừng tiến trình khi thiếu cấu hình JWT hoặc khởi động thất bại.
// Không nhận tham số; resolve sau khi mở server, đồng thời kết nối DB và bắt đầu lắng nghe cổng.
const startServer = async () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    await connectDB();
    // Callback lắng nghe được gọi khi server bắt đầu nhận request; chỉ ghi log, không trả dữ liệu.
    app.listen(PORT, () => {
        // Ghi nhận cổng đã mở để hỗ trợ chẩn đoán khởi động.
        console.log(`Server is running on port ${PORT}`);
    });
};

// Chỉ tự khởi động khi tệp được chạy trực tiếp; khi import chỉ cung cấp app cho nơi gọi.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    // Bắt lỗi khởi động, ghi log và kết thúc tiến trình với mã lỗi.
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}