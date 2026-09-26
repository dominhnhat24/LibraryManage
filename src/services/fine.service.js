import { Fines } from '../models/init.js';
import apiError from '../utils/api-error.js';

const readerIdOf = (user) => user?.sub || user?.id;

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

export const getFine = async (fineId, user) => {
    const fine = await Fines.findById(fineId).populate('borrowCardId').populate('readerId');
    if (!fine) throw new apiError(404, 'Fine not found');
    if (user.role === 'reader' && fine.readerId._id.toString() !== readerIdOf(user).toString()) {
        throw new apiError(403, 'You cannot access this fine');
    }
    return fine;
};

export const payFine = async (fineId) => {
    const fine = await Fines.findOneAndUpdate(
        { _id: fineId, status: 'Pending' },
        { status: 'Paid', paidAt: new Date() },
        { returnDocument: 'after' }
    );
    if (!fine) throw new apiError(404, 'Pending fine not found');
    return fine;
};

export const waiveFine = async (fineId, waiverReason) => {
    const fine = await Fines.findOneAndUpdate(
        { _id: fineId, status: 'Pending' },
        { status: 'Waived', waivedAt: new Date(), waiverReason },
        { returnDocument: 'after', runValidators: true }
    );
    if (!fine) throw new apiError(404, 'Pending fine not found');
    return fine;
};
