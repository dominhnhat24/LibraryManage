// [TỔNG QUAN QUẢN TRỊ] Tổng hợp số liệu thật từ MongoDB, không trả dữ liệu minh họa.
import Book from '../models/book.model.js';
import Chapter from '../models/chapter.model.js';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
import Report from '../models/report.model.js';
import ReadingEvent from '../models/reading-event.model.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/async-handler.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function getVietnamDateParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

function dateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function activityWindow(days, now) {
    const current = getVietnamDateParts(now);
    // Dùng ngày lịch tại Việt Nam, còn timestamp bắt đầu quy đổi về UTC.
    const firstDayUtc = Date.UTC(current.year, current.month - 1, current.day - (days - 1));
    const labels = Array.from({ length: days }, (_, index) => {
        const date = new Date(firstDayUtc + index * MS_PER_DAY);
        return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    });
    return { startDate: new Date(firstDayUtc - VN_OFFSET_MS), labels };
}

export const getAdminDashboard = asyncHandler(async (req, res) => {
    const requestedDays = Number.parseInt(String(req.query.days ?? '7'), 10);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 7;
    const now = new Date();
    const { startDate, labels } = activityWindow(days, now);

    const [
        totalBooks,
        totalChapters,
        totalUsers,
        activeSubscriptions,
        pendingSubscriptions,
        openReports,
        categories,
        dailyReadCounts,
        recentReadCount,
    ] = await Promise.all([
        Book.countDocuments({}),
        Chapter.countDocuments({}),
        User.countDocuments({}),
        Subscription.countDocuments({ status: 'active', expires_at: { $gt: now } }),
        Subscription.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'open' }),
        Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        ReadingEvent.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: now } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIME_ZONE }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        ReadingEvent.countDocuments({ createdAt: { $gte: startDate, $lte: now } })
    ]);

    const activityMap = new Map(dailyReadCounts.map((item) => [item._id, item.count]));
    const readingActivity = labels.map((date) => ({ date, count: activityMap.get(date) ?? 0 }));

    return res.json({
        status: 'success',
        data: {
            metrics: {
                totalBooks,
                totalChapters,
                totalUsers,
                activeSubscriptions,
                pendingSubscriptions,
                openReports
            },
            categories: categories.map((item) => ({ category: String(item._id ?? 'other'), count: item.count })),
            readingActivity,
            readingActivityTotal: recentReadCount,
            periodDays: days,
            system: {
                api: 'connected',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
            }
        }
    });
});
