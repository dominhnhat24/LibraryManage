// Hàm asyncHandler: Bọc controller bất đồng bộ và tự chuyển lỗi Promise sang luồng xử lý lỗi Express.
export const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};
