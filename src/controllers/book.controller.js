// [CONTROLLER SÁCH] Cung cấp catalog, chi tiết chương và thao tác CRUD cho quản trị viên.
// Import Book từ ../models/book.model.js để dùng trong module.
/**
 * Tệp src/controllers/book.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Book from '../models/book.model.js';
// Import Chapter từ ../models/chapter.model.js để dùng trong module.
import Chapter from '../models/chapter.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { removePrivateBookFile, savePrivateBookFile } từ ../utils/private-book-storage.js để dùng trong module.
import { removePrivateBookFile, savePrivateBookFile } from '../utils/private-book-storage.js';
// Import { mapDtoList, toBookDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toBookDto } from '../utils/api-dto.js';
// Import * as bookService từ ../services/book.service.js để dùng trong module.
import * as bookService from '../services/book.service.js';
// Import XLSX từ xlsx để dùng trong module.
import XLSX from 'xlsx';
// Import { deleteBooksBulkService } từ ../services/book.service.js để dùng trong module.
import { deleteBooksBulkService } from '../services/book.service.js'
// Import { resolveBookReaderMode } từ ../utils/book-reader-mode.js để dùng trong module.
import { resolveBookReaderMode } from '../utils/book-reader-mode.js';

/**
 * Hàm importBooksExcelController: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: status, json, read, sheet_to_json, log, entries, Error, create.
 */
export const importBooksExcelController = async (req, res, next) => {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // if chỉ chạy nhánh này khi điều kiện !req.file đúng.
    if (!req.file) {
      // return kết thúc hàm và trả res.status(400).json({ message: 'Vui lòng tải lên một file Excel.' }) về nơi gọi.
      return res.status(400).json({ message: 'Vui lòng tải lên một file Excel.' });
    }

    // Khai báo ownerId nhận giá trị từ req.authUser?._id || req.authUser?.id. const giữ biến không gán lại; let cho phép cập nhật.
    const ownerId = req.authUser?._id || req.authUser?.id;
    // if chỉ chạy nhánh này khi điều kiện !ownerId đúng.
    if (!ownerId) {
      // return kết thúc hàm và trả res.status(401).json({ message: 'Chưa xác thực quyền Admin. Vui lòng đăng n về nơi gọi.
      return res.status(401).json({ message: 'Chưa xác thực quyền Admin. Vui lòng đăng nhập lại.' });
    }

    // Đọc buffer file Excel
    // Khai báo workbook nhận giá trị từ XLSX.read(req.file.buffer, { type: 'buffer' }). const giữ biến không gán lại; let cho phép cập nhật.
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    // Khai báo sheetName nhận giá trị từ workbook.SheetNames[0]. const giữ biến không gán lại; let cho phép cập nhật.
    const sheetName = workbook.SheetNames[0];
    // Khai báo sheetData nhận giá trị từ XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]). const giữ biến không gán lại; let cho phép cập nhật.
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Gọi/thực thi console.log với các đối số để thực hiện thao tác: console.log(`Đã đọc được ${sheetData.length} dòng từ file Excel.`)
    console.log(`Đã đọc được ${sheetData.length} dòng từ file Excel.`);

    // if chỉ chạy nhánh này khi điều kiện !sheetData || sheetData.length === 0 đúng.
    if (!sheetData || sheetData.length === 0) {
      // return kết thúc hàm và trả res.status(400).json({ message: 'File Excel không có dữ liệu' }) về nơi gọi.
      return res.status(400).json({ message: 'File Excel không có dữ liệu' });
    }

    // Khai báo successCount nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
    let successCount = 0;
    // Khai báo errors nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    let errors = [];

    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const [index, row] of sheetData.entries()) {
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
      try {
        // Ánh xạ trực tiếp từ các cột tiêu đề trong file Excel của bạn
        // Khai báo title nhận giá trị từ row.title. const giữ biến không gán lại; let cho phép cập nhật.
        const title = row.title;
        // Khai báo author_name nhận giá trị từ row.author_name. const giữ biến không gán lại; let cho phép cập nhật.
        const author_name = row.author_name;

        // if chỉ chạy nhánh này khi điều kiện !title || !author_name đúng.
        if (!title || !author_name) {
          // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
          throw new Error(`Dòng ${index + 2}: Thiếu tiêu đề (title) hoặc tên tác giả (author_name)`);
        }

        // await chờ tác vụ bất đồng bộ xong trước bước sau: await Book.create({ title: title, author_name: author_name, category: row.c
        await Book.create({
          // Trường title lưu title làm giá trị trong object.
          title: title,
          // Trường author_name lưu author_name làm giá trị trong object.
          author_name: author_name,
          // Trường category lưu row.category || 'software_engineering' làm giá trị trong object.
          category: row.category || 'software_engineering',
          // Trường publication_year lưu row.publication_year ? Number(row.publication_year) : n làm giá trị trong object.
          publication_year: row.publication_year ? Number(row.publication_year) : null,
          // Trường description lưu row.description || '' làm giá trị trong object.
          description: row.description || '',
          // Trường cover_url lưu row.cover_url || '' làm giá trị trong object.
          cover_url: row.cover_url || '',
          // Trường access_level lưu row.access_level || 'free' làm giá trị trong object.
          access_level: row.access_level || 'free',
          // Trường status lưu row.status || 'published' làm giá trị trong object.
          status: row.status || 'published',
          // Trường owner lưu ownerId làm giá trị trong object.
          owner: ownerId,
        });

        // Gọi/thực thi biểu thức để thực hiện thao tác: successCount++
        successCount++;
      } catch (rowError) {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error(`Lỗi dòng ${index + 2}:`, rowError.message)
        console.error(`Lỗi dòng ${index + 2}:`, rowError.message);
        // Gọi/thực thi errors.push với các đối số để thực hiện thao tác: errors.push({ row: index + 2, message: rowError.message })
        errors.push({ row: index + 2, message: rowError.message });
      }
    }

    // return kết thúc hàm và trả res.status(200).json({ status: 'success', message: `Nhập thành công ${succe về nơi gọi.
    return res.status(200).json({
      // Trường status lưu 'success' làm giá trị trong object.
      status: 'success',
      // Trường message lưu `Nhập thành công ${successCount}/${sheetData.length} đầ làm giá trị trong object.
      message: `Nhập thành công ${successCount}/${sheetData.length} đầu sách từ file Excel.`,
      // Khóa errors nhận biến cùng tên làm giá trị.
      errors,
    });
  } catch (error) {
    // Gọi/thực thi next với các đối số để thực hiện thao tác: next(error)
    next(error);
  }
};
// Hàm listBooks: Tìm sách đã xuất bản theo tiêu đề/tác giả/năm/danh mục, gọi service và trả phân trang an toàn.
// Khai báo listBooks nhận giá trị từ asyncHandler(async (req, res) => { const filters = { ... const giữ biến không gán lại; let cho phép cập nhật.
export const listBooks = asyncHandler(async (req, res) => {
    // Khai báo filters nhận giá trị từ { ...req.query, status: 'published', search: req.query.. const giữ biến không gán lại; let cho phép cập nhật.
    const filters = {
        ...req.query,
        // Trường status lưu 'published' làm giá trị trong object.
        status: 'published',
        // Trường search lưu req.query.search || req.query.title || req.query.author làm giá trị trong object.
        search: req.query.search || req.query.title || req.query.author
    };
    // if chỉ chạy nhánh này khi điều kiện req.query.category đúng.
    if (req.query.category) {
        // Khai báo categories nhận giá trị từ ['ebook', 'audiobook', 'comic', 'webnovel']. const giữ biến không gán lại; let cho phép cập nhật.
        const categories = ['ebook', 'audiobook', 'comic', 'webnovel'];
        // if chỉ chạy nhánh này khi điều kiện typeof req.query.category !== 'string' || !categories.includes(req.query.ca đúng.
        if (typeof req.query.category !== 'string' || !categories.includes(req.query.category)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Book category is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: filters.category = req.query.category
        filters.category = req.query.category;
    }
    // if chỉ chạy nhánh này khi điều kiện req.query.genre đúng.
    if (req.query.genre) {
        // Khai báo genres nhận giá trị từ ['van_hoc_viet_nam', 'truyen_ngan_viet_nam', 'tho_viet_. const giữ biến không gán lại; let cho phép cập nhật.
        const genres = ['van_hoc_viet_nam', 'truyen_ngan_viet_nam', 'tho_viet_nam', 'van_hoc_dan_gian', 'van_hoc_the_gioi', 'kinh_doanh', 'phat_trien_ban_than', 'tam_ly_hoc', 'lich_su', 'khoa_hoc'];
        // if chỉ chạy nhánh này khi điều kiện typeof req.query.genre !== 'string' || !genres.includes(req.query.genre) đúng.
        if (typeof req.query.genre !== 'string' || !genres.includes(req.query.genre)) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Book genre is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: filters.genre = req.query.genre
        filters.genre = req.query.genre;
    }
    // if chỉ chạy nhánh này khi điều kiện req.query.year đúng.
    if (req.query.year) {
        // Khai báo year nhận giá trị từ Number(req.query.year). const giữ biến không gán lại; let cho phép cập nhật.
        const year = Number(req.query.year);
        // if chỉ chạy nhánh này khi điều kiện !Number.isInteger(year) || year < 1 || year > 3000 đúng.
        if (!Number.isInteger(year) || year < 1 || year > 3000) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(400, 'Publication year is invalid');
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: filters.publication_year = year
        filters.publication_year = year;
    }
    // Khai báo result nhận giá trị từ await bookService.getAllBooks(filters). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await bookService.getAllBooks(filters);
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.books, (book) => toBo về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.books, (book) => toBookDto(book, { pu làm giá trị trong object.
        data: mapDtoList(result.books, (book) => toBookDto(book, { publicView: true })),
        // Trường pagination lưu { ...result.pagination, pages: result.pagination.totalP làm giá trị trong object.
        pagination: { ...result.pagination, pages: result.pagination.totalPages }
    });
});

// Hàm listAdminBooks: Trả cả sách draft/published có bộ lọc trạng thái và phân trang cho giao diện quản trị.
// Khai báo listAdminBooks nhận giá trị từ asyncHandler(async (req, res) => { const filters = { ... const giữ biến không gán lại; let cho phép cập nhật.
export const listAdminBooks = asyncHandler(async (req, res) => {
    // Khai báo filters nhận giá trị từ { ...req.query, ...(req.query.search ? { search: req.qu. const giữ biến không gán lại; let cho phép cập nhật.
    const filters = {
        ...req.query,
        ...(req.query.search ? { search: req.query.search } : {}),
        ...(req.query.year ? { publication_year: req.query.year } : {})
    };
    // Khai báo result nhận giá trị từ await bookService.getAllBooks(filters). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await bookService.getAllBooks(filters);
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.books, toBookDto), pa về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.books, toBookDto) làm giá trị trong object.
        data: mapDtoList(result.books, toBookDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// [SÁCH CỦA TÀI KHOẢN] Hiển thị sách thuộc tài khoản đang đăng nhập.
// Khai báo getMyBooks nhận giá trị từ asyncHandler(async (req, res) => { const books = await . const giữ biến không gán lại; let cho phép cập nhật.
export const getMyBooks = asyncHandler(async (req, res) => {
    // Khai báo books nhận giá trị từ await Book.find({ owner: req.authUser._id, category: 'w. const giữ biến không gán lại; let cho phép cập nhật.
    const books = await Book.find({ owner: req.authUser._id, category: 'webnovel' })
        .sort({ updatedAt: -1 }).lean();
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(books, toBookDto) }) về nơi gọi.
    return res.json({ status: 'success', data: mapDtoList(books, toBookDto) });
});

// Hàm getBook: Lấy sách xuất bản theo ID/slug và chỉ trả metadata công khai cùng quyền đọc phù hợp.
// Khai báo getBook nhận giá trị từ asyncHandler(async (req, res) => { const book = await b. const giữ biến không gán lại; let cho phép cập nhật.
export const getBook = asyncHandler(async (req, res) => {
    // Khai báo book nhận giá trị từ await bookService.getBookByIdOrSlug(req.params.bookId). const giữ biến không gán lại; let cho phép cập nhật.
    const book = await bookService.getBookByIdOrSlug(req.params.bookId);
    // if chỉ chạy nhánh này khi điều kiện book.status !== 'published' đúng.
    if (book.status !== 'published') throw new ApiError(404, 'Book not found');
    // Khai báo hasReadableChapters nhận giá trị từ Boolean(await Chapter.exists({ book_id: book._id, conte. const giữ biến không gán lại; let cho phép cập nhật.
    const hasReadableChapters = Boolean(await Chapter.exists({
        // Trường book_id lưu book._id làm giá trị trong object.
        book_id: book._id,
        // Trường content lưu { $type: 'string', $regex: /\S/ } làm giá trị trong object.
        content: { $type: 'string', $regex: /\S/ }
    }));
    // Khai báo data nhận giá trị từ toBookDto(book, { publicView: true, canReadPaid: Boolea. const giữ biến không gán lại; let cho phép cập nhật.
    const data = toBookDto(book, {
        // Trường publicView lưu true làm giá trị trong object.
        publicView: true,
        // Trường canReadPaid lưu Boolean(req.authUser?.hasActivePremium()) làm giá trị trong object.
        canReadPaid: Boolean(req.authUser?.hasActivePremium())
    });
    // Gọi/thực thi resolveBookReaderMode với các đối số để thực hiện thao tác: data.reader_mode = resolveBookReaderMode({ file_format: book.file_format, f
    data.reader_mode = resolveBookReaderMode({
        // Trường file_format lưu book.file_format làm giá trị trong object.
        file_format: book.file_format,
        // Trường file_key lưu book.file_key làm giá trị trong object.
        file_key: book.file_key,
        // Khóa hasReadableChapters nhận biến cùng tên làm giá trị.
        hasReadableChapters
    });
    // return kết thúc hàm và trả res.json({ status: 'success', data }) về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Khóa data nhận biến cùng tên làm giá trị.
        data
    });
});

// Hàm findAccessibleBook: Nạp sách đã xuất bản và kiểm tra gói Premium/VIP trước khi stream hoặc đọc chương.
/**
 * Hàm findAccessibleBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOne, select, ApiError, hasActiveVip, hasActivePremium.
 */
const findAccessibleBook = async (req) => {
    // Khai báo book nhận giá trị từ await Book.findOne({ _id: req.params.bookId, status: 'p. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' })
        .select('+file_key');
    // if chỉ chạy nhánh này khi điều kiện !book đúng.
    if (!book) throw new ApiError(404, 'Book not found');
    // if chỉ chạy nhánh này khi điều kiện book.access_level === 'vip' && (!req.authUser || !req.authUser.hasActiveVip đúng.
    if (book.access_level === 'vip' && (!req.authUser || !req.authUser.hasActiveVip())) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'An active VIP subscription is required to read this book');
    }
    // if chỉ chạy nhánh này khi điều kiện book.access_level === 'premium' && (!req.authUser || !req.authUser.hasActiv đúng.
    if (book.access_level === 'premium' && (!req.authUser || !req.authUser.hasActivePremium())) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    // return kết thúc hàm và trả book về nơi gọi.
    return book;
};

// Hàm loadAccessibleBook: Gắn sách đã xuất bản vào request sau khi xác minh quyền đọc nội dung của sách.
// Khai báo loadAccessibleBook nhận giá trị từ asyncHandler(async (req, res, next) => { req.book = awa. const giữ biến không gán lại; let cho phép cập nhật.
export const loadAccessibleBook = asyncHandler(async (req, res, next) => {
    // await chờ tác vụ bất đồng bộ xong trước bước sau: req.book = await findAccessibleBook(req)
    req.book = await findAccessibleBook(req);
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
});

// Hàm loadReadableBook: Nạp sách/chương riêng và kiểm tra access_level của cả hai trước khi trả nội dung.
// Khai báo loadReadableBook nhận giá trị từ asyncHandler(async (req, res, next) => { const book = a. const giữ biến không gán lại; let cho phép cập nhật.
export const loadReadableBook = asyncHandler(async (req, res, next) => {
    // Khai báo book nhận giá trị từ await findAccessibleBook(req). const giữ biến không gán lại; let cho phép cập nhật.
    const book = await findAccessibleBook(req);
    // Khai báo chapter nhận giá trị từ await Chapter.findOne({ _id: req.params.chapterId, book. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = await Chapter.findOne({ _id: req.params.chapterId, book_id: book._id });
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    // if chỉ chạy nhánh này khi điều kiện chapter.access_level === 'vip' && (!req.authUser || !req.authUser.hasActive đúng.
    if (chapter.access_level === 'vip' && (!req.authUser || !req.authUser.hasActiveVip())) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'An active VIP subscription is required to read this chapter');
    }
    // if chỉ chạy nhánh này khi điều kiện chapter.access_level === 'premium' && (!req.authUser || !req.authUser.hasAc đúng.
    if (chapter.access_level === 'premium' && (!req.authUser || !req.authUser.hasActivePremium())) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    // Gọi/thực thi biểu thức để thực hiện thao tác: req.book = book
    req.book = book;
    // Gọi/thực thi biểu thức để thực hiện thao tác: req.chapter = chapter
    req.chapter = chapter;
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
});

// Hàm createBook: Tạo metadata sách và PDF private cùng một request, dọn file nếu lưu bản ghi thất bại.
// Khai báo createBook nhận giá trị từ asyncHandler(async (req, res) => { let privateFile = nu. const giữ biến không gán lại; let cho phép cập nhật.
export const createBook = asyncHandler(async (req, res) => {
    // Khai báo privateFile nhận giá trị từ null. const giữ biến không gán lại; let cho phép cập nhật.
    let privateFile = null;
    // if chỉ chạy nhánh này khi điều kiện req.file đúng.
    if (req.file) privateFile = await savePrivateBookFile(req.file, req.body.category);
    // Khai báo book nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let book;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: book = await bookService.createBook({ ...req.body, owner: req.authUser._id,
        book = await bookService.createBook({
            ...req.body,
            // Trường owner lưu req.authUser._id làm giá trị trong object.
            owner: req.authUser._id,
            ...(privateFile ? {
                // Trường file_key lưu privateFile.file_key làm giá trị trong object.
                file_key: privateFile.file_key,
                // Trường file_original_name lưu privateFile.original_name làm giá trị trong object.
                file_original_name: privateFile.original_name,
                // Trường file_size lưu req.file.size làm giá trị trong object.
                file_size: req.file.size,
                // Trường file_format lưu req.file.originalname.split('.').pop()?.toUpperCase() | làm giá trị trong object.
                file_format: req.file.originalname.split('.').pop()?.toUpperCase() || null
            } : {})
        });
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện privateFile?.file_key đúng.
        if (privateFile?.file_key) await removePrivateBookFile(privateFile.file_key);
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }

    // return kết thúc hàm và trả res.status(201).json({ status: 'success', message: 'Book created successful về nơi gọi.
    return res.status(201).json({ 
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success', 
        // Trường message lưu 'Book created successfully' làm giá trị trong object.
        message: 'Book created successfully',
        // Trường data lưu toBookDto(book) làm giá trị trong object.
        data: toBookDto(book) 
    });
});

// Hàm updateBook: Cập nhật sách theo whitelist Joi và không cho client thay đổi owner hoặc khóa tệp riêng tư.
// Khai báo updateBook nhận giá trị từ asyncHandler(async (req, res) => { const book = await b. const giữ biến không gán lại; let cho phép cập nhật.
export const updateBook = asyncHandler(async (req, res) => {
    // Khai báo book nhận giá trị từ await bookService.updateBook(req.params.bookId, { ...re. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await bookService.updateBook(req.params.bookId, { ...req.body });
    // return kết thúc hàm và trả res.json({ status: 'success', data: toBookDto(book) }) về nơi gọi.
    return res.json({ status: 'success', data: toBookDto(book) });
});     

// [XÓA SÁCH] Xóa record sách; tệp lưu riêng được quản lý bởi tuyến upload, không public trực tiếp.
// Khai báo deleteBook nhận giá trị từ asyncHandler(async (req, res) => { const book = await B. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteBook = asyncHandler(async (req, res) => {
    // Khai báo book nhận giá trị từ await Book.findById(req.params.bookId).select('+file_ke. const giữ biến không gán lại; let cho phép cập nhật.
    const book = await Book.findById(req.params.bookId).select('+file_key +cover_file_key');
    // if chỉ chạy nhánh này khi điều kiện !book đúng.
    if (!book) throw new ApiError(404, 'Book not found');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await bookService.deleteBook(req.params.bookId)
    await bookService.deleteBook(req.params.bookId);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Promise.all([removePrivateBookFile(book.file_key), removePrivateBookF
    await Promise.all([removePrivateBookFile(book.file_key), removePrivateBookFile(book.cover_file_key)]);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'Book deleted successfully' }) về nơi gọi.
    return res.json({ status: 'success', message: 'Book deleted successfully' });
});

/**
 * Hàm deleteBulkBooks: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isArray, status, json, deleteBooksBulkService, error.
 */
export const deleteBulkBooks = async (req, res, next) => {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // Khai báo { ids } nhận giá trị từ req.body ?? {}. const giữ biến không gán lại; let cho phép cập nhật.
    const { ids } = req.body ?? {};

    // if chỉ chạy nhánh này khi điều kiện !Array.isArray(ids) || ids.length === 0 đúng.
    if (!Array.isArray(ids) || ids.length === 0) {
      // return kết thúc hàm và trả res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sác về nơi gọi.
      return res.status(400).json({
        // Trường success lưu false làm giá trị trong object.
        success: false,
        // Trường message lưu 'Vui lòng cung cấp danh sách ID sách cần xóa.' làm giá trị trong object.
        message: 'Vui lòng cung cấp danh sách ID sách cần xóa.',
      });
    }

    // Khai báo deletedCount nhận giá trị từ await deleteBooksBulkService(ids). const giữ biến không gán lại; let cho phép cập nhật.
    const deletedCount = await deleteBooksBulkService(ids);

    // return kết thúc hàm và trả res.status(200).json({ success: true, message: `Đã xóa thành công ${deleted về nơi gọi.
    return res.status(200).json({
      // Trường success lưu true làm giá trị trong object.
      success: true,
      // Trường message lưu `Đã xóa thành công ${deletedCount} cuốn sách khỏi hệ th làm giá trị trong object.
      message: `Đã xóa thành công ${deletedCount} cuốn sách khỏi hệ thống.`,
      // Trường data lưu { deletedCount } làm giá trị trong object.
      data: { deletedCount },
    });
   } catch (error) {
  // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('[deleteBulkBooks] Lỗi:', error)
  console.error('[deleteBulkBooks] Lỗi:', error);

  // return kết thúc hàm và trả res.status(error.statusCode || 500).json({ status: 'error', message: error. về nơi gọi.
  return res.status(error.statusCode || 500).json({
    // Trường status lưu 'error' làm giá trị trong object.
    status: 'error',
    // Trường message lưu error.message || 'Lỗi máy chủ khi xóa hàng loạt.' làm giá trị trong object.
    message: error.message || 'Lỗi máy chủ khi xóa hàng loạt.',
    })
    }
}

