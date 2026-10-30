// [ĐIỂM KHỞI CHẠY] Nạp .env từ thư mục dự án trước khi khởi tạo các cấu hình phụ thuộc môi trường.
// Import module side-effect từ ./src/config/load-env.js để dùng trong module.
/**
 * Tệp server.js: lắp ráp/khởi động ứng dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import './src/config/load-env.js';
// Import express từ express để dùng trong module.
import express from 'express';
// Import cors từ cors để dùng trong module.
import cors from 'cors';
// Import helmet từ helmet để dùng trong module.
import helmet from 'helmet';
// Import { existsSync } từ node:fs để dùng trong module.
import { existsSync } from 'node:fs';
// Import { resolve } từ node:path để dùng trong module.
import { resolve } from 'node:path';
// Import { pathToFileURL } từ node:url để dùng trong module.
import { pathToFileURL } from 'node:url';
// Import { connectDB } từ ./src/config/database.config.js để dùng trong module.
import { connectDB } from './src/config/database.config.js';
// Import authRoutes từ ./src/routes/auth.routes.js để dùng trong module.
import authRoutes from './src/routes/auth.routes.js';
// Import bookRoutes từ ./src/routes/book.routes.js để dùng trong module.
import bookRoutes from './src/routes/book.routes.js';
// Import subscriptionRoutes từ ./src/routes/subscription.routes.js để dùng trong module.
import subscriptionRoutes from './src/routes/subscription.routes.js';
// Import downloadRoutes từ ./src/routes/download.routes.js để dùng trong module.
import downloadRoutes from './src/routes/download.routes.js';
// Import adminRoutes từ ./src/routes/admin.routes.js để dùng trong module.
import adminRoutes from './src/routes/admin.routes.js';
// Import interactionRoutes từ ./src/routes/interaction.routes.js để dùng trong module.
import interactionRoutes from './src/routes/interaction.routes.js';
// Import reportRoutes từ ./src/routes/report.routes.js để dùng trong module.
import reportRoutes from './src/routes/report.routes.js';
// Import chapterRoutes từ ./src/routes/chapter.routes.js để dùng trong module.
import chapterRoutes from './src/routes/chapter.routes.js';
// Import bookmarkRoutes từ ./src/routes/bookmark.routes.js để dùng trong module.
import bookmarkRoutes from './src/routes/bookmark.routes.js';
// Import readingProgressRoutes từ ./src/routes/reading-progress.routes.js để dùng trong module.
import readingProgressRoutes from './src/routes/reading-progress.routes.js';
// Import { errorHandler, notFoundHandler } từ ./src/middlewares/error.middleware.js để dùng trong module.
import { errorHandler, notFoundHandler } from './src/middlewares/error.middleware.js';
// Import { loggerMiddleware } từ ./src/middlewares/logger.middleware.js để dùng trong module.
import { loggerMiddleware } from './src/middlewares/logger.middleware.js';
// Import { apiRateLimiter, authRateLimiter, closeRateLimitStore, connectRateLimitSto từ ./src/middlewares/security.middleware.js để dùng trong module.
import {
    apiRateLimiter, authRateLimiter, closeRateLimitStore, connectRateLimitStore, loginRateLimiter,
    parseTrustProxy, sanitizeMongoInput
} from './src/middlewares/security.middleware.js';
// Import ApiError từ ./src/utils/api-error.js để dùng trong module.
import ApiError from './src/utils/api-error.js';
// Import commentRoutes từ ./src/routes/comment.routes.js để dùng trong module.
import commentRoutes from './src/routes/comment.routes.js';
// Import webhookRoutes từ ./src/routes/webhook.routes.js để dùng trong module.
import webhookRoutes from './src/routes/webhook.routes.js';
// Import multer từ multer để dùng trong module.
import multer from 'multer';

// [CẤU HÌNH ỨNG DỤNG] Thiết lập middleware chung, CORS theo danh sách cấu hình và giới hạn payload JSON.
// Khai báo app nhận giá trị từ express(). const giữ biến không gán lại; let cho phép cập nhật.
export const app = express();
// Gọi/thực thi app.set với các đối số để thực hiện thao tác: app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY))
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
// Khai báo allowedOrigins nhận giá trị từ new Set((process.env.CORS_ORIGINS || '') .split(',') .m. const giữ biến không gán lại; let cho phép cập nhật.
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean));

// Gọi/thực thi app.disable với các đối số để thực hiện thao tác: app.disable('x-powered-by')
app.disable('x-powered-by');
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(helmet())
app.use(helmet());
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(loggerMiddleware)
app.use(loggerMiddleware);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(cors({ origin(origin, callback) { const localOrigin = typeof origin
app.use(cors({
    /**
     * Hàm origin: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: origin, callback.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: test, callback, has.
     */
    origin(origin, callback) {
        // Khai báo localOrigin nhận giá trị từ typeof origin === 'string' && /^http:\/\/(?:localhost|1. const giữ biến không gán lại; let cho phép cập nhật.
        const localOrigin = typeof origin === 'string'
            && /^http:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):\d+$/.test(origin);
        // Gọi/thực thi callback với các đối số để thực hiện thao tác: callback(null, !origin || allowedOrigins.has(origin) || (process.env.NODE_E
        callback(null, !origin || allowedOrigins.has(origin)
            || (process.env.NODE_ENV !== 'production' && localOrigin));
    },
    // Trường methods lưu ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] làm giá trị trong object.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Trường allowedHeaders lưu ['Content-Type', 'Authorization'] làm giá trị trong object.
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Trường exposedHeaders lưu ['Content-Disposition'] làm giá trị trong object.
    exposedHeaders: ['Content-Disposition']
}));
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(express.json({ limit: '1mb' }))
app.use(express.json({ limit: '1mb' }));
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(sanitizeMongoInput)
app.use(sanitizeMongoInput);
// [KIỂM TRA BODY] Chuẩn hóa body vắng mặt thành object và từ chối JSON không phải object.
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use((req, res, next) => { if (req.body === undefined) req.body = {}; if
app.use((req, res, next) => {
    // if chỉ chạy nhánh này khi điều kiện req.body === undefined đúng.
    if (req.body === undefined) req.body = {};
    // if chỉ chạy nhánh này khi điều kiện req.body === null || typeof req.body !== 'object' || Array.isArray(req.body đúng.
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        // return kết thúc hàm và trả next(new ApiError(400, 'Request body must be a JSON object')) về nơi gọi.
        return next(new ApiError(400, 'Request body must be a JSON object'));
    }
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
});

// [KIỂM TRA SỨC KHỎE] Endpoint riêng cho Render kiểm tra tiến trình API.
// Gọi/thực thi app.get với các đối số để thực hiện thao tác: app.get('/health', (req, res) => res.json({ status: 'success', message: 'Ha
app.get('/health', (req, res) => res.json({ status: 'success', message: 'HarveyBook is running' }));

// [ĐĂNG KÝ TUYẾN] Gom API theo chức năng và dùng chung tiền tố phiên bản.
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1', apiRateLimiter)
app.use('/api/v1', apiRateLimiter);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/auth', authRateLimiter)
app.use('/api/v1/auth', authRateLimiter);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/auth/login', loginRateLimiter)
app.use('/api/v1/auth/login', loginRateLimiter);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/auth/admin-login', loginRateLimiter)
app.use('/api/v1/auth/admin-login', loginRateLimiter);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/auth', authRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/books', bookRoutes)
app.use('/api/v1/books', bookRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/subscriptions', subscriptionRoutes)
app.use('/api/v1/subscriptions', subscriptionRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/webhooks', webhookRoutes)
app.use('/api/v1/webhooks', webhookRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/downloads', downloadRoutes)
app.use('/api/v1/downloads', downloadRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/admin', adminRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1', interactionRoutes)
app.use('/api/v1', interactionRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/reports', reportRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/admin/chapters', chapterRoutes)
app.use('/api/v1/admin/chapters', chapterRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/bookmarks', bookmarkRoutes)
app.use('/api/v1/bookmarks', bookmarkRoutes);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api/v1/reading-progress', readingProgressRoutes)
app.use('/api/v1/reading-progress', readingProgressRoutes); 
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use('/api', commentRoutes)
app.use('/api', commentRoutes);

// [GIAO DIỆN WEB] Docker production phục vụ SPA cùng origin với API để dùng chung HTTPS/domain.
// Khai báo webDistPath nhận giá trị từ resolve('admin-web/dist'). const giữ biến không gán lại; let cho phép cập nhật.
const webDistPath = resolve('admin-web/dist');
// if chỉ chạy nhánh này khi điều kiện existsSync(resolve(webDistPath, 'index.html')) đúng.
if (existsSync(resolve(webDistPath, 'index.html'))) {
    // Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(express.static(webDistPath, { index: false, maxAge: '1h' }))
    app.use(express.static(webDistPath, { index: false, maxAge: '1h' }));
    // Gọi/thực thi app.get với các đối số để thực hiện thao tác: app.get(/^(?!\/api(?:\/|$)).* /, (req, res, next) => { if (!req.accepts('htm
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
        // if chỉ chạy nhánh này khi điều kiện !req.accepts('html') đúng.
        if (!req.accepts('html')) return next();
        // return kết thúc hàm và trả res.sendFile(resolve(webDistPath, 'index.html')) về nơi gọi.
        return res.sendFile(resolve(webDistPath, 'index.html'));
    });
} else {
    // Gọi/thực thi app.get với các đối số để thực hiện thao tác: app.get('/', (req, res) => res.json({ status: 'success', message: 'HarveyBo
    app.get('/', (req, res) => res.json({ status: 'success', message: 'HarveyBook API is running' }));
}

// [XỬ LÝ LỖI] Chuẩn hóa tuyến không tồn tại và lỗi phát sinh trong middleware/controller.
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(notFoundHandler)
app.use(notFoundHandler);
// Gọi/thực thi app.use với các đối số để thực hiện thao tác: app.use(errorHandler)
app.use(errorHandler);

// [KHỞI ĐỘNG SERVER] Kết nối DB và chỉ mở cổng khi cấu hình JWT/MongoDB hợp lệ.
/**
 * Hàm startServer: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Error, connectRateLimitStore, connectDB, Number, listen, log.
 */
export const startServer = async () => {
    // if chỉ chạy nhánh này khi điều kiện !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 đúng.
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new Error('JWT_SECRET must contain at least 32 characters');
    }
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await connectRateLimitStore()
    await connectRateLimitStore();
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await connectDB()
    await connectDB();
    // Khai báo port nhận giá trị từ Number(process.env.PORT || 5000). const giữ biến không gán lại; let cho phép cập nhật.
    const port = Number(process.env.PORT || 5000);
    // return kết thúc hàm và trả app.listen(port, () => console.log(`HarveyBook API is running on port ${por về nơi gọi.
    return app.listen(port, () => console.log(`HarveyBook API is running on port ${port}`));
};

// Khai báo upload nhận giá trị từ multer({ storage: multer.memoryStorage() }). const giữ biến không gán lại; let cho phép cập nhật.
const upload = multer({ storage: multer.memoryStorage() });
// Khai báo router nhận giá trị từ express.Router(). const giữ biến không gán lại; let cho phép cập nhật.
const router = express.Router();

// [CHẠY TRỰC TIẾP] Không tự khởi động khi server.js được import bởi kiểm thử.
// if chỉ chạy nhánh này khi điều kiện process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import. đúng.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    // Gọi/thực thi startServer với các đối số để thực hiện thao tác: startServer().catch((error) => { console.error('HarveyBook server failed to
    startServer().catch((error) => {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('HarveyBook server failed to start:', error)
        console.error('HarveyBook server failed to start:', error);
        // Gọi/thực thi closeRateLimitStore với các đối số để thực hiện thao tác: closeRateLimitStore().catch((closeError) => { console.error('Failed to clos
        closeRateLimitStore().catch((closeError) => {
            // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('Failed to close rate-limit Redis connection:', closeError)
            console.error('Failed to close rate-limit Redis connection:', closeError);
        });
        // Gọi/thực thi biểu thức để thực hiện thao tác: process.exitCode = 1
        process.exitCode = 1;
    });
}
