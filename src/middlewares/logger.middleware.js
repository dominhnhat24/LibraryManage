import { randomUUID } from 'node:crypto';

// Hàm loggerMiddleware: Ghi mã request, phương thức, đường dẫn không kèm query, mã HTTP và thời gian xử lý.
export const loggerMiddleware = (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    res.setHeader('X-Request-Id', requestId);
    res.once('finish', () => {
        // Callback kết thúc response: Ghi nhận status và thời lượng sau khi Express gửi xong dữ liệu.
        const elapsedMs = Date.now() - startedAt;
        console.info(`[HTTP] ${requestId} ${req.method} ${req.path} ${res.statusCode} ${elapsedMs}ms`);
    });
    next();
};
