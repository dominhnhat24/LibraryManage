const db = require('../../models'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const ApiError = require('../utils/api-error');

const User = db.users;

export const generateAccessToken = (user) => {
    return jwt.sign(    
        {
            id: user.id,
            role: user.role // Đưa role vào đây để middleware checkRole sử dụng!
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );
};

export const serviceRegister = async (userData) => { // Nhận vào cả cục userData từ Controller cho gọn
    const { username, email, password, phone, cccd } = userData;

    // Kiểm tra trùng email (có thể check thêm username hoặc cccd nếu muốn)
    const existingUser = await User.findOne({
        where: { email }
    });

    if (existingUser) {
        throw new ApiError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới kèm theo các trường bổ sung và role mặc định là 'user'
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        phone,
        cccd,
        role: 'user' // Mặc định đăng ký qua API là độc giả (user)
    });

    const accessToken = generateAccessToken(newUser);

    return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        accessToken
    };
};

const serviceLogin = async (email, password) => {
    const user = await User.findOne({
        where: { email }
    });

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken(user);

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accessToken
    };
};
