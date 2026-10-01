
// Bọc handler Express bất đồng bộ để chuyển Promise bị từ chối sang middleware lỗi.
// Nhận handler dùng req/res/next; trả middleware bọc và không tự định dạng response.
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

export default asyncHandler;