import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Readers, Librarians } from '../models/init.js';
import ApiError from '../utils/api-error.js';
import { emailInUse, emailLookupPattern, normalizeEmail } from './email-identity.service.js';

export const generateAccessToken = (user) => {
    return jwt.sign(    
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );
};

export const serviceRegister = async (userData) => { // Nhận vào cả cục userData từ Controller cho gọn
    const { username, full_name, email, password, phone, address } = userData;
    const normalizedEmail = normalizeEmail(email);

    if (await emailInUse(normalizedEmail)) {
        throw new ApiError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới kèm theo các trường bổ sung và role mặc định là 'user'
    const newUser = await Readers.create({
        full_name: full_name || username,
        email: normalizedEmail,
        password_hash: hashedPassword,
        phone,
        address
    });

    const accessToken = generateAccessToken({ ...newUser.toObject(), role: 'reader' });

    return {
        id: newUser._id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: 'reader',
        accessToken
    };
};

export const serviceLogin = async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const [reader, librarian] = await Promise.all([
        Readers.findOne({ email: emailLookupPattern(normalizedEmail) }).select('+password_hash'),
        Librarians.findOne({ email: emailLookupPattern(normalizedEmail) })
    ]);
    if (reader && librarian) {
        throw new ApiError(409, 'Email is associated with multiple accounts; contact support');
    }
    const user = reader || librarian;

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }
    if (librarian && librarian.status === 'Blocked') {
        throw new ApiError(403, 'Librarian account is blocked');
    }
    if (reader && reader.status === 'Blocked') {
        throw new ApiError(403, 'Reader account is blocked');
    }

    const passwordHash = user.password_hash || user.hash_pass;
    const isPasswordValid = passwordHash
        ? await bcrypt.compare(password, passwordHash)
        : false;

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const role = reader ? 'reader' : 'librarian';
    const accessToken = generateAccessToken({ ...user.toObject(), role });

    return {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role,
        accessToken
    };
};
