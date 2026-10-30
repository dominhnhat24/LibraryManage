// Import mongoSanitize từ express-mongo-sanitize để dùng trong module.
/**
 * Tệp src/middlewares/security.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import mongoSanitize from 'express-mongo-sanitize';
// Import { rateLimit } từ express-rate-limit để dùng trong module.
import { rateLimit } from 'express-rate-limit';
// Import { createClient } từ redis để dùng trong module.
import { createClient } from 'redis';
// Import { RedisStore } từ rate-limit-redis để dùng trong module.
import { RedisStore } from 'rate-limit-redis';

// Khai báo redisUrl nhận giá trị từ process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_U. const giữ biến không gán lại; let cho phép cập nhật.
const redisUrl = process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL;
// Khai báo redisClient nhận giá trị từ redisUrl ? createClient({ url: redisUrl }) : undefined. const giữ biến không gán lại; let cho phép cập nhật.
const redisClient = redisUrl ? createClient({ url: redisUrl }) : undefined;
// Khai báo redisConnectionPromise nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
let redisConnectionPromise;

// if chỉ chạy nhánh này khi điều kiện redisClient đúng.
if (redisClient) {
    // Gọi/thực thi redisClient.on với các đối số để thực hiện thao tác: redisClient.on('error', (error) => console.error('[RATE_LIMIT_REDIS] Redis
    redisClient.on('error', (error) => console.error('[RATE_LIMIT_REDIS] Redis client error', error));
}

/**
 * Hàm connectRedisClient: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: connect.
 */
const connectRedisClient = async () => {
    // if chỉ chạy nhánh này khi điều kiện !redisClient || redisClient.isOpen đúng.
    if (!redisClient || redisClient.isOpen) return redisClient;
    // Gọi/thực thi redisClient.connect với các đối số để thực hiện thao tác: redisConnectionPromise ??= redisClient.connect()
    redisConnectionPromise ??= redisClient.connect();
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await redisConnectionPromise
    await redisConnectionPromise;
    // return kết thúc hàm và trả redisClient về nơi gọi.
    return redisClient;
};

/**
 * Hàm createStore: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: prefix.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: RedisStore, async, connectRedisClient, sendCommand.
 */
const createStore = (prefix) => redisUrl
    ? new RedisStore({
        // Khóa prefix nhận biến cùng tên làm giá trị.
        prefix,
        // Trường sendCommand lưu async (...args) => { const client = await connectRedisC làm giá trị trong object.
        sendCommand: async (...args) => {
            // Khai báo client nhận giá trị từ await connectRedisClient(). const giữ biến không gán lại; let cho phép cập nhật.
            const client = await connectRedisClient();
            // return kết thúc hàm và trả client.sendCommand(args) về nơi gọi.
            return client.sendCommand(args);
        }
    })
    : undefined;

/**
 * Hàm rateLimitResponse: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: status, json.
 */
const rateLimitResponse = (req, res) => res.status(429).json({
    // Trường status lưu 'error' làm giá trị trong object.
    status: 'error',
    // Trường message lưu 'Too many requests. Please try again later.' làm giá trị trong object.
    message: 'Too many requests. Please try again later.'
});

// Giới hạn tổng lưu lượng API theo địa chỉ IP để giảm lạm dụng dịch vụ.
// Khai báo apiRateLimiter nhận giá trị từ rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, stand. const giữ biến không gán lại; let cho phép cập nhật.
export const apiRateLimiter = rateLimit({
    // Trường windowMs lưu 15 * 60 * 1000 làm giá trị trong object.
    windowMs: 15 * 60 * 1000,
    // Trường limit lưu 300 làm giá trị trong object.
    limit: 300,
    // Trường standardHeaders lưu 'draft-8' làm giá trị trong object.
    standardHeaders: 'draft-8',
    // Trường legacyHeaders lưu false làm giá trị trong object.
    legacyHeaders: false,
    // Trường handler lưu rateLimitResponse làm giá trị trong object.
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:api:') } : {})
});

// Giới hạn riêng các thao tác xác thực nhằm giảm brute-force tài khoản.
// Khai báo authRateLimiter nhận giá trị từ rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standa. const giữ biến không gán lại; let cho phép cập nhật.
export const authRateLimiter = rateLimit({
    // Trường windowMs lưu 15 * 60 * 1000 làm giá trị trong object.
    windowMs: 15 * 60 * 1000,
    // Trường limit lưu 30 làm giá trị trong object.
    limit: 30,
    // Trường standardHeaders lưu 'draft-8' làm giá trị trong object.
    standardHeaders: 'draft-8',
    // Trường legacyHeaders lưu false làm giá trị trong object.
    legacyHeaders: false,
    // Trường handler lưu rateLimitResponse làm giá trị trong object.
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:auth:v2:') } : {})
});

// Tách giới hạn đăng nhập khỏi OTP, refresh và hồ sơ để giảm khóa nhầm người dùng chung IP.
// Khai báo loginRateLimiter nhận giá trị từ rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standa. const giữ biến không gán lại; let cho phép cập nhật.
export const loginRateLimiter = rateLimit({
    // Trường windowMs lưu 15 * 60 * 1000 làm giá trị trong object.
    windowMs: 15 * 60 * 1000,
    // Trường limit lưu 10 làm giá trị trong object.
    limit: 10,
    // Trường standardHeaders lưu 'draft-8' làm giá trị trong object.
    standardHeaders: 'draft-8',
    // Trường legacyHeaders lưu false làm giá trị trong object.
    legacyHeaders: false,
    // Trường handler lưu rateLimitResponse làm giá trị trong object.
    handler: rateLimitResponse,
    ...(redisUrl ? { store: createStore('openbook:rate-limit:login:v1:') } : {})
});

// Hàm connectRateLimitStore: Kết nối Redis dùng chung để bộ đếm request nhất quán giữa nhiều instance backend.
/**
 * Hàm connectRateLimitStore: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Error, connectRedisClient.
 */
export const connectRateLimitStore = async () => {
    // if chỉ chạy nhánh này khi điều kiện !redisUrl đúng.
    if (!redisUrl) {
        // if chỉ chạy nhánh này khi điều kiện process.env.NODE_ENV === 'production' đúng.
        if (process.env.NODE_ENV === 'production') {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new Error('RATE_LIMIT_REDIS_URL or REDIS_URL is required in production');
        }
        // return kết thúc hàm và trả undefined về nơi gọi.
        return;
    }
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await connectRedisClient()
    await connectRedisClient();
};

// Hàm closeRateLimitStore: Đóng kết nối Redis khi tiến trình backend cần shutdown có kiểm soát.
/**
 * Hàm closeRateLimitStore: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: quit.
 */
export const closeRateLimitStore = async () => {
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await redisConnectionPromise?.catch(() => {})
    await redisConnectionPromise?.catch(() => {});
    // if chỉ chạy nhánh này khi điều kiện redisClient?.isOpen đúng.
    if (redisClient?.isOpen) await redisClient.quit();
    // Gọi/thực thi biểu thức để thực hiện thao tác: redisConnectionPromise = undefined
    redisConnectionPromise = undefined;
};

// Hàm parseTrustProxy: Chỉ nhận số hop hoặc danh sách proxy/CIDR tin cậy, không cho bật trust proxy dạng wildcard.
/**
 * Hàm parseTrustProxy: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value mặc định ''.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: trim, test, Number, split, map, filter, some, Error.
 */
export const parseTrustProxy = (value = '') => {
    // Khai báo normalized nhận giá trị từ value.trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const normalized = value.trim();
    // if chỉ chạy nhánh này khi điều kiện !normalized đúng.
    if (!normalized) return false;
    // if chỉ chạy nhánh này khi điều kiện /^\d+$/.test(normalized) đúng.
    if (/^\d+$/.test(normalized)) return Number(normalized);
    // Khai báo proxies nhận giá trị từ normalized.split(',').map((proxy) => proxy.trim()).filt. const giữ biến không gán lại; let cho phép cập nhật.
    const proxies = normalized.split(',').map((proxy) => proxy.trim()).filter(Boolean);
    // if chỉ chạy nhánh này khi điều kiện proxies.length === 0 || proxies.some((proxy) => proxy === 'true' || proxy = đúng.
    if (proxies.length === 0 || proxies.some((proxy) => proxy === 'true' || proxy === '*')) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new Error('TRUST_PROXY must be a hop count or explicit proxy/CIDR list');
    }
    // return kết thúc hàm và trả proxies về nơi gọi.
    return proxies;
};

// Hàm sanitizeMongoInput: Loại khóa $ và dấu chấm khỏi request để client không thể gửi toán tử NoSQL.
/**
 * Hàm sanitizeMongoInput: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: sanitize, defineProperty, next.
 */
export const sanitizeMongoInput = (req, res, next) => {
    /**
     * Hàm sanitize: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: value.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     */
    const sanitize = (value) => mongoSanitize.sanitize(value, { allowDots: false });

    // if chỉ chạy nhánh này khi điều kiện req.body đúng.
    if (req.body) req.body = sanitize(req.body);
    // if chỉ chạy nhánh này khi điều kiện req.params đúng.
    if (req.params) req.params = sanitize(req.params);
    // if chỉ chạy nhánh này khi điều kiện req.headers đúng.
    if (req.headers) sanitize(req.headers);

    // Khai báo sanitizedQuery nhận giá trị từ sanitize(req.query). const giữ biến không gán lại; let cho phép cập nhật.
    const sanitizedQuery = sanitize(req.query);
    // Gọi/thực thi Object.defineProperty với các đối số để thực hiện thao tác: Object.defineProperty(req, 'query', { configurable: true, enumerable: true,
    Object.defineProperty(req, 'query', {
        // Trường configurable lưu true làm giá trị trong object.
        configurable: true,
        // Trường enumerable lưu true làm giá trị trong object.
        enumerable: true,
        // Trường writable lưu true làm giá trị trong object.
        writable: true,
        // Trường value lưu sanitizedQuery làm giá trị trong object.
        value: sanitizedQuery
    });
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
};
