import Book from '../models/book.model.js';
import { slugify } from '../utils/slugify.util.js'; // (Tùy chọn) Hàm tạo slug từ tiêu đề
import ApiError from '../utils/api-error.js';
import mongoose from 'mongoose';
    // 1. Tạo sách mới
    export const createBook = async (bookData) => {
        // 1. Kiểm tra phòng thủ xem có title không
        if (!bookData.title) {
            throw new ApiError(400, 'Tiêu đề sách là bắt buộc.');
        }

        // 2. Tạo slug (nếu người dùng chưa tự truyền slug lên)
        const slug = bookData.slug ? slugify(bookData.slug) : slugify(bookData.title);

        // 3. Ánh xạ thành payload hoàn chỉnh (Đưa cả ...bookData và slug mới vào)
        const payload = {
            ...bookData,
            slug // Gắn slug đã được chuẩn hóa vào đây
        };

        // 4. Lưu xuống database bằng cái "gói" payload sạch sẽ
        const newBook = await Book.create(payload);
        return newBook;
    };

    // 2. Lấy danh sách sách có phân trang và lọc
    export const getAllBooks = async (filter, options) => {
        const { search, category, status, page = 1, limit = 10 } = filter;
        const query = {};

        // Tìm kiếm theo từ khóa (tiêu đề sách)
        if (search) {
            query.title = { $regex: search, $options: 'i' }; // Không phân biệt hoa thường
        }

        // Lọc theo thể loại
        if (category) {
            query.category = category;
        }

        // Lọc theo trạng thái
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const books = await Book.find(query)
            .populate('category', 'name slug') // Populate lấy thông tin thể loại nếu có
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBooks = await Book.countDocuments(query);

        return {
            books,
            pagination: {
                total: totalBooks,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalBooks / limit)
            }
        };
    }

    // 3. Lấy chi tiết sách theo ID hoặc Slug (Đồng thời tăng lượt xem)
    export const getBookByIdOrSlug = async (identifier) => {
        // Kiểm tra xem identifier là ObjectId hợp lệ hay là slug string
        const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
        
        const query = isObjectId ? { _id: identifier } : { slug: identifier };

        // Tìm sách và tăng `views_count` lên 1 đồng thời trả về dữ liệu mới nhất
        const book = await Book.findOneAndUpdate(
            query,
            { $inc: { views_count: 1 } },
            { new: true }
        ).populate('category', 'name slug');

        if (!book) {
            throw new Error('Không tìm thấy cuốn sách này.');
        }

        return book;
    }

    // 4. Cập nhật thông tin sách
    export const updateBook = async (bookId, updateData) => {
        if (updateData.title) {
            updateData.slug = slugify(updateData.title);
        }

        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            throw new Error('Không tìm thấy sách để cập nhật.');
        }

        return updatedBook;
    }

    // 5. Xóa sách
    export const deleteBook = async (bookId) => {
        const deletedBook = await Book.findByIdAndDelete(bookId);
        
        if (!deletedBook) {
            throw new Error('Không tìm thấy sách để xóa.');
        }

        return { message: 'Xóa sách thành công', deletedBook };
    }

    export const deleteBooksBulkService = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        const error = new Error('Danh sách ID sách không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    // Kiểm tra ID MongoDB trước khi truy vấn
    const invalidIds = ids.filter(
        (id) => !mongoose.isValidObjectId(id)
    );

    if (invalidIds.length > 0) {
        const error = new Error('Có ID sách không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const result = await Book.deleteMany({
        _id: { $in: ids },
    });

    return result.deletedCount;
    };
