export const checkRole = (requiredRole) => {
    return (req, res, next) => {
        // 1. Kiểm tra xem req.user có tồn tại không (phòng hờ quên gắn LoginRequired trước đó)
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized: User not authenticated"
            });
        }

        // 2. So sánh role của user với role được yêu cầu
        if (req.user.role !== requiredRole) {
            return res.status(403).json({
                status: "error",
                message: `Forbidden: Requires '${requiredRole}' role`
            });
        }

        // 3. Đúng quyền, cho phép đi tiếp
        next();
    };
};