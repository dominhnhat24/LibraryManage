import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { mapDtoList, toUserDto } from '../utils/api-dto.js';

// Hàm createUser: Tạo tài khoản qua service và trả HTTP 201 cùng hồ sơ không chứa thông tin bí mật.
export const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser({ ...req.body });
    return res.status(201).json({ status: 'success', data: toUserDto(user) });
});

// Hàm getAllUsers: Trả danh sách user đã lọc/phân trang cho tuyến quản trị.
export const getAllUsers = asyncHandler(async (req, res) => {
    const result = await userService.getAllUsers({ ...req.query });
    return res.json({
        status: 'success',
        data: mapDtoList(result.users, toUserDto),
        pagination: result.pagination
    });
});

// Hàm getUser: Lấy hồ sơ công khai bằng ID và trả lỗi 404 thống nhất từ service.
export const getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.userId);
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Hàm updateUser: Chuyển payload đã validation tới service; các quyền và trường bí mật không bị cập nhật.
export const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.userId, { ...req.body });
    return res.json({ status: 'success', data: toUserDto(user) });
});

// Hàm deleteUser: Xóa tài khoản theo ID và trả hồ sơ đã loại bỏ dưới response JSON.
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await userService.deleteUser(req.params.userId);
    return res.json({ status: 'success', message: 'User deleted successfully', data: toUserDto(user) });
});
