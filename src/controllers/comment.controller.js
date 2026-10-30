// Import * as commentService từ ../services/comment.service.js để dùng trong module.
/**
 * Tệp src/controllers/comment.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import * as commentService from '../services/comment.service.js';

/**
 * Hàm getBookComments: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: getAllComments, status, json, next.
 */
export const getBookComments = async (req, res, next) => {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // Khai báo { bookId } nhận giá trị từ req.params. const giữ biến không gán lại; let cho phép cập nhật.
    const { bookId } = req.params;
    // Khai báo result nhận giá trị từ await commentService.getAllComments(bookId, req.query). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await commentService.getAllComments(bookId, req.query);
    // Gọi/thực thi res.status với các đối số để thực hiện thao tác: res.status(200).json({ status: 'success', data: result.comments, pagination
    res.status(200).json({ status: 'success', data: result.comments, pagination: result.pagination });
  } catch (error) {
    // Gọi/thực thi next với các đối số để thực hiện thao tác: next(error)
    next(error);
  }
};

/**
 * Hàm deleteComment: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: req, res, next.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: status, json, next.
 * Được tham chiếu tại: src/services/comment.service.js.
 */
export const deleteComment = async (req, res, next) => {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
  try {
    // Khai báo { commentId } nhận giá trị từ req.params. const giữ biến không gán lại; let cho phép cập nhật.
    const { commentId } = req.params;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await commentService.deleteComment(commentId, req.user)
    await commentService.deleteComment(commentId, req.user);
    // Gọi/thực thi res.status với các đối số để thực hiện thao tác: res.status(200).json({ status: 'success', message: 'Comment deleted success
    res.status(200).json({ status: 'success', message: 'Comment deleted successfully' });
  } catch (error) {
    // Gọi/thực thi next với các đối số để thực hiện thao tác: next(error)
    next(error);
  }
};