import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Book from '../models/book.model.js';
import Chapter from '../models/chapter.model.js';
import Comment from '../models/comment.model.js';
import Bookmark from '../models/bookmarks.js';
import ReadingProgress from '../models/reading-progress.model.js';
import Subscription from '../models/subscription.model.js';
import Report from '../models/report.model.js';
import ApiError from '../utils/api-error.js';
import { removePrivateBookFile } from '../utils/private-book-storage.js';
import { ROLES } from '../constants/roles.constant.js';
import { PAGINATION } from '../constants/pagination.constant.js';

// Hàm createUser: Băm mật khẩu, gán role mặc định USER và tạo tài khoản không nhận quyền/secret từ client.
export const createUser = async (userData) => {
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
        throw new ApiError(400, 'User data must be an object');
    }
    const { name, email, phone_number, password } = userData;
    if (!name || !email || typeof password !== 'string') {
        throw new ApiError(400, 'Name, email and password are required');
    }
    const payload = {
        name,
        email,
        phone_number: phone_number || null,
        password_hash: await bcrypt.hash(password, 12),
        role: ROLES.USER
    };
    const user = await User.create(payload);
    return user.toPublicJSON();
};

// Hàm getAllUsers: Trả danh sách tài khoản phân trang, tìm theo tên/email và chỉ populate dữ liệu an toàn.
export const getAllUsers = async (filters = {}) => {
    const page = Math.max(PAGINATION.DEFAULT_PAGE, Number.parseInt(filters.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1,
        Number.parseInt(filters.limit, 10) || PAGINATION.DEFAULT_LIMIT));
    const query = {};
    if (filters.role) {
        if (!Object.values(ROLES).includes(filters.role)) throw new ApiError(400, 'User role filter is invalid');
        query.role = filters.role;
    }
    if (typeof filters.search === 'string' && filters.search.trim()) {
        const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } }
        ];
    }
    const [users, total] = await Promise.all([
        User.find(query).select('name email phone_number role is_premium premium_expires_at is_vip vip_expires_at createdAt')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        User.countDocuments(query)
    ]);
    return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Hàm getUserById: Nạp hồ sơ công khai theo ID và trả 404 khi không tồn tại.
export const getUserById = async (userId) => {
    const user = await User.findById(userId)
        .select('name email phone_number role is_premium premium_expires_at is_vip vip_expires_at createdAt updatedAt');
    if (!user) throw new ApiError(404, 'User not found');
    return user.toPublicJSON();
};

// Hàm updateUser: Cập nhật thông tin được whitelist; mã hóa mật khẩu mới và chỉ cho Admin đổi role ADMIN/USER.
export const updateUser = async (userId, updateData) => {
    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
        throw new ApiError(400, 'User update must be an object');
    }
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    const allowedFields = ['name', 'email', 'phone_number', 'password', 'role'];
    const payload = Object.fromEntries(Object.entries(updateData)
        .filter(([field]) => allowedFields.includes(field)));
    if (payload.password !== undefined) {
        payload.password_hash = await bcrypt.hash(payload.password, 12);
        delete payload.password;
    }
    Object.assign(user, payload);
    await user.save();
    return user.toPublicJSON();
};

// Hàm deleteUser: Xóa user cùng dữ liệu cá nhân và nội dung sở hữu trong transaction, rồi dọn file sách riêng tư.
export const deleteUser = async (userId) => {
    const session = await mongoose.startSession();
    let deletedUser;
    let privateFileKeys = [];
    try {
        await session.withTransaction(async () => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new ApiError(404, 'User not found');
            deletedUser = user.toPublicJSON();

            const ownedBooks = await Book.find({ owner: userId })
                .select('+file_key')
                .session(session)
                .lean();
            const ownedBookIds = ownedBooks.map((book) => book._id);
            privateFileKeys = ownedBooks.map((book) => book.file_key).filter(Boolean);

            if (ownedBookIds.length > 0) {
                await Chapter.deleteMany({ book_id: { $in: ownedBookIds } }, { session });
            }
            const relatedBookFilter = ownedBookIds.length > 0
                ? { $or: [{ user: userId }, { book: { $in: ownedBookIds } }] }
                : { user: userId };
            await Comment.deleteMany(relatedBookFilter, { session });
            await Bookmark.deleteMany(relatedBookFilter, { session });
            await ReadingProgress.deleteMany(relatedBookFilter, { session });
            await Report.deleteMany({ user: userId }, { session });
            await Subscription.deleteMany({ user: userId }, { session });
            await Subscription.updateMany(
                { reviewed_by: userId },
                { $set: { reviewed_by: null } },
                { session }
            );
            await Book.deleteMany({ owner: userId }, { session });
            await User.deleteOne({ _id: userId }, { session });
        });
    } finally {
        await session.endSession();
    }

    const fileCleanupResults = await Promise.allSettled(privateFileKeys.map(removePrivateBookFile));
    const fileCleanupFailures = fileCleanupResults.filter((result) => result.status === 'rejected');
    if (fileCleanupFailures.length > 0) {
        console.error(`[USER_DELETE] Could not remove ${fileCleanupFailures.length} private book file(s)`);
        throw new ApiError(500, 'User data was deleted, but one or more private book files could not be removed');
    }
    return deletedUser;
};

// Hàm grantVipToUser: Cấp quyền VIP cho USER đến một ngày tương lai mà không đổi role phân quyền; ADMIN không bị sửa.
export const grantVipToUser = async (userId, expiresAtValue) => {
    const expiresAt = new Date(expiresAtValue);
    if (!expiresAtValue || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new ApiError(400, 'A future vip_expires_at timestamp is required');
    }
    const user = await User.findOneAndUpdate({
        _id: userId,
        role: { $ne: ROLES.ADMIN }
    }, {
        $set: { is_vip: true, vip_expires_at: expiresAt }
    }, { new: true, runValidators: true });
    if (!user) {
        const existingUser = await User.findById(userId).select('role');
        if (!existingUser) throw new ApiError(404, 'User not found');
        if (existingUser.role === ROLES.ADMIN) throw new ApiError(409, 'Admin accounts cannot be changed to VIP');
        throw new ApiError(409, 'User could not be granted VIP access');
    }
    return user.toPublicJSON();
};
