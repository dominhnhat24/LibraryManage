// Xử lý vòng đời phiếu mượn, quản lý trạng thái bản sao và tạo khoản phạt khi nhận sách trả.
import mongoose from 'mongoose';
import { BorrowCards, BookCopy, Fines, Librarians, Readers } from '../models/init.js';
import apiError from '../utils/api-error.js';

// Trích ID độc giả từ payload JWT; ưu tiên sub và dự phòng id.
const readerIdOf = (user) => user?.sub || user?.id;
// Mức phạt cấu hình qua biến môi trường, dùng giá trị mặc định nếu biến không có.
const fineRates = {
    overdue: Number(process.env.OVERDUE_FINE_PER_DAY || 1),
    damaged: Number(process.env.DAMAGED_BOOK_FINE || 50),
    lost: Number(process.env.LOST_BOOK_FINE || 100)
};

// Nhận phiếu và người dùng; độc giả chỉ được truy cập phiếu của chính mình, thủ thư không bị chặn tại đây.
const assertOwnership = (card, user) => {
    if (user.role === 'reader' && card.readerId.toString() !== readerIdOf(user).toString()) {
        throw new apiError(403, 'You cannot access this borrow card');
    }
};

// Nhận readerId, danh sách copyIds và dueDate; kiểm tra quyền lợi/trạng thái bản sao rồi tạo phiếu Pending.
// Đọc người dùng, khoản phạt và bản sao trong MongoDB; không đổi trạng thái bản sao cho đến khi duyệt.
export const createBorrowCard = async ({ readerId, copyIds, dueDate }) => {
    if (!Array.isArray(copyIds) || copyIds.length === 0) {
        throw new apiError(400, 'copyIds must be a non-empty array');
    }
    const uniqueCopyIds = [...new Set(copyIds.map(String))];
    if (uniqueCopyIds.length !== copyIds.length) throw new apiError(400, 'Duplicate book copies are not allowed');
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime()) || due <= new Date()) throw new apiError(400, 'dueDate must be a future date');

    const reader = await Readers.findById(readerId);
    if (!reader) throw new apiError(404, 'Reader not found');
    if (reader.status !== 'Active') throw new apiError(403, 'Blocked readers cannot borrow books');
    if (await Fines.exists({ readerId, status: 'Pending' })) {
        throw new apiError(400, 'Độc giả đang còn nợ phạt, không thể mượn thêm sách');
    }

    const copies = await BookCopy.find({ _id: { $in: uniqueCopyIds }, status: 'Available' });
    if (copies.length !== uniqueCopyIds.length) {
        throw new apiError(409, 'All requested book copies must be available');
    }
    const details = copies.map((copy) => ({ bookId: copy.bookId, copyId: copy._id }));
    return BorrowCards.create({ readerId, dueDate: due, details });
};

// Nhận bộ lọc phân trang cùng người dùng; độc giả bị giới hạn vào phiếu của mình, thủ thư có thể lọc readerId.
// Trả danh sách đã populate và metadata phân trang; chỉ đọc dữ liệu.
export const listBorrowCards = async (query, user) => {
    const filter = user.role === 'reader' ? { readerId: readerIdOf(user) } : {};
    if (query.status) filter.status = query.status;
    if (query.readerId && user.role === 'librarian') filter.readerId = query.readerId;
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const [data, total] = await Promise.all([
        BorrowCards.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
            .populate('readerId').populate('librarianId').populate('details.bookId').populate('details.copyId').lean(),
        BorrowCards.countDocuments(filter)
    ]);
    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// Nhận ID phiếu và người dùng; trả chi tiết đã populate sau khi kiểm tra tồn tại và quyền sở hữu.
export const getBorrowCard = async (id, user) => {
    const card = await BorrowCards.findById(id)
        .populate('readerId').populate('librarianId').populate('details.bookId').populate('details.copyId');
    if (!card) throw new apiError(404, 'Borrow card not found');
    assertOwnership(card, user);
    return card;
};

// Nhận ID phiếu và người dùng; chỉ hủy phiếu Pending của người có quyền, lưu rồi trả tài liệu.
export const cancelBorrowCard = async (id, user) => {
    const card = await BorrowCards.findById(id);
    if (!card) throw new apiError(404, 'Borrow card not found');
    assertOwnership(card, user);
    if (card.status !== 'Pending') throw new apiError(409, 'Only pending borrow cards can be cancelled');
    card.status = 'Cancelled';
    return card.save();
};

// Nhận ID phiếu và thủ thư duyệt; trong một transaction xác nhận quyền/trạng thái, giữ các bản sao và chuyển phiếu sang Borrowing.
// Trả phiếu đã duyệt; khi lỗi sẽ hủy transaction, đồng thời luôn đóng session.
export const approveBorrow = async (id, librarianId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const librarian = await Librarians.findOne({ _id: librarianId, status: 'Active' }).session(session);
        if (!librarian) throw new apiError(403, 'Active librarian account is required');
        const card = await BorrowCards.findById(id).session(session);
        if (!card) throw new apiError(404, 'Borrow card not found');
        if (card.status !== 'Pending') throw new apiError(409, 'Only pending borrow cards can be approved');
        if (await Fines.exists({ readerId: card.readerId, status: 'Pending' }).session(session)) {
            throw new apiError(400, 'Độc giả đang còn nợ phạt, không thể mượn thêm sách');
        }
        for (const detail of card.details) {
            const updated = await BookCopy.findOneAndUpdate(
                { _id: detail.copyId, status: 'Available' },
                { status: 'Borrowed' },
                { returnDocument: 'after', session }
            );
            if (!updated) throw new apiError(409, `Book copy ${detail.copyId} is no longer available`);
        }
        card.status = 'Borrowing';
        card.librarianId = librarianId;
        await card.save({ session });
        await session.commitTransaction();
        return card;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

// Nhận ID phiếu, danh sách {copyId, condition} và ID thủ thư; xác nhận các sách trả hợp lệ rồi cập nhật nguyên tử.
// Trả phiếu sau cập nhật; transaction thay đổi bản sao, chi tiết mượn, trạng thái phiếu và khoản phạt, rollback nếu lỗi.
export const returnBook = async (id, returns, librarianId) => {
    if (!Array.isArray(returns) || returns.length === 0) {
        throw new apiError(400, 'returns must be a non-empty array');
    }
    if (returns.some((item) => !item || !['Good', 'Damaged', 'Lost'].includes(item.condition))) {
        throw new apiError(400, 'Every return item must include a valid condition');
    }
    const requestedCopyIds = returns.map((item) => String(item?.copyId));
    if (requestedCopyIds.some((copyId) => copyId === 'undefined' || copyId === 'null')) {
        throw new apiError(400, 'Every return item must include a copyId');
    }
    if (new Set(requestedCopyIds).size !== requestedCopyIds.length) {
        throw new apiError(400, 'Duplicate returned book copies are not allowed');
    }

    // Kiểm tra sơ bộ các bản sao trước khi mở transaction để từ chối sớm request không hợp lệ.
    const requestedCard = await BorrowCards.findById(id).select('status details');
    if (!requestedCard) throw new apiError(404, 'Borrow card not found');
    if (!['Borrowing', 'PartiallyReturned', 'Overdue'].includes(requestedCard.status)) {
        throw new apiError(409, 'This borrow card cannot receive returns');
    }
    const detailByCopyId = new Map(
        requestedCard.details.map((detail) => [String(detail.copyId), detail])
    );
    for (const copyId of requestedCopyIds) {
        const detail = detailByCopyId.get(copyId);
        if (!detail) {
            throw new apiError(400, `Book copy ${copyId} does not belong to this borrow card`);
        }
        if (detail.returnedAt) {
            throw new apiError(409, `Book copy ${copyId} was already returned`);
        }
    }
    const requestedCopies = await BookCopy.find({ _id: { $in: requestedCopyIds } }).select('_id status');
    if (requestedCopies.length !== requestedCopyIds.length) {
        throw new apiError(404, 'One or more returned book copies were not found');
    }
    const unavailableCopy = requestedCopies.find((copy) => copy.status !== 'Borrowed');
    if (unavailableCopy) {
        throw new apiError(409, `Book copy ${unavailableCopy._id} is not currently borrowed`);
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const librarian = await Librarians.findOne({ _id: librarianId, status: 'Active' }).session(session);
        if (!librarian) throw new apiError(403, 'Active librarian account is required');
        const card = await BorrowCards.findById(id).session(session);
        if (!card) throw new apiError(404, 'Borrow card not found');
        if (!['Borrowing', 'PartiallyReturned', 'Overdue'].includes(card.status)) {
            throw new apiError(409, 'This borrow card cannot receive returns');
        }
        const returnMap = new Map(returns.map((item) => [String(item.copyId), item.condition]));
        const transactionDetailByCopyId = new Map(
            card.details.map((detail) => [String(detail.copyId), detail])
        );
        for (const copyId of requestedCopyIds) {
            const detail = transactionDetailByCopyId.get(copyId);
            if (!detail) {
                throw new apiError(400, `Book copy ${copyId} does not belong to this borrow card`);
            }
            if (detail.returnedAt) {
                throw new apiError(409, `Book copy ${copyId} was already returned`);
            }
        }
        // Ghi nhận cùng thời điểm trả, cập nhật tồn kho và tính tổng tiền phạt theo hạn trả/tình trạng.
        const now = new Date();
        for (const detail of card.details) {
            const condition = returnMap.get(String(detail.copyId));
            if (!condition) continue;
            if (detail.returnedAt) throw new apiError(409, `Book copy ${detail.copyId} was already returned`);
            const copy = await BookCopy.findById(detail.copyId).session(session);
            if (!copy) throw new apiError(404, `Book copy ${detail.copyId} not found`);
            if (copy.status !== 'Borrowed') {
                throw new apiError(409, `Book copy ${detail.copyId} is not currently borrowed`);
            }
            detail.returnedAt = now;
            detail.condition = condition;
            copy.status = condition === 'Good' ? 'Available' : condition;
            await copy.save({ session });

            const overdueDays = Math.max(Math.ceil((now - card.dueDate) / 86400000), 0);
            const fineData = [];
            if (overdueDays > 0) fineData.push({ reason: 'Overdue', amount: overdueDays * fineRates.overdue });
            if (condition === 'Damaged') fineData.push({ reason: 'Damaged', amount: fineRates.damaged });
            if (condition === 'Lost') fineData.push({ reason: 'Lost', amount: fineRates.lost });
            if (fineData.length) {
                const reason = condition === 'Lost' ? 'Lost' : condition === 'Damaged' ? 'Damaged' : 'Overdue';
                await Fines.create([{
                    borrowCardId: card._id,
                    detailId: detail._id,
                    readerId: card.readerId,
                    reason,
                    amount: fineData.reduce((total, fine) => total + fine.amount, 0)
                }], { session });
            }
        }
        // Tính trạng thái phiếu từ các dòng đã trả và hạn trả sau khi xử lý danh sách lần này.
        card.status = card.details.every((detail) => detail.returnedAt)
            ? 'Returned'
            : card.details.some((detail) => detail.returnedAt) ? 'PartiallyReturned' : card.status;
        if (card.status !== 'Returned' && now > card.dueDate) card.status = 'Overdue';
        card.librarianId = librarianId;
        await card.save({ session });
        await session.commitTransaction();
        return card;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export { approveBorrow as approveBorrowCard, returnBook as returnBorrowCard };
