import { Books, BookCopy, BorrowCards, Fines, Readers } from '../models/init.js';

export const getDashboardSummary = async () => {
    const now = new Date();
    const [bookCount, readerCount, copyGroups, borrowGroups, overdueCopies, fineGroups] = await Promise.all([
        Books.countDocuments(),
        Readers.countDocuments(),
        BookCopy.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        BorrowCards.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        BorrowCards.aggregate([
            { $match: {
                $or: [
                    { status: 'Overdue' },
                    { status: { $in: ['Borrowing', 'PartiallyReturned'] }, dueDate: { $lt: now } }
                ]
            } },
            { $unwind: '$details' },
            { $match: { 'details.returnedAt': { $exists: false } } },
            { $count: 'count' }
        ]),
        Fines.aggregate([
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                amount: { $sum: '$amount' }
            } }
        ])
    ]);

    const copiesByStatus = Object.fromEntries(copyGroups.map(({ _id, count }) => [_id, count]));
    const borrowCardsByStatus = Object.fromEntries(borrowGroups.map(({ _id, count }) => [_id, count]));
    const finesByStatus = Object.fromEntries(fineGroups.map(({ _id, count, amount }) => [_id, { count, amount }]));

    return {
        books: bookCount,
        readers: readerCount,
        copies: {
            total: Object.values(copiesByStatus).reduce((sum, count) => sum + count, 0),
            byStatus: copiesByStatus
        },
        borrowCards: {
            total: Object.values(borrowCardsByStatus).reduce((sum, count) => sum + count, 0),
            byStatus: borrowCardsByStatus,
            overdueCopies: overdueCopies[0]?.count || 0
        },
        fines: {
            total: Object.values(finesByStatus).reduce((sum, summary) => sum + summary.count, 0),
            totalAmount: Object.values(finesByStatus).reduce((sum, summary) => sum + summary.amount, 0),
            byStatus: finesByStatus
        }
    };
};
