// [CONTROLLER SÁCH] Cung cấp catalog, chi tiết chương và thao tác CRUD cho quản trị viên.
import Book from '../models/book.model.js';
import Chapter from '../models/chapter.model.js';
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { removePrivateBookFile, savePrivateBookFile } from '../utils/private-book-storage.js';
import { mapDtoList, toBookDto } from '../utils/api-dto.js';
import * as bookService from '../services/book.service.js';
import XLSX from 'xlsx';
import { uploadFileToSupabase } from '../services/supabase.service.js';
import { deleteBooksBulkService } from '../services/book.service.js'

export const importBooksExcelController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên một file Excel.' });
    }

    const ownerId = req.authUser?._id || req.authUser?.id;
    if (!ownerId) {
      return res.status(401).json({ message: 'Chưa xác thực quyền Admin. Vui lòng đăng nhập lại.' });
    }

    // Đọc buffer file Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Đã đọc được ${sheetData.length} dòng từ file Excel.`);

    if (!sheetData || sheetData.length === 0) {
      return res.status(400).json({ message: 'File Excel không có dữ liệu' });
    }

    let successCount = 0;
    let errors = [];

    for (const [index, row] of sheetData.entries()) {
      try {
        // Ánh xạ trực tiếp từ các cột tiêu đề trong file Excel của bạn
        const title = row.title;
        const author_name = row.author_name;

        if (!title || !author_name) {
          throw new Error(`Dòng ${index + 2}: Thiếu tiêu đề (title) hoặc tên tác giả (author_name)`);
        }

        await Book.create({
          title: title,
          author_name: author_name,
          category: row.category || 'software_engineering',
          publication_year: row.publication_year ? Number(row.publication_year) : null,
          description: row.description || '',
          cover_url: row.cover_url || '',
          access_level: row.access_level || 'free',
          status: row.status || 'published',
          owner: ownerId,
        });

        successCount++;
      } catch (rowError) {
        console.error(`Lỗi dòng ${index + 2}:`, rowError.message);
        errors.push({ row: index + 2, message: rowError.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Nhập thành công ${successCount}/${sheetData.length} đầu sách từ file Excel.`,
      errors,
    });
  } catch (error) {
    next(error);
  }
};
// Hàm listBooks: Tìm sách đã xuất bản theo tiêu đề/tác giả/năm/danh mục, gọi service và trả phân trang an toàn.
export const listBooks = asyncHandler(async (req, res) => {
    const filters = {
        ...req.query,
        status: 'published',
        search: req.query.search || req.query.title || req.query.author
    };
    if (req.query.category) {
        const categories = ['ebook', 'audiobook', 'comic', 'webnovel'];
        if (typeof req.query.category !== 'string' || !categories.includes(req.query.category)) {
            throw new ApiError(400, 'Book category is invalid');
        }
        filters.category = req.query.category;
    }
    if (req.query.year) {
        const year = Number(req.query.year);
        if (!Number.isInteger(year) || year < 1 || year > 3000) {
            throw new ApiError(400, 'Publication year is invalid');
        }
        filters.publication_year = year;
    }
    const result = await bookService.getAllBooks(filters);
    return res.json({
        status: 'success',
        data: mapDtoList(result.books, (book) => toBookDto(book, { publicView: true })),
        pagination: { ...result.pagination, pages: result.pagination.totalPages }
    });
});

// Hàm listAdminBooks: Trả cả sách draft/published có bộ lọc trạng thái và phân trang cho giao diện quản trị.
export const listAdminBooks = asyncHandler(async (req, res) => {
    const filters = {
        ...req.query,
        ...(req.query.search ? { search: req.query.search } : {}),
        ...(req.query.year ? { publication_year: req.query.year } : {})
    };
    const result = await bookService.getAllBooks(filters);
    return res.json({
        status: 'success',
        data: mapDtoList(result.books, toBookDto),
        pagination: result.pagination
    });
});

// [SÁCH CỦA TÀI KHOẢN] Hiển thị sách thuộc tài khoản đang đăng nhập.
export const getMyBooks = asyncHandler(async (req, res) => {
    const books = await Book.find({ owner: req.authUser._id, category: 'webnovel' })
        .sort({ updatedAt: -1 }).lean();
    return res.json({ status: 'success', data: mapDtoList(books, toBookDto) });
});

// Hàm getBook: Lấy sách xuất bản theo ID/slug và chỉ trả metadata công khai cùng quyền đọc phù hợp.
export const getBook = asyncHandler(async (req, res) => {
    const book = await bookService.getBookByIdOrSlug(req.params.bookId);
    if (book.status !== 'published') throw new ApiError(404, 'Book not found');
    return res.json({
        status: 'success',
        data: toBookDto(book, {
            publicView: true,
            canReadPaid: Boolean(req.authUser?.hasActivePremium())
        })
    });
});

// Hàm findAccessibleBook: Nạp sách đã xuất bản và kiểm tra gói Premium/VIP trước khi stream hoặc đọc chương.
const findAccessibleBook = async (req) => {
    const book = await Book.findOne({ _id: req.params.bookId, status: 'published' })
        .select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    if (book.access_level === 'vip' && !req.authUser.hasActiveVip()) {
        throw new ApiError(403, 'An active VIP subscription is required to read this book');
    }
    if (book.access_level === 'premium' && !req.authUser.hasActivePremium()) {
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    return book;
};

// Hàm loadAccessibleBook: Gắn sách đã xuất bản vào request sau khi xác minh quyền đọc nội dung của sách.
export const loadAccessibleBook = asyncHandler(async (req, res, next) => {
    req.book = await findAccessibleBook(req);
    return next();
});

// Hàm loadReadableBook: Nạp sách/chương riêng và kiểm tra access_level của cả hai trước khi trả nội dung.
export const loadReadableBook = asyncHandler(async (req, res, next) => {
    const book = await findAccessibleBook(req);
    const chapter = await Chapter.findOne({ _id: req.params.chapterId, book_id: book._id });
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    if (chapter.access_level === 'vip' && !req.authUser.hasActiveVip()) {
        throw new ApiError(403, 'An active VIP subscription is required to read this chapter');
    }
    if (chapter.access_level === 'premium' && !req.authUser.hasActivePremium()) {
        throw new ApiError(403, 'An active Premium subscription is required to read this book');
    }
    req.book = book;
    req.chapter = chapter;
    return next();
});

// Hàm createBook: Tạo metadata sách và PDF private cùng một request, dọn file nếu lưu bản ghi thất bại.
export const createBook = asyncHandler(async (req, res) => {
    let fileUrl = '';
    
    // Nếu có file PDF được gửi lên từ form (qua Multer memoryStorage)
    if (req.file) {
        try {
            fileUrl = await uploadFileToSupabase(req.file);
        } catch (uploadError) {
            throw new ApiError(500, `Không thể tải file lên Cloud: ${uploadError.message}`);
        }
    }

    let book;
    try {
        // GÁN TRỰC TIẾP OWNER VÀO OBJECT TRUYỀN VÀO ĐỂ CHẮC CHẮN KHÔNG BỊ THIẾU
        book = await bookService.createBook(
            { 
                ...req.body, 
                file_url: fileUrl, // Lưu link public của Supabase vào schema
                owner: req.authUser._id 
            }, 
            req.authUser._id
        );
    } catch (error) {
        throw error;
    }

    return res.status(201).json({ 
        status: 'success', 
        message: 'Tạo sách và upload lên Supabase thành công!',
        data: toBookDto(book) 
    });
});

// Hàm updateBook: Cập nhật sách theo whitelist Joi và không cho client thay đổi owner hoặc khóa tệp riêng tư.
export const updateBook = asyncHandler(async (req, res) => {
    const book = await bookService.updateBook(req.params.bookId, { ...req.body });
    return res.json({ status: 'success', data: toBookDto(book) });
});     

// [XÓA SÁCH] Xóa record sách; tệp lưu riêng được quản lý bởi tuyến upload, không public trực tiếp.
export const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.bookId).select('+file_key');
    if (!book) throw new ApiError(404, 'Book not found');
    await bookService.deleteBook(req.params.bookId);
    await removePrivateBookFile(book.file_key);
    return res.json({ status: 'success', message: 'Book deleted successfully' });
});

export const deleteBulkBooks = async (req, res, next) => {
  try {
    const { ids } = req.body ?? {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID sách cần xóa.',
      });
    }

    const deletedCount = await deleteBooksBulkService(ids);

    return res.status(200).json({
      success: true,
      message: `Đã xóa thành công ${deletedCount} cuốn sách khỏi hệ thống.`,
      data: { deletedCount },
    });
   } catch (error) {
  console.error('[deleteBulkBooks] Lỗi:', error);

  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Lỗi máy chủ khi xóa hàng loạt.',
    })
    }
}

