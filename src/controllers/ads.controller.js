// [CONTROLLER ĐỌC CHƯƠNG] Trả chương sau khi kiểm tra quyền và đính kèm quyết định quảng cáo.
// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/controllers/ads.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { recordReadingOpen } từ ../services/reading-progress.service.js để dùng trong module.
import { recordReadingOpen } from '../services/reading-progress.service.js';

// [NỘI DUNG CHƯƠNG] Tìm chương bằng ID đã lưu trong sách và không để lộ file/tài nguyên nội bộ.
// Khai báo readChapter nhận giá trị từ asyncHandler(async (req, res) => { const chapter = req.. const giữ biến không gán lại; let cho phép cập nhật.
export const readChapter = asyncHandler(async (req, res) => {
    // Khai báo chapter nhận giá trị từ req.chapter. const giữ biến không gán lại; let cho phép cập nhật.
    const chapter = req.chapter;
    // if chỉ chạy nhánh này khi điều kiện !chapter đúng.
    if (!chapter) throw new ApiError(404, 'Chapter not found');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await recordReadingOpen(req.authUser?._id, req.book._id, chapter._id).catch
    await recordReadingOpen(req.authUser?._id, req.book._id, chapter._id).catch((error) => {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error('HarveyBook could not save chapter-open progress:', error?.me
        console.error('HarveyBook could not save chapter-open progress:', error?.message || error);
    });
    // return kết thúc hàm và trả res.json({ status: 'success', data: { book_id: req.book.id, chapter: { id:  về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu { book_id: req.book.id, chapter: { id: chapter.id, titl làm giá trị trong object.
        data: {
            // Trường book_id lưu req.book.id làm giá trị trong object.
            book_id: req.book.id,
            // Trường chapter lưu { id: chapter.id, title: chapter.title, order: chapter. làm giá trị trong object.
            chapter: {
                // Trường id lưu chapter.id làm giá trị trong object.
                id: chapter.id,
                // Trường title lưu chapter.title làm giá trị trong object.
                title: chapter.title,
                // Trường order lưu chapter.chapter_number làm giá trị trong object.
                order: chapter.chapter_number,
                // Trường content lưu chapter.content làm giá trị trong object.
                content: chapter.content
            }
        }
    });
});
