// [MIDDLEWARE QUẢNG CÁO 3 CHƯƠNG] Hiển thị một quảng cáo sau mỗi ba lượt mở chương của tài khoản USER.
import ReadingProgress from '../models/reading-progress.model.js';
import { asyncHandler } from '../utils/async-handler.js';

// [CHU KỲ QUẢNG CÁO] Một quảng cáo sau ba lượt mở chương; dùng chung trong cập nhật atomic và kiểm thử.
export const ADS_CHAPTER_INTERVAL = 3;
// Hàm shouldShowAd: Xác định cần hiển thị quảng cáo khi bộ đếm đã quay về đầu chu kỳ ba chương.
export const shouldShowAd = (chaptersSinceLastAd) => chaptersSinceLastAd === 0;

// [ĐẾM LƯỢT ĐỌC] Người Premium/VIP không nhận quảng cáo; Free được tính độc lập theo từng sách.
export const trackChapterRead = asyncHandler(async (req, res, next) => {
    if (req.authUser.hasActivePremium()) {
        req.adDecision = { showAd: false, reason: 'premium' };
        return next();
    }

    const filter = { user: req.authUser._id, book: req.book._id };
    
    const update = [{
        $set: {
            user: { $ifNull: ['$user', req.authUser._id] },
            book: { $ifNull: ['$book', req.book._id] },
            total_chapter_reads: { $add: [{ $ifNull: ['$total_chapter_reads', 0] }, 1] },
            chapters_since_ad: {
                $mod: [
                    { $add: [{ $ifNull: ['$chapters_since_ad', 0] }, 1] },
                    ADS_CHAPTER_INTERVAL
                ]
            }
        }
    }];
    let progress;
    try {
        progress = await ReadingProgress.findOneAndUpdate(filter, update, { upsert: true, new: true });
    } catch (error) {
        if (error.code !== 11000) throw error;
        progress = await ReadingProgress.findOneAndUpdate(filter, update, { new: true });
    }
    const showAd = shouldShowAd(progress.chapters_since_ad);
    req.adDecision = { showAd, reason: showAd ? 'every_three_chapters' : 'reading_interval' };
    return next();
});
