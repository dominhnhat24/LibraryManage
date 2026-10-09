// [UTIL] Chuyển lỗi bất đồng bộ của controller sang middleware lỗi Express.
export const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};
