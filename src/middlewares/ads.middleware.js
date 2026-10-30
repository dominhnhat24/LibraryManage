// Ad eligibility is a reading-progress signal only; it never requests an ad impression.
// Khai báo ADS_CHAPTER_INTERVAL nhận giá trị từ 6. const giữ biến không gán lại; let cho phép cập nhật.
/**
 * Tệp src/middlewares/ads.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
export const ADS_CHAPTER_INTERVAL = 6;
/**
 * Hàm shouldShowAd: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: chaptersSinceLastAd.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 */
export const shouldShowAd = (chaptersSinceLastAd) => chaptersSinceLastAd >= ADS_CHAPTER_INTERVAL;
