import * as db from '../models/init.js';
import { BorrowCards } from '../models/init.js';
import apiError from '../utils/api-error.js';
import { emailInUse, normalizeEmail } from './email-identity.service.js';
import bcrypt from 'bcrypt';

// 1. Lấy danh sách tất cả độc giả (sắp xếp mới nhất lên đầu)
export const getAllReaders = async (query = {}) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const filter = query.search
        ? { $or: ['full_name', 'email', 'phone'].map((field) => ({ [field]: { $regex: query.search, $options: 'i' } })) }
        : {};
    const [readers, total] = await Promise.all([
        db.Readers.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        db.Readers.countDocuments(filter)
    ]);
    return { data: readers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// 2. Lấy thông tin chi tiết một độc giả theo ID
export const getReaderById = async (readerId) => {
    const readerItem = await db.Readers.findById(readerId);
    if (!readerItem) {
        throw new apiError(404, 'Reader not found');
    }
    return readerItem;
};

// 3. Tạo mới một độc giả (Đăng ký thẻ thư viện)
export const createReader = async (readerData) => {
    if (typeof readerData.password !== 'string' || readerData.password.length < 6 || readerData.password.length > 128) {
        throw new apiError(400, 'Password must be between 6 and 128 characters long');
    }
    const email = normalizeEmail(readerData.email);
    if (await emailInUse(email)) {
        throw new apiError(409, 'Email is already registered by another reader');
    }

    const password_hash = await bcrypt.hash(readerData.password, 10);
    const reader = await db.Readers.create({
        full_name: readerData.full_name,
        email,
        password_hash,
        phone: readerData.phone,
        address: readerData.address,
        status: readerData.status || 'Active' // Trạng thái mặc định là Active
    });
    reader.password_hash = undefined;
    return reader;
};

// 4. Cập nhật thông tin độc giả
export const updateReader = async (readerId, readerData) => {
    // Đảm bảo độc giả tồn tại trước khi update (hàm này sẽ ném lỗi 404 nếu không tìm thấy)
    const readerItem = await getReaderById(readerId);

    if (Object.prototype.hasOwnProperty.call(readerData, 'full_name')) {
        readerItem.full_name = readerData.full_name;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'email')) {
        const email = normalizeEmail(readerData.email);
        if (await emailInUse(email, { excludeReaderId: readerId })) {
            throw new apiError(409, 'Email is already in use by another reader');
        }
        readerItem.email = email;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'phone')) {
        readerItem.phone = readerData.phone;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'address')) {
        readerItem.address = readerData.address;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'status')) {
        readerItem.status = readerData.status;
    }

    await readerItem.save();
    return readerItem;
};

// 5. Xóa hoặc khóa tài khoản độc giả
export const deleteReader = async (readerId) => {
    const reader = await getReaderById(readerId);
    const activeBorrow = await BorrowCards.exists({
        readerId,
        status: { $in: ['Pending', 'Borrowing', 'PartiallyReturned', 'Overdue'] }
    });
    if (activeBorrow) {
        reader.status = 'Blocked';
        await reader.save();
        return reader;
    }
    await db.Readers.findByIdAndDelete(readerId);
};
