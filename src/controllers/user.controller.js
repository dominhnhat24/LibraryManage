// Import * as userService từ ../services/user.service.js để dùng trong module.
/**
 * Tệp src/controllers/user.controller.js: điều khiển request/response và gọi service/model. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import * as userService from '../services/user.service.js';
// Import { asyncHandler } từ ../utils/async-handler.js để dùng trong module.
import { asyncHandler } from '../utils/async-handler.js';
// Import { mapDtoList, toUserDto } từ ../utils/api-dto.js để dùng trong module.
import { mapDtoList, toUserDto } from '../utils/api-dto.js';

// Hàm createUser: Tạo tài khoản qua service và trả HTTP 201 cùng hồ sơ không chứa thông tin bí mật.
// Khai báo createUser nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const createUser = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.createUser({ ...req.body }). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.createUser({ ...req.body });
    // return kết thúc hàm và trả res.status(201).json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.status(201).json({ status: 'success', data: toUserDto(user) });
});

// Hàm getAllUsers: Trả danh sách user đã lọc/phân trang cho tuyến quản trị.
// Khai báo getAllUsers nhận giá trị từ asyncHandler(async (req, res) => { const result = await. const giữ biến không gán lại; let cho phép cập nhật.
export const getAllUsers = asyncHandler(async (req, res) => {
    // Khai báo result nhận giá trị từ await userService.getAllUsers({ ...req.query }). const giữ biến không gán lại; let cho phép cập nhật.
    const result = await userService.getAllUsers({ ...req.query });
    // return kết thúc hàm và trả res.json({ status: 'success', data: mapDtoList(result.users, toUserDto), pa về nơi gọi.
    return res.json({
        // Trường status lưu 'success' làm giá trị trong object.
        status: 'success',
        // Trường data lưu mapDtoList(result.users, toUserDto) làm giá trị trong object.
        data: mapDtoList(result.users, toUserDto),
        // Trường pagination lưu result.pagination làm giá trị trong object.
        pagination: result.pagination
    });
});

// Hàm getUser: Lấy hồ sơ công khai bằng ID và trả lỗi 404 thống nhất từ service.
// Khai báo getUser nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const getUser = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.getUserById(req.params.userId). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.getUserById(req.params.userId);
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Hàm updateUser: Chuyển payload đã validation tới service; các quyền và trường bí mật không bị cập nhật.
// Khai báo updateUser nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const updateUser = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.updateUser(req.params.userId, { ...re. const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.updateUser(req.params.userId, { ...req.body });
    // return kết thúc hàm và trả res.json({ status: 'success', data: toUserDto(user) }) về nơi gọi.
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Hàm deleteUser: Xóa tài khoản theo ID và trả hồ sơ đã loại bỏ dưới response JSON.
// Khai báo deleteUser nhận giá trị từ asyncHandler(async (req, res) => { const user = await u. const giữ biến không gán lại; let cho phép cập nhật.
export const deleteUser = asyncHandler(async (req, res) => {
    // Khai báo user nhận giá trị từ await userService.deleteUser(req.params.userId). const giữ biến không gán lại; let cho phép cập nhật.
    const user = await userService.deleteUser(req.params.userId);
    // return kết thúc hàm và trả res.json({ status: 'success', message: 'User deleted successfully', data: t về nơi gọi.
    return res.json({ status: 'success', message: 'User deleted successfully', data: toUserDto(user) });
});
