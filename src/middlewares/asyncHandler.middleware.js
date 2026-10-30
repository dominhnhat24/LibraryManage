// Hàm asyncHandler: Bọc controller bất đồng bộ và tự chuyển lỗi Promise sang luồng xử lý lỗi Express.
/**
 * Hàm asyncHandler: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: handler.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: resolve, handler.
 */
/**
 * Tệp src/middlewares/asyncHandler.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
export const asyncHandler = (handler) => (req, res, next) => {
    // Gọi/thực thi Promise.resolve với các đối số để thực hiện thao tác: Promise.resolve(handler(req, res, next)).catch(next)
    Promise.resolve(handler(req, res, next)).catch(next);
};
