// [ĐIỂM KHỞI CHẠY] Nạp .env từ thư mục dự án trước khi khởi tạo các cấu hình phụ thuộc môi trường.
import './src/config/load-env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { connectDB } from './src/config/database.config.js';
import authRoutes from './src/routes/auth.routes.js';
import bookRoutes from './src/routes/book.routes.js';
import subscriptionRoutes from './src/routes/subscription.routes.js';
import downloadRoutes from './src/routes/download.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import interactionRoutes from './src/routes/interaction.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import chapterRoutes from './src/routes/chapter.routes.js';
import bookmarkRoutes from './src/routes/bookmark.routes.js';
import readingProgressRoutes from './src/routes/reading-progress.routes.js';
import { errorHandler, notFoundHandler } from './src/middlewares/error.middleware.js';
import { loggerMiddleware } from './src/middlewares/logger.middleware.js';
import {
    apiRateLimiter, authRateLimiter, closeRateLimitStore, connectRateLimitStore, loginRateLimiter,
    parseTrustProxy, sanitizeMongoInput
} from './src/middlewares/security.middleware.js';
import ApiError from './src/utils/api-error.js';
import commentRoutes from './src/routes/comment.routes.js';
import webhookRoutes from './src/routes/webhook.routes.js';
import multer from 'multer';

// [CẤU HÌNH ỨNG DỤNG] Thiết lập middleware chung, CORS theo danh sách cấu hình và giới hạn payload JSON.
export const app = express();
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
const allowedOrigins = new Set((process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean));

app.disable('x-powered-by');
app.use(helmet());
app.use(loggerMiddleware);
app.use(cors({
    origin(origin, callback) {
        const localOrigin = typeof origin === 'string'
            && /^http:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):\d+$/.test(origin);
        callback(null, !origin || allowedOrigins.has(origin)
            || (process.env.NODE_ENV !== 'production' && localOrigin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(sanitizeMongoInput);
// [KIỂM TRA BODY] Chuẩn hóa body vắng mặt thành object và từ chối JSON không phải object.
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return next(new ApiError(400, 'Request body must be a JSON object'));
    }
    return next();
});

// [KIỂM TRA SỨC KHỎE] Endpoint riêng cho Render kiểm tra tiến trình API.
app.get('/health', (req, res) => res.json({ status: 'success', message: 'HarveyBook is running' }));

// [ĐĂNG KÝ TUYẾN] Gom API theo chức năng và dùng chung tiền tố phiên bản.
app.use('/api/v1', apiRateLimiter);
app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1/auth/login', loginRateLimiter);
app.use('/api/v1/auth/admin-login', loginRateLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/downloads', downloadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', interactionRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin/chapters', chapterRoutes);
app.use('/api/v1/bookmarks', bookmarkRoutes);
app.use('/api/v1/reading-progress', readingProgressRoutes); 
app.use('/api', commentRoutes);

// [GIAO DIỆN WEB] Docker production phục vụ SPA cùng origin với API để dùng chung HTTPS/domain.
const webDistPath = resolve('admin-web/dist');
if (existsSync(resolve(webDistPath, 'index.html'))) {
    app.use(express.static(webDistPath, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
        if (!req.accepts('html')) return next();
        return res.sendFile(resolve(webDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.json({ status: 'success', message: 'HarveyBook API is running' }));
}

// [XỬ LÝ LỖI] Chuẩn hóa tuyến không tồn tại và lỗi phát sinh trong middleware/controller.
app.use(notFoundHandler);
app.use(errorHandler);

// [KHỞI ĐỘNG SERVER] Kết nối DB và chỉ mở cổng khi cấu hình JWT/MongoDB hợp lệ.
export const startServer = async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters');
    }
    await connectRateLimitStore();
    await connectDB();
    const port = Number(process.env.PORT || 5000);
    return app.listen(port, () => console.log(`HarveyBook API is running on port ${port}`));
};

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// [CHẠY TRỰC TIẾP] Không tự khởi động khi server.js được import bởi kiểm thử.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    startServer().catch((error) => {
        console.error('HarveyBook server failed to start:', error);
        closeRateLimitStore().catch((closeError) => {
            console.error('Failed to close rate-limit Redis connection:', closeError);
        });
        process.exitCode = 1;
    });
}
