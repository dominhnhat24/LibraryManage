// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
/**
 * Tệp src/controllers/avatar.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { asyncHandler } from '../utils/async-handler.js';
// Import { removeAvatar, resolveAvatar, saveAvatar } từ ../utils/avatar-storage.js để dùng trong module.
import { removeAvatar, resolveAvatar, saveAvatar } from '../utils/avatar-storage.js';
// Import { toUserDto } từ ../utils/api-dto.js để dùng trong module.
import { toUserDto } from '../utils/api-dto.js';
// Import User từ ../models/user.model.js để dùng trong module.
import User from '../models/user.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';

/**
 * Hàm avatarKeyFromUrl: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: startsWith, slice.
 */
const avatarKeyFromUrl = (value) => {
    // Khai báo prefix nhận giá trị từ '/api/v1/auth/avatars/'. const giữ biến không gán lại; let cho phép cập nhật.
    const prefix = '/api/v1/auth/avatars/';
    // return kết thúc hàm và trả typeof value === 'string' && value.startsWith(prefix) ? value.slice(prefix. về nơi gọi.
    return typeof value === 'string' && value.startsWith(prefix) ? value.slice(prefix.length) : null;
};

// Khai báo uploadMyAvatar nhận giá trị từ asyncHandler(async (req, res) => { if (!req.file) throw. const giữ biến không gán lại; let cho phép cập nhật.
export const uploadMyAvatar = asyncHandler(async (req, res) => {
    // if chỉ chạy nhánh này khi điều kiện !req.file đúng.
    if (!req.file) throw new ApiError(400, 'Avatar image is required');
    // Khai báo stored nhận giá trị từ await saveAvatar(req.file). const giữ biến không gán lại; let cho phép cập nhật.
    const stored = await saveAvatar(req.file);
    // Khai báo avatarUrl nhận giá trị từ `/api/v1/auth/avatars/${stored.key}`. const giữ biến không gán lại; let cho phép cập nhật.
    const avatarUrl = `/api/v1/auth/avatars/${stored.key}`;
    // Khai báo oldKey nhận giá trị từ avatarKeyFromUrl(req.authUser.avatar_url). const giữ biến không gán lại; let cho phép cập nhật.
    const oldKey = avatarKeyFromUrl(req.authUser.avatar_url);
    // Khai báo user nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let user;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: user = await User.findByIdAndUpdate(req.authUser._id, { $set: { avatar_url:
        user = await User.findByIdAndUpdate(req.authUser._id, { $set: { avatar_url: avatarUrl } },
            { new: true, runValidators: true });
        // if chỉ chạy nhánh này khi điều kiện !user đúng.
        if (!user) throw new ApiError(404, 'User not found');
    } catch (error) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await removeAvatar(stored.key).catch(() => {})
        await removeAvatar(stored.key).catch(() => {});
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // if chỉ chạy nhánh này khi điều kiện oldKey && oldKey !== stored.key đúng.
    if (oldKey && oldKey !== stored.key) await removeAvatar(oldKey).catch(() => {});
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Khai báo serveAvatar nhận giá trị từ asyncHandler(async (req, res) => { const avatar = await. const giữ biến không gán lại; let cho phép cập nhật.
export const serveAvatar = asyncHandler(async (req, res) => {
    // Khai báo avatar nhận giá trị từ await resolveAvatar(req.params.key). const giữ biến không gán lại; let cho phép cập nhật.
    const avatar = await resolveAvatar(req.params.key);
    // return kết thúc hàm và trả res.sendFile(avatar.path, { headers: { 'Cache-Control': 'public, max-age=31 về nơi gọi.
    return res.sendFile(avatar.path, { headers: {
        // Trường 'Cache-Control' lưu 'public, max-age=31536000, immutable' làm giá trị trong object.
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Trường 'Content-Type' lưu avatar.content_type làm giá trị trong object.
        'Content-Type': avatar.content_type,
        // Trường 'Content-Security-Policy' lưu "default-src 'none'; sandbox" làm giá trị trong object.
        'Content-Security-Policy': "default-src 'none'; sandbox",
        // Trường 'X-Content-Type-Options' lưu 'nosniff' làm giá trị trong object.
        'X-Content-Type-Options': 'nosniff',
        // Trường 'Content-Disposition' lưu 'inline' làm giá trị trong object.
        'Content-Disposition': 'inline'
    } });
});
