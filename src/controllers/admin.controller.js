// [CONTROLLER QUẢN TRỊ] Cung cấp danh sách người dùng gần đây, xét thanh toán và upload file riêng tư.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { removePrivateBookFile } from '../utils/private-book-storage.js';
import Book from '../models/book.model.js';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
import Report from '../models/report.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// [50 TÀI KHOẢN MỚI NHẤT] Trả đúng 50 hồ sơ không chứa password hash hay refresh token.
export const getRecentUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .select('name email role is_premium premium_expires_at is_vip vip_expires_at createdAt')
        .sort({ createdAt: -1, _id: -1 }).limit(50).lean();
    return res.json({ status: 'success', data: users });
});

// [YÊU CẦU THANH TOÁN CHỜ DUYỆT] Admin xem danh sách yêu cầu chuyển khoản đang mở.
export const getPendingSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ status: 'pending' })
        .populate('user', 'name email').sort({ createdAt: 1 }).limit(100).lean();
    return res.json({ status: 'success', data: subscriptions });
});

// [QUẢN LÝ BÁO CÁO] Admin đọc yêu cầu liên hệ/lỗi mới nhất và trạng thái xử lý.
export const getReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({})
        .populate('user', 'name email').sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ status: 'success', data: reports });
});

// [CẬP NHẬT BÁO CÁO] Chỉ chấp nhận trạng thái nằm trong workflow hỗ trợ đã định nghĩa.
export const updateReportStatus = asyncHandler(async (req, res) => {
    const status = req.body.status;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
        throw new ApiError(400, 'Report status must be open, in_progress, or resolved');
    }
    const report = await Report.findByIdAndUpdate(req.params.reportId, { $set: { status } }, {
        new: true, runValidators: true
    });
    if (!report) throw new ApiError(404, 'Report not found');
    return res.json({ status: 'success', data: report });
});

// [UPLOAD SÁCH] Ghi tệp vào kho không public, chỉ lưu khóa ngẫu nhiên vào DB và dọn file nếu ghi DB lỗi.
export const uploadBookFile = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'A book file is required');
    const book = await Book.findById(req.params.bookId).select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    const extension = extname(req.file.originalname).toLowerCase();
    const allowedExtensions = new Set(['.epub', '.pdf', '.mp3', '.m4a', '.mp4', '.webm']);
    if (!allowedExtensions.has(extension)) {
        throw new ApiError(400, 'Only EPUB, PDF, MP3, M4A, MP4, or WEBM files are accepted');
    }
    if ((book.category === 'ebook' && !['.epub', '.pdf'].includes(extension))
        || (book.category === 'audiobook' && !['.mp3', '.m4a'].includes(extension))
        || (book.category === 'comic' && !['.pdf', '.epub', '.mp4', '.webm'].includes(extension))) {
        throw new ApiError(400, 'File type does not match the book category');
    }

    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    await mkdir(storageRoot, { recursive: true });
    const fileKey = `${randomUUID()}${extension}`;
    const filePath = resolve(storageRoot, fileKey);
    await writeFile(filePath, req.file.buffer, { flag: 'wx', mode: 0o600 });
    const previousFileKey = book.file_key;
    try {
        book.file_key = fileKey;
        book.file_original_name = req.file.originalname.slice(0, 200);
        await book.save();
    } catch (error) {
        await rm(filePath, { force: true });
        throw error;
    }
    if (previousFileKey) await removePrivateBookFile(previousFileKey);
    return res.json({
        status: 'success',
        message: 'Book file uploaded to private storage',
        data: { book_id: book.id, original_name: book.file_original_name }
    });
});

// [CẤP QUYỀN VIP] Admin mới được thay đổi role VIP; ngày hết hạn bắt buộc phải là ngày tương lai hợp lệ.
export const grantVip = asyncHandler(async (req, res) => {
    const expiresAt = new Date(req.body.vip_expires_at);
    if (!req.body.vip_expires_at || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new ApiError(400, 'A future vip_expires_at timestamp is required');
    }
    const user = await User.findOneAndUpdate({
        _id: req.params.userId,
        role: { $ne: 'admin' }
    }, {
        $set: { role: 'vip', is_vip: true, vip_expires_at: expiresAt }
    }, { new: true, runValidators: true });
    if (!user) {
        const existingUser = await User.findById(req.params.userId).select('role');
        if (!existingUser) throw new ApiError(404, 'User not found');
        throw new ApiError(409, 'Admin accounts cannot be changed to VIP');
    }
    return res.json({ status: 'success', data: user.toPublicJSON() });
});
