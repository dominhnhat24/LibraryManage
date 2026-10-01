// Tra cứu khoản phạt theo quyền người dùng và cung cấp các thao tác thanh toán hoặc miễn phạt.
import { Fines } from '../models/init.js';
import apiError from '../utils/api-error.js';

// Trích ID người dùng từ payload token, ưu tiên sub và dùng id làm dự phòng.
const readerIdOf = (user) => user?.sub || user?.id;

// Nhận query và người dùng; giới hạn độc giả vào khoản phạt của mình, phân trang và trả danh sách cùng metadata.
// Thủ thư có thể lọc theo readerId; thao tác chỉ đọc và populate phiếu mượn/độc giả.
export const listFines = async (query, user) => {
    const filter = user.role === 'reader' ? { readerId: readerIdOf(user) } : {};
    if (user.role === 'librarian' && query.readerId) filter.readerId = query.readerId;
    if (query.status) filter.status = query.status;

    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const [data, total] = await Promise.all([
        Fines.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
            .populate('borrowCardId').populate('readerId').lean(),
        Fines.countDocuments(filter)
    ]);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Nhận ID khoản phạt và người dùng; trả chi tiết đã populate, chặn độc giả không sở hữu khoản phạt.
export const getFine = async (fineId, user) => {
    const fine = await Fines.findById(fineId).populate('borrowCardId').populate('readerId');
    if (!fine) throw new apiError(404, 'Fine not found');
    if (user.role === 'reader' && fine.readerId._id.toString() !== readerIdOf(user).toString()) {
        throw new apiError(403, 'You cannot access this fine');
    }
    return fine;
};

// Nhận ID khoản phạt; chuyển khoản Pending thành Paid và đặt paidAt, trả bản ghi mới hoặc lỗi nếu không có.
// Cập nhật một tài liệu trong MongoDB.
export const payFine = async (fineId) => {
    const fine = await Fines.findOneAndUpdate(
        { _id: fineId, status: 'Pending' },
        { status: 'Paid', paidAt: new Date() },
        { returnDocument: 'after' }
    );
    if (!fine) throw new apiError(404, 'Pending fine not found');
    return fine;
};

// Nhận ID khoản phạt và lý do miễn; chuyển khoản Pending thành Waived, ghi thời điểm/lý do và trả bản ghi mới.
// Cập nhật một tài liệu trong MongoDB; validator của schema được áp dụng cho dữ liệu mới.
export const waiveFine = async (fineId, waiverReason) => {
    const fine = await Fines.findOneAndUpdate(
        { _id: fineId, status: 'Pending' },
        { status: 'Waived', waivedAt: new Date(), waiverReason },
        { returnDocument: 'after', runValidators: true }
    );
    if (!fine) throw new apiError(404, 'Pending fine not found');
    return fine;
};
