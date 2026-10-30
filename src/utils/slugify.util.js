// Import slugifyPackage từ slugify để dùng trong module.
/**
 * Tệp src/utils/slugify.util.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import slugifyPackage from 'slugify';

// Hàm slugify: Chuẩn hóa tiêu đề thành slug URL an toàn, bỏ dấu tiếng Việt và ký tự không phù hợp.
/**
 * Hàm slugify: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: slugifyPackage, String, replace.
 */
export const slugify = (value) => slugifyPackage(
    String(value).replace(/[đĐ]/g, (character) => character === 'Đ' ? 'D' : 'd'),
    {
        // Trường lower lưu true làm giá trị trong object.
        lower: true,
        // Trường strict lưu true làm giá trị trong object.
        strict: true,
        // Trường trim lưu true làm giá trị trong object.
        trim: true
    }
);

// Hàm createUniqueSlug: Tạo slug duy nhất bằng cách thêm hậu tố tăng dần khi slug đã tồn tại.
/**
 * Hàm createUniqueSlug: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: Model, title, currentId mặc định null.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: slugify, exists.
 */
export const createUniqueSlug = async (Model, title, currentId = null) => {
    // Khai báo baseSlug nhận giá trị từ slugify(title) || 'resource'. const giữ biến không gán lại; let cho phép cập nhật.
    const baseSlug = slugify(title) || 'resource';
    // Khai báo candidate nhận giá trị từ baseSlug. const giữ biến không gán lại; let cho phép cập nhật.
    let candidate = baseSlug;
    // Khai báo suffix nhận giá trị từ 1. const giữ biến không gán lại; let cho phép cập nhật.
    let suffix = 1;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    while (await Model.exists({
        // Trường slug lưu candidate làm giá trị trong object.
        slug: candidate,
        ...(currentId ? { _id: { $ne: currentId } } : {})
    })) {
        // Gọi/thực thi biểu thức để thực hiện thao tác: suffix += 1
        suffix += 1;
        // Gọi/thực thi biểu thức để thực hiện thao tác: candidate = `${baseSlug}-${suffix}`
        candidate = `${baseSlug}-${suffix}`;
    }
    // return kết thúc hàm và trả candidate về nơi gọi.
    return candidate;
};