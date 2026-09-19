import express from 'express';
import readerController from '../controllers/reader.controller.js';

const router = express.Router();

router.route('/')
    .get(readerController.getAllReaders)   // Lấy danh sách độc giả
    .post(readerController.createReader); // Đăng ký tài khoản độc giả mới

router.route('/:id')
    .get(readerController.getReaderById)    // Xem chi tiết độc giả
    .put(readerController.updateReader)     // Cập nhật thông tin độc giả
    .delete(readerController.deleteReader); // Xóa/Khóa tài khoản độc giả

export default router;