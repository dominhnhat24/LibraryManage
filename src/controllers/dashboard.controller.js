// [TỔNG QUAN QUẢN TRỊ] Tổng hợp số liệu thật từ MongoDB, không trả dữ liệu minh họa.
// Import Book từ ../models/book.model.js để dùng trong module.
/**
 * Tệp src/controllers/dashboard.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Book from '../models/book.model.js';
// Import Chapter từ ../models/chapter.model.js để dùng trong module.
import Chapter from '../models/chapter.model.js';
// Import User từ ../models/user.model.js để dùng trong module.
import User from '../models/user.model.js';
// Import Subscription từ ../models/subscription.model.js để dùng trong module.
import Subscription from '../models/subscription.model.js';
// Import Report từ ../models/report.model.js để dùng trong module.
import Report from '../models/report.model.js';
// Import ReadingEvent từ ../models/reading-event.model.js để dùng trong module.
import ReadingEvent from '../models/reading-event.model.js';
// Import mongoose từ mongoose để dùng trong module.
import mongoose from 'mongoose';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';

// Khai báo TIME_ZONE nhận giá trị từ 'Asia/Ho_Chi_Minh'. const giữ biến không gán lại; let cho phép cập nhật.
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
// Khai báo MS_PER_DAY nhận giá trị từ 24 * 60 * 60 * 1000. const giữ biến không gán lại; let cho phép cập nhật.
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Khai báo VN_OFFSET_MS nhận giá trị từ 7 * 60 * 60 * 1000. const giữ biến không gán lại; let cho phép cập nhật.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Hàm getVietnamDateParts: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: date.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: DateTimeFormat, formatToParts, fromEntries, map, Number.
 */
function getVietnamDateParts(date) {
    // Khai báo parts nhận giá trị từ new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE,. const giữ biến không gán lại; let cho phép cập nhật.
    const parts = new Intl.DateTimeFormat('en-US', {
        // Trường timeZone lưu TIME_ZONE làm giá trị trong object.
        timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    // Khai báo value nhận giá trị từ Object.fromEntries(parts.map(({ type, value }) => [type. const giữ biến không gán lại; let cho phép cập nhật.
    const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    // return kết thúc hàm và trả { year: Number(value.year), month: Number(value.month), day: Number(value.d về nơi gọi.
    return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

/**
 * Hàm dateKey: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: year, month, day.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, padStart.
 */
function dateKey(year, month, day) {
    // return kết thúc hàm và trả `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` về nơi gọi.
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Hàm activityWindow: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: days, now.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: getVietnamDateParts, UTC, from, Date, dateKey, getUTCFullYear, getUTCMonth, getUTCDate.
 */
function activityWindow(days, now) {
    // Khai báo current nhận giá trị từ getVietnamDateParts(now). const giữ biến không gán lại; let cho phép cập nhật.
    const current = getVietnamDateParts(now);
    // Dùng ngày lịch tại Việt Nam, còn timestamp bắt đầu quy đổi về UTC.
    // Khai báo firstDayUtc nhận giá trị từ Date.UTC(current.year, current.month - 1, current.day -. const giữ biến không gán lại; let cho phép cập nhật.
    const firstDayUtc = Date.UTC(current.year, current.month - 1, current.day - (days - 1));
    // Khai báo labels nhận giá trị từ Array.from({ length: days }, (_, index) => { const date. const giữ biến không gán lại; let cho phép cập nhật.
    const labels = Array.from({ length: days }, (_, index) => {
        // Khai báo date nhận giá trị từ new Date(firstDayUtc + index * MS_PER_DAY). const giữ biến không gán lại; let cho phép cập nhật.
        const date = new Date(firstDayUtc + index * MS_PER_DAY);
        // return kết thúc hàm và trả dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) về nơi gọi.
        return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    });
    // return kết thúc hàm và trả { startDate: new Date(firstDayUtc - VN_OFFSET_MS), labels } về nơi gọi.
    return { startDate: new Date(firstDayUtc - VN_OFFSET_MS), labels };
}

// Khai báo getAdminDashboard nhận giá trị từ asyncHandler(async (req, res) => { const requestedDays . const giữ biến không gán lại; let cho phép cập nhật.
export const getAdminDashboard = asyncHandler(async (req, res) => {
    // Khai báo requestedDays nhận giá trị từ Number.parseInt(String(req.query.days ?? '7'), 10). const giữ biến không gán lại; let cho phép cập nhật.
    const requestedDays = Number.parseInt(String(req.query.days ?? '7'), 10);
    // Khai báo days nhận giá trị từ [7, 30, 90].includes(requestedDays) ? requestedDays : 7. const giữ biến không gán lại; let cho phép cập nhật.
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 7;
    // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
    const now = new Date();
    // Khai báo { startDate, labels } nhận giá trị từ activityWindow(days, now). const giữ biến không gán lại; let cho phép cập nhật.
    const { startDate, labels } = activityWindow(days, now);

    // Khai báo [ totalBooks, totalChapters, totalUser nhận giá trị từ await Promise.all([ Book.countDocuments({}), Chapter.co. const giữ biến không gán lại; let cho phép cập nhật.
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
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        ReadingEvent.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: now } } },
            {
                // Trường $group lưu { _id: { $dateToString: { format: '%Y-%m-%d', date: '$c làm giá trị trong object.
                $group: {
                    // Trường _id lưu { $dateToString: { format: '%Y-%m-%d', date: '$createdA làm giá trị trong object.
                    _id: {
                        // Trường $dateToString lưu { format: '%Y-%m-%d', date: '$createdAt', timezone: TIM làm giá trị trong object.
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TIME_ZONE }
                    },
                    // Trường count lưu { $sum: 1 } làm giá trị trong object.
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        ReadingEvent.countDocuments({ createdAt: { $gte: startDate, $lte: now } })
    ]);

    // Khai báo activityMap nhận giá trị từ new Map(dailyReadCounts.map((item) => [item._id, item.c. const giữ biến không gán lại; let cho phép cập nhật.
    const activityMap = new Map(dailyReadCounts.map((item) => [item._id, item.count]));
    // Khai báo readingActivity nhận giá trị từ labels.map((date) => ({ date, count: activityMap.get(da. const giữ biến không gán lại; let cho phép cập nhật.
    const readingActivity = labels.map((date) => ({ date, count: activityMap.get(date) ?? 0 }));

    // return kết thúc hàm và trả res.json({ status: 'success', data: { metrics: { totalBooks, totalChapters, về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu { metrics: { totalBooks, totalChapters, totalUsers, act làm giá trị trong object.
        data: {
            // Trường metrics lưu { totalBooks, totalChapters, totalUsers, activeSubscrip làm giá trị trong object.
            metrics: {
                // Khóa totalBooks nhận biến cùng tên làm giá trị.
                totalBooks,
                // Khóa totalChapters nhận biến cùng tên làm giá trị.
                totalChapters,
                // Khóa totalUsers nhận biến cùng tên làm giá trị.
                totalUsers,
                // Khóa activeSubscriptions nhận biến cùng tên làm giá trị.
                activeSubscriptions,
                // Khóa pendingSubscriptions nhận biến cùng tên làm giá trị.
                pendingSubscriptions,
                // Khóa openReports nhận biến cùng tên làm giá trị.
                openReports
            },
            // Trường categories lưu categories.map((item) => ({ category: String(item._id ? làm giá trị trong object.
            categories: categories.map((item) => ({ category: String(item._id ?? 'other'), count: item.count })),
            // Khóa readingActivity nhận biến cùng tên làm giá trị.
            readingActivity,
            // Trường readingActivityTotal lưu recentReadCount làm giá trị trong object.
            readingActivityTotal: recentReadCount,
            // Trường periodDays lưu days làm giá trị trong object.
            periodDays: days,
            // Trường system lưu { api: 'connected', database: mongoose.connection.ready làm giá trị trong object.
            system: {
                // Trường api lưu 'connected' làm giá trị trong object.
                api: 'connected',
                // Trường database lưu mongoose.connection.readyState === 1 ? 'connected' : 'd làm giá trị trong object.
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
            }
        }
    });
});
