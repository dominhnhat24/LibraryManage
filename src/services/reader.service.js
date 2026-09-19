import * as db from '../models/init.js';
import apiError from '../utils/api-error.js';

// 1. Lấy danh sách tất cả độc giả (sắp xếp mới nhất lên đầu)
const getAllReaders = async () => {
    const readers = await db.Readers.find({}).sort({ createdAt: -1 });

    if(readers.length === 0) {
        throw new apiError.default(404, 'No readers found');
    }

    return readers;
};

// 2. Lấy thông tin chi tiết một độc giả theo ID
const getReaderById = async (readerId) => {
    const readerItem = await db.Readers.findById(readerId);
    if (!readerItem) {
        throw new apiError.default(404, 'Reader not found');
    }
    return readerItem;
};

// 3. Tạo mới một độc giả (Đăng ký thẻ thư viện)
const createReader = async (readerData) => {
    // Kiểm tra xem email đã tồn tại trong hệ thống chưa để tránh trùng lặp
    const existingEmail = await db.Readers.findOne({ email: readerData.email });
    if (existingEmail) {
        throw new apiError.default(409, 'Email is already registered by another reader');
    }

    return await db.Readers.create({
        full_name: readerData.full_name,
        email: readerData.email,
        phone: readerData.phone,
        address: readerData.address,
        status: readerData.status || 'Active' // Trạng thái mặc định là Active
    });
};

// 4. Cập nhật thông tin độc giả
const updateReader = async (readerId, readerData) => {
    // Đảm bảo độc giả tồn tại trước khi update (hàm này sẽ ném lỗi 404 nếu không tìm thấy)
    const readerItem = await getReaderById(readerId);

    if (Object.prototype.hasOwnProperty.call(readerData, 'full_name')) {
        readerItem.full_name = readerData.full_name;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'email')) {
        // Kiểm tra nếu đổi email mới mà trùng với người khác thì chặn lại
        const duplicateEmail = await db.Readers.findOne({ email: readerData.email, _id: { $ne: readerId } });
        if (duplicateEmail) {
            throw new apiError.default(409, 'Email is already in use by another reader');
        }
        readerItem.email = readerData.email;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'phone')) {
        readerItem.phone = readerData.phone;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'address')) {
        readerItem.address = readerData.address;
    }
    if (Object.prototype.hasOwnProperty.call(readerData, 'status')) {
        readerItem.status = readerData.status;
    }

    await readerItem.save();
    return readerItem;
};

// 5. Xóa hoặc khóa tài khoản độc giả
const deleteReader = async (readerId) => {
    // Kiểm tra xem độc giả có tồn tại không
    await getReaderById(readerId);

    // Lưu ý thực tế: Thường thì độc giả đã mượn sách (có liên kết bảng BorrowCard) thì không nên xóa văng mạng,
    // nhưng ở mức cơ bản, chúng ta tiến hành xóa bản ghi theo ID:
    await db.Readers.findByIdAndDelete(readerId);
};

export default {
    getAllReaders,
    getReaderById,
    createReader,
    updateReader,
    deleteReader
};