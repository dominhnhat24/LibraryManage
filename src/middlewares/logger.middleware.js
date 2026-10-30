// Import { randomUUID } từ node:crypto để dùng trong module.
/**
 * Tệp src/middlewares/logger.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { randomUUID } from 'node:crypto';

// Hàm loggerMiddleware: Ghi mã request, phương thức, đường dẫn không kèm query, mã HTTP và thời gian xử lý.
/**
 * Hàm loggerMiddleware: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: randomUUID, now, setHeader, once, info, next.
 */
export const loggerMiddleware = (req, res, next) => {
    // Khai báo requestId nhận giá trị từ randomUUID(). const giữ biến không gán lại; let cho phép cập nhật.
    const requestId = randomUUID();
    // Khai báo startedAt nhận giá trị từ Date.now(). const giữ biến không gán lại; let cho phép cập nhật.
    const startedAt = Date.now();
    // Gọi/thực thi res.setHeader với các đối số để thực hiện thao tác: res.setHeader('X-Request-Id', requestId)
    res.setHeader('X-Request-Id', requestId);
    // Gọi/thực thi res.once với các đối số để thực hiện thao tác: res.once('finish', () => {
    res.once('finish', () => {
        // Callback kết thúc response: Ghi nhận status và thời lượng sau khi Express gửi xong dữ liệu.
        // Khai báo elapsedMs nhận giá trị từ Date.now() - startedAt. const giữ biến không gán lại; let cho phép cập nhật.
        const elapsedMs = Date.now() - startedAt;
        // Gọi/thực thi console.info với các đối số để thực hiện thao tác: console.info(`[HTTP] ${requestId} ${req.method} ${req.path} ${res.statusCod
        console.info(`[HTTP] ${requestId} ${req.method} ${req.path} ${res.statusCode} ${elapsedMs}ms`);
    });
    // Gọi/thực thi next với các đối số để thực hiện thao tác: next()
    next();
};
