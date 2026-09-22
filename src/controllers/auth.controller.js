const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        // Truyền toàn bộ req.body (gồm username, email, password, phone, cccd) xuống Service
        const result = await authService.serviceRegister(req.body);

        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: result
        });
    } catch (error) {
        next(error); // Đẩy lỗi qua Middleware xử lý lỗi tập trung của bạn
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.serviceLogin(email, password);

        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};