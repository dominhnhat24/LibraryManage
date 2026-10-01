// Xác thực Bearer token JWT trên request và gắn payload đã giải mã vào req.user.
import jwt from 'jsonwebtoken';
import apiError from '../utils/api-error.js'; // Đảm bảo đường dẫn import đúng với cấu trúc của bạn

// Nhận req/res/next của Express; xác minh Authorization rồi chuyển lỗi hoặc gọi next().
// Khi hợp lệ, gắn payload token vào req.user; middleware không tự gửi response.
export const loginRequired = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // 1. Kiểm tra xem header có tồn tại không
        if (!authHeader) {
            throw new apiError(401, 'Missing authorization header');
        }

        // 2. Kiểm tra định dạng có bắt đầu bằng "Bearer " không
        if (!authHeader.startsWith('Bearer ')) {
            throw new apiError(401, 'Invalid token format, must start with Bearer');
        }

        // 3. Tách lấy token
        const token = authHeader.split(' ')[1];

        // 4. Giải mã và xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Gắn thông tin user vào req để các tầng sau sử dụng
        req.user = decoded;

        next();
    } catch (error) {
        // Nếu lỗi do jsonwebtoken (hết hạn, sai chữ ký, v.v.) hoặc lỗi do ApiError tự ném ra
        if (error.name === 'TokenExpiredError') {
            return next(new apiError(401, 'Token has expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new apiError(401, 'Invalid token signature'));
        }

        // Chuyển giao lỗi sang Global Error Handler
        return next(error);
    }
};