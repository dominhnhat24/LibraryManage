import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';

const redisUrl = process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL;
let redisClient;

const createStore = (prefix) => redisUrl
    ? new RedisStore({
        prefix,
        sendCommand: (...args) => redisClient.sendCommand(args)
    })
    : undefined;

const rateLimitResponse = (req, res) => res.status(429).json({
    status: 'error',
    message: 'Too many requests. Please try again later.'
});

// Giới hạn tổng lưu lượng API theo địa chỉ IP để giảm lạm dụng dịch vụ.
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:api:') } : {})
});

// Giới hạn riêng các thao tác xác thực nhằm giảm brute-force tài khoản.
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:auth:v2:') } : {})
});

// Tách giới hạn đăng nhập khỏi OTP, refresh và hồ sơ để giảm khóa nhầm người dùng chung IP.
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:login:v1:') } : {})
});

// Hàm connectRateLimitStore: Kết nối Redis dùng chung để bộ đếm request nhất quán giữa nhiều instance backend.
export const connectRateLimitStore = async () => {
    if (!redisUrl) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('RATE_LIMIT_REDIS_URL or REDIS_URL is required in production');
        }
        return;
    }
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => console.error('[RATE_LIMIT_REDIS] Redis client error', error));
    await redisClient.connect();
};

// Hàm closeRateLimitStore: Đóng kết nối Redis khi tiến trình backend cần shutdown có kiểm soát.
export const closeRateLimitStore = async () => {
    if (redisClient?.isOpen) await redisClient.quit();
};

// Hàm parseTrustProxy: Chỉ nhận số hop hoặc danh sách proxy/CIDR tin cậy, không cho bật trust proxy dạng wildcard.
export const parseTrustProxy = (value = '') => {
    const normalized = value.trim();
    if (!normalized) return false;
    if (/^\d+$/.test(normalized)) return Number(normalized);
    const proxies = normalized.split(',').map((proxy) => proxy.trim()).filter(Boolean);
    if (proxies.length === 0 || proxies.some((proxy) => proxy === 'true' || proxy === '*')) {
        throw new Error('TRUST_PROXY must be a hop count or explicit proxy/CIDR list');
    }
    return proxies;
};

// Hàm sanitizeMongoInput: Loại khóa $ và dấu chấm khỏi request để client không thể gửi toán tử NoSQL.
export const sanitizeMongoInput = (req, res, next) => {
    const sanitize = (value) => mongoSanitize.sanitize(value, { allowDots: false });

    if (req.body) req.body = sanitize(req.body);
    if (req.params) req.params = sanitize(req.params);
    if (req.headers) sanitize(req.headers);

    const sanitizedQuery = sanitize(req.query);
    Object.defineProperty(req, 'query', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: sanitizedQuery
    });
    return next();
};
