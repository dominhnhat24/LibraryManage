import readerService from '../services/reader.service.js';

// Lấy danh sách tất cả độc giả
const getAllReaders = async (req, res) => {
    const readers = await readerService.getAllReaders();

    const formattedReaders = readers.map(reader => ({
        id: reader._id,
        fullName: reader.full_name,
        email: reader.email,
        phone: reader.phone,
        status: reader.status
    }));

    return res.status(200).json({
        success: true,
        message: 'Lấy danh sách độc giả thành công',
        data: formattedReaders
    });
};

// Lấy chi tiết một độc giả theo ID
const getReaderById = async (req, res) => {
    const { id } = req.params;
    const reader = await readerService.getReaderById(id);

    return res.status(200).json({
        success: true,
        message: 'Lấy thông tin độc giả thành công',
        data: reader
    });
};

// Đăng ký mới một độc giả
const createReader = async (req, res) => {
    const newReader = await readerService.createReader(req.body);

    return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản độc giả thành công',
        data: newReader
    });
};

// Cập nhật thông tin độc giả
const updateReader = async (req, res) => {
    const { id } = req.params;
    const updatedReader = await readerService.updateReader(id, req.body);

    return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin độc giả thành công',
        data: updatedReader
    });
};

// Xóa hoặc khóa độc giả
const deleteReader = async (req, res) => {
    const { id } = req.params;
    await readerService.deleteReader(id);

    return res.status(200).json({
        success: true,
        message: 'Xóa tài khoản độc giả thành công'
    });
};

export default {
    getAllReaders,
    getReaderById,
    createReader,
    updateReader,
    deleteReader
};