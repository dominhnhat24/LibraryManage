import * as readerService from '../services/reader.service.js';
import asyncHandler from '../middlewares/async-handler.js';
import successResponse from '../utils/api.response.js';

// Lấy danh sách tất cả độc giả
const getAllReaders = asyncHandler(async (req, res) => {
    const readers = await readerService.getAllReaders(req.query);

    return successResponse(res, {
        message: 'Lấy danh sách độc giả thành công',
        data: readers
    });
});

// Lấy chi tiết một độc giả theo ID
const getReaderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reader = await readerService.getReaderById(id);

    return successResponse(res, {
        message: 'Lấy thông tin độc giả thành công',
        data: reader
    });
});

const getMyProfile = asyncHandler(async (req, res) => {
    const readerId = req.user?.sub || req.user?.id;
    const reader = await readerService.getReaderById(readerId);
    return successResponse(res, {
        message: 'Lấy hồ sơ độc giả thành công',
        data: reader
    });
});

// Đăng ký mới một độc giả
const createReader = asyncHandler(async (req, res) => {
    const newReader = await readerService.createReader(req.body);

    return successResponse(res, {
        statusCode: 201,
        message: 'Đăng ký tài khoản độc giả thành công',
        data: newReader
    });
});

// Cập nhật thông tin độc giả
const updateReader = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedReader = await readerService.updateReader(id, req.body);

    return successResponse(res, {
        message: 'Cập nhật thông tin độc giả thành công',
        data: updatedReader
    });
});

// Xóa hoặc khóa độc giả
const deleteReader = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await readerService.deleteReader(id);

    return successResponse(res, {
        message: 'Xóa tài khoản độc giả thành công'
    });
});

export default {
    getAllReaders,
    getReaderById,
    getMyProfile,
    createReader,
    updateReader,
    deleteReader,
};