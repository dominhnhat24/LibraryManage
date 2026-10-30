// Import Book từ ../models/book.model.js để dùng trong module.
/**
 * Tệp src/services/book.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Book from '../models/book.model.js';
// Import { slugify } từ ../utils/slugify.util.js để dùng trong module.
import { slugify } from '../utils/slugify.util.js'; // (Tùy chọn) Hàm tạo slug từ tiêu đề
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import mongoose từ mongoose để dùng trong module.
import mongoose from 'mongoose';
    // 1. Tạo sách mới
    /**
     * Hàm createBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: bookData.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: ApiError, slug, slugify, nh, create.
     */
    export const createBook = async (bookData) => {
        // 1. Kiểm tra phòng thủ xem có title không
        // if chỉ chạy nhánh này khi điều kiện !bookData.title đúng.
        if (!bookData.title) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Tiêu đề sách là bắt buộc.');
        }

        // 2. Tạo slug (nếu người dùng chưa tự truyền slug lên)
        // Khai báo slug nhận giá trị từ bookData.slug ? slugify(bookData.slug) : slugify(bookDa. const giữ biến không gán lại; let cho phép cập nhật.
        const slug = bookData.slug ? slugify(bookData.slug) : slugify(bookData.title);

        // 3. Ánh xạ thành payload hoàn chỉnh (Đưa cả ...bookData và slug mới vào)
        // Khai báo payload nhận giá trị từ { ...bookData, slug. const giữ biến không gán lại; let cho phép cập nhật.
        const payload = {
            ...bookData,
            // Khóa slug nhận biến cùng tên làm giá trị.
            slug // Gắn slug đã được chuẩn hóa vào đây
        };

        // 4. Lưu xuống database bằng cái "gói" payload sạch sẽ
        // Khai báo newBook nhận giá trị từ await Book.create(payload). const giữ biến không gán lại; let cho phép cập nhật.
        const newBook = await Book.create(payload);
        // return kết thúc hàm và trả newBook về nơi gọi.
        return newBook;
    };

    // 2. Lấy danh sách sách có phân trang và lọc
    /**
     * Hàm getAllBooks: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: filter, options.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: a, find, populate, sort, skip, limit, countDocuments, Number.
     */
    export const getAllBooks = async (filter, options) => {
        // Khai báo { search, category, genre, status, pag nhận giá trị từ filter. const giữ biến không gán lại; let cho phép cập nhật.
        const { search, category, genre, status, page = 1, limit = 10 } = filter;
        // Khai báo query nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
        const query = {};

        // Tìm kiếm theo từ khóa (tiêu đề sách)
        // if chỉ chạy nhánh này khi điều kiện search đúng.
        if (search) {
            // Gọi/thực thi biểu thức để thực hiện thao tác: query.title = { $regex: search, $options: 'i' }
            query.title = { $regex: search, $options: 'i' }; // Không phân biệt hoa thường
        }

        // Lọc theo thể loại
        // if chỉ chạy nhánh này khi điều kiện category đúng.
        if (category) {
            // Gọi/thực thi biểu thức để thực hiện thao tác: query.category = category
            query.category = category;
        }

        // if chỉ chạy nhánh này khi điều kiện genre đúng.
        if (genre) {
            // Gọi/thực thi biểu thức để thực hiện thao tác: query.genre = genre
            query.genre = genre;
        }

        // Lọc theo trạng thái
        // if chỉ chạy nhánh này khi điều kiện status đúng.
        if (status) {
            // Gọi/thực thi biểu thức để thực hiện thao tác: query.status = status
            query.status = status;
        }

        // Khai báo skip nhận giá trị từ (page - 1) * limit. const giữ biến không gán lại; let cho phép cập nhật.
        const skip = (page - 1) * limit;

        // Khai báo books nhận giá trị từ await Book.find(query) .populate('category', 'name slug. const giữ biến không gán lại; let cho phép cập nhật.
        const books = await Book.find(query)
            .populate('category', 'name slug') // Populate lấy thông tin thể loại nếu có
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Khai báo totalBooks nhận giá trị từ await Book.countDocuments(query). const giữ biến không gán lại; let cho phép cập nhật.
        const totalBooks = await Book.countDocuments(query);

        // return kết thúc hàm và trả { books, pagination: { total: totalBooks, page: Number(page), limit: Number về nơi gọi.
        return {
            // Khóa books nhận biến cùng tên làm giá trị.
            books,
            // Trường pagination lưu { total: totalBooks, page: Number(page), limit: Number( làm giá trị trong object.
            pagination: {
                // Trường total lưu totalBooks làm giá trị trong object.
                total: totalBooks,
                // Trường page lưu Number(page) làm giá trị trong object.
                page: Number(page),
                // Trường limit lưu Number(limit) làm giá trị trong object.
                limit: Number(limit),
                // Trường totalPages lưu Math.ceil(totalBooks / limit) làm giá trị trong object.
                totalPages: Math.ceil(totalBooks / limit)
            }
        };
    }

    // 3. Lấy chi tiết sách theo ID hoặc Slug (Đồng thời tăng lượt xem)
    /**
     * Hàm getBookByIdOrSlug: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: identifier.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: match, findOneAndUpdate, select, populate, Error.
     */
    export const getBookByIdOrSlug = async (identifier) => {
        // Kiểm tra xem identifier là ObjectId hợp lệ hay là slug string
        // Khai báo isObjectId nhận giá trị từ identifier.match(/^[0-9a-fA-F]{24}$/). const giữ biến không gán lại; let cho phép cập nhật.
        const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
        
        // Khai báo query nhận giá trị từ isObjectId ? { _id: identifier } : { slug: identifier }. const giữ biến không gán lại; let cho phép cập nhật.
        const query = isObjectId ? { _id: identifier } : { slug: identifier };

        // Tìm sách và tăng `views_count` lên 1 đồng thời trả về dữ liệu mới nhất
        // Khai báo book nhận giá trị từ await Book.findOneAndUpdate( query, { $inc: { views_cou. const giữ biến không gán lại; let cho phép cập nhật.
        const book = await Book.findOneAndUpdate(
            query,
            { $inc: { views_count: 1 } },
            { new: true }
        ).select('+file_key').populate('category', 'name slug');

        // if chỉ chạy nhánh này khi điều kiện !book đúng.
        if (!book) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new Error('Không tìm thấy cuốn sách này.');
        }

        // return kết thúc hàm và trả book về nơi gọi.
        return book;
    }

    // 4. Cập nhật thông tin sách
    /**
     * Hàm updateBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: bookId, updateData.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: slugify, findByIdAndUpdate, Error.
     */
    export const updateBook = async (bookId, updateData) => {
        // if chỉ chạy nhánh này khi điều kiện updateData.title đúng.
        if (updateData.title) {
            // Gọi/thực thi slugify với các đối số để thực hiện thao tác: updateData.slug = slugify(updateData.title)
            updateData.slug = slugify(updateData.title);
        }

        // Khai báo updatedBook nhận giá trị từ await Book.findByIdAndUpdate( bookId, updateData, { new. const giữ biến không gán lại; let cho phép cập nhật.
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            updateData,
            { new: true, runValidators: true }
        );

        // if chỉ chạy nhánh này khi điều kiện !updatedBook đúng.
        if (!updatedBook) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new Error('Không tìm thấy sách để cập nhật.');
        }

        // return kết thúc hàm và trả updatedBook về nơi gọi.
        return updatedBook;
    }

    // 5. Xóa sách
    /**
     * Hàm deleteBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: bookId.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: findByIdAndDelete, Error.
     */
    export const deleteBook = async (bookId) => {
        // Khai báo deletedBook nhận giá trị từ await Book.findByIdAndDelete(bookId). const giữ biến không gán lại; let cho phép cập nhật.
        const deletedBook = await Book.findByIdAndDelete(bookId);
        
        // if chỉ chạy nhánh này khi điều kiện !deletedBook đúng.
        if (!deletedBook) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new Error('Không tìm thấy sách để xóa.');
        }

        // return kết thúc hàm và trả { message: 'Xóa sách thành công', deletedBook } về nơi gọi.
        return { message: 'Xóa sách thành công', deletedBook };
    }

    /**
     * Hàm deleteBooksBulkService: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
     * Tham số: ids.
     * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
     * Gọi tiếp: isArray, Error, filter, isValidObjectId, deleteMany.
     */
    export const deleteBooksBulkService = async (ids) => {
    // if chỉ chạy nhánh này khi điều kiện !Array.isArray(ids) || ids.length === 0 đúng.
    if (!Array.isArray(ids) || ids.length === 0) {
        // Khai báo error nhận giá trị từ new Error('Danh sách ID sách không hợp lệ.'). const giữ biến không gán lại; let cho phép cập nhật.
        const error = new Error('Danh sách ID sách không hợp lệ.');
        // Gọi/thực thi biểu thức để thực hiện thao tác: error.statusCode = 400
        error.statusCode = 400;
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }

    // Kiểm tra ID MongoDB trước khi truy vấn
    // Khai báo invalidIds nhận giá trị từ ids.filter( (id) => !mongoose.isValidObjectId(id) ). const giữ biến không gán lại; let cho phép cập nhật.
    const invalidIds = ids.filter(
        (id) => !mongoose.isValidObjectId(id)
    );

    // if chỉ chạy nhánh này khi điều kiện invalidIds.length > 0 đúng.
    if (invalidIds.length > 0) {
        // Khai báo error nhận giá trị từ new Error('Có ID sách không hợp lệ.'). const giữ biến không gán lại; let cho phép cập nhật.
        const error = new Error('Có ID sách không hợp lệ.');
        // Gọi/thực thi biểu thức để thực hiện thao tác: error.statusCode = 400
        error.statusCode = 400;
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }

    // Khai báo result nhận giá trị từ await Book.deleteMany({ _id: { $in: ids }, }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await Book.deleteMany({
        // Trường _id lưu { $in: ids } làm giá trị trong object.
        _id: { $in: ids },
    });

    // return kết thúc hàm và trả result.deletedCount về nơi gọi.
    return result.deletedCount;
    };
