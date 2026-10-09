// [CONTROLLER SÁCH] Cung cấp catalog, chi tiết chương và thao tác CRUD cho quản trị viên.
import Book from '../models/book.model.js';
import Comment from '../models/comment.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { removePrivateBookFile } from '../utils/private-book-storage.js';

// [LỌC TÌM KIẾM] Thoát ký tự regex và chỉ nhận các bộ lọc được hỗ trợ từ query string.
const safeRegex = (value) => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const publicBook = (book, canReadPaid) => {
    const data = book.toObject ? book.toObject() : book;
    data.author = data.author_name;
    data.coverImage = data.cover_url;
    data.publishedAt = data.publication_year ? String(data.publication_year) : data.createdAt;
    delete data.content;
    if (Array.isArray(data.chapters)) {
        data.chapters = data.chapters.map(({ content, ...chapter }) => (
            !book.is_free && !canReadPaid ? { ...chapter, locked: true } : chapter
        ));
    }
    return data;
};

// [DANH SÁCH SÁCH] Tìm theo tên/tác giả/năm/danh mục và phân trang với giới hạn an toàn.
export const listBooks = asyncHandler(async (req, res) => {
    const filter = { status: 'published' };
    if (req.query.title) filter.title = safeRegex(String(req.query.title).slice(0, 100));
    if (req.query.author) filter.author_name = safeRegex(String(req.query.author).slice(0, 100));
    if (req.query.category) {
        const categories = ['ebook', 'audiobook', 'comic', 'webnovel'];
        if (typeof req.query.category !== 'string' || !categories.includes(req.query.category)) {
            throw new ApiError(400, 'Book category is invalid');
        }
        filter.category = req.query.category;
    }
    if (req.query.year) {
        const year = Number(req.query.year);
        if (!Number.isInteger(year) || year < 1 || year > 3000) {
            throw new ApiError(400, 'Publication year is invalid');
        }
        filter.publication_year = year;
    }
    if (req.query.search) filter.$text = { $search: String(req.query.search).slice(0, 100) };
    const page = Math.min(100000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [books, total] = await Promise.all([
        Book.find(filter).select('-chapters.content').sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(limit).lean(),
        Book.countDocuments(filter)
    ]);
    return res.json({
        status: 'success',
        data: books,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

// [SÁCH CỦA TÁC GIẢ] Hiển thị bản thảo/sách webnovel thuộc chính tài khoản author đang đăng nhập.
export const getMyBooks = asyncHandler(async (req, res) => {
    const books = await Book.find({ owner: req.authUser._id, category: 'webnovel' })
        .sort({ updatedAt: -1 }).lean();
    return res.json({ status: 'success', data: books });
});

// [CHI TIẾT SÁCH] Trả metadata công khai, khóa nội dung chương trả phí nếu chưa có quyền.
export const getBook = asyncHandler(async (req, res) => {
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' })
        .select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    return res.json({
        status: 'success',
        data: publicBook(book, Boolean(req.authUser?.hasActivePremium()))
    });
});

// [NẠP SÁCH CÓ QUYỀN] Dùng chung kiểm tra publication và entitlement giữa stream và chapter.
const findAccessibleBook = async (req) => {
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' });
    if (!book) throw new ApiError(404, 'Book not found');
    if (!book.is_free && !req.authUser.hasActivePremium()) {
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    return book;
};

// [KIỂM TRA QUYỀN TRUY CẬP] Nạp sách đã xuất bản và chặn tài khoản Free khỏi nội dung trả phí.
export const loadAccessibleBook = asyncHandler(async (req, res, next) => {
    req.book = await findAccessibleBook(req);
    return next();
});

// [KIỂM TRA QUYỀN ĐỌC] Nạp sách/chương và ngăn Free truy cập nội dung trả phí.
export const loadReadableBook = asyncHandler(async (req, res, next) => {
    const book = await findAccessibleBook(req);
    if (!book.chapters.id(req.params.chapterId)) throw new ApiError(404, 'Chapter not found');
    if (!book.is_free && !req.authUser.hasActivePremium()) {
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    req.book = book;
    return next();
});

// [TẠO SÁCH] Chỉ nhận các trường được phép, gắn chủ sở hữu từ token thay vì client.
export const createBook = asyncHandler(async (req, res) => {
    const authorMode = req.authUser.role === 'author';
    if (authorMode && req.body.category && req.body.category !== 'webnovel') {
        throw new ApiError(403, 'Authors can only create webnovel content');
    }
    const allowed = authorMode
        ? ['title', 'description', 'cover_url', 'chapters']
        : ['title', 'author_name', 'category', 'publication_year', 'description',
            'cover_url', 'is_free', 'chapters', 'status'];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (authorMode) {
        payload.author_name = req.authUser.name;
        payload.category = 'webnovel';
        payload.is_free = true;
    }
    const book = await Book.create({ ...payload, owner: req.authUser._id });
    return res.status(201).json({ status: 'success', data: book });
});

// [CẬP NHẬT SÁCH] Giới hạn trường cập nhật, không cho ghi owner/file_key từ JSON.
export const updateBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.bookId);
    if (!book) throw new ApiError(404, 'Book not found');
    const authorMode = req.authUser.role === 'author';
    if (authorMode && (String(book.owner) !== String(req.authUser._id) || book.category !== 'webnovel')) {
        throw new ApiError(403, 'Authors can only edit their own webnovel content');
    }
    const allowed = authorMode
        ? ['title', 'description', 'cover_url', 'chapters']
        : ['title', 'author_name', 'category', 'publication_year', 'description',
            'cover_url', 'is_free', 'chapters', 'status'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    Object.assign(book, update);
    await book.save();
    return res.json({ status: 'success', data: book });
});

// [XÓA SÁCH] Xóa record sách; tệp lưu riêng được quản lý bởi tuyến upload, không public trực tiếp.
export const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.bookId).select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    await book.deleteOne();
    await Comment.deleteMany({ book: book._id });
    await removePrivateBookFile(book.file_key);
    return res.json({ status: 'success', message: 'Book deleted successfully' });
});
