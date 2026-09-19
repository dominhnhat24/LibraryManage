import express from 'express';
import bookCopyController from '../controllers/bookCopies.controller.js';


const router = express.Router();

router.route('/')
    .get(bookCopyController.getAllBookCopies) // Lấy danh sách bản sao (hỗ trợ ?bookId=...)
    .post(bookCopyController.createBookCopy); // Nhập kho hàng loạt (insertMany)

router.route('/:id')
    .get(bookCopyController.getBookCopyById)    // Xem chi tiết 1 bản sao
    .put(bookCopyController.updateBookCopy)     // Cập nhật trạng thái (available/borrowed/damaged)
    .delete(bookCopyController.deleteBookCopy); // Xóa/Thanh lý bản sao

export default router;