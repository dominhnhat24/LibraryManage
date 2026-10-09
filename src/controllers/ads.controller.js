// [CONTROLLER ĐỌC CHƯƠNG] Trả chương sau khi kiểm tra quyền và đính kèm quyết định quảng cáo.
import ApiError from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// [NỘI DUNG CHƯƠNG] Tìm chương bằng ID đã lưu trong sách và không để lộ file/tài nguyên nội bộ.
export const readChapter = asyncHandler(async (req, res) => {
    const chapter = req.book.chapters.id(req.params.chapterId);
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    return res.json({
        status: 'success',
        data: {
            book_id: req.book.id,
            chapter: {
                id: chapter.id,
                title: chapter.title,
                order: chapter.order,
                content: chapter.content
            },
            ad: req.adDecision
        }
    });
});
