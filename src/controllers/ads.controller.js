// [CONTROLLER ĐỌC CHƯƠNG] Trả chương sau khi kiểm tra quyền và đính kèm quyết định quảng cáo.
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { recordReadingOpen } from '../services/reading-progress.service.js';

// [NỘI DUNG CHƯƠNG] Tìm chương bằng ID đã lưu trong sách và không để lộ file/tài nguyên nội bộ.
export const readChapter = asyncHandler(async (req, res) => {
    const chapter = req.chapter;
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    await recordReadingOpen(req.authUser?._id, req.book._id, chapter._id).catch((error) => {
        console.error('HarveyBook could not save chapter-open progress:', error?.message || error);
    });
    return res.json({
        status: 'success',
        data: {
            book_id: req.book.id,
            chapter: {
                id: chapter.id,
                title: chapter.title,
                order: chapter.chapter_number,
                content: chapter.content
            }
        }
    });
});
