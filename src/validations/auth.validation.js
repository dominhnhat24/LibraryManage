// Import Joi từ joi để dùng trong module.
/**
 * Tệp src/validations/auth.validation.js: kiểm tra dữ liệu đầu vào. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Joi from 'joi';

// Khai báo email nhận giá trị từ Joi.string().trim().lowercase().email().max(254).requir. const giữ biến không gán lại; let cho phép cập nhật.
const email = Joi.string().trim().lowercase().email().max(254).required();

// Hàm makeAuthSchemas: Định nghĩa schema Joi cho đăng ký và đăng nhập, chỉ giữ các trường được cho phép.
// Khai báo authValidation nhận giá trị từ Object.freeze({ register: Joi.object({ name: Joi.string. const giữ biến không gán lại; let cho phép cập nhật.
export const authValidation = Object.freeze({
    // Trường register lưu Joi.object({ name: Joi.string().trim().min(1).max(100), làm giá trị trong object.
    register: Joi.object({
        // Trường name lưu Joi.string().trim().min(1).max(100) làm giá trị trong object.
        name: Joi.string().trim().min(1).max(100),
        // Trường full_name lưu Joi.string().trim().min(1).max(100) làm giá trị trong object.
        full_name: Joi.string().trim().min(1).max(100),
        // Khóa email nhận biến cùng tên làm giá trị.
        email,
        // Trường phone_number lưu Joi.string().trim().pattern(/^\+?[0-9()\s-]{7,12}$/).al làm giá trị trong object.
        phone_number: Joi.string().trim().pattern(/^\+?[0-9()\s-]{7,12}$/).allow('', null),
        // Trường password lưu Joi.string().min(8).max(128).required() làm giá trị trong object.
        password: Joi.string().min(8).max(128).required()
    }).xor('name', 'full_name'),
    // Trường login lưu Joi.object({ email, password: Joi.string().min(1).max(1 làm giá trị trong object.
    login: Joi.object({
        // Khóa email nhận biến cùng tên làm giá trị.
        email,
        // Trường password lưu Joi.string().min(1).max(128).required() làm giá trị trong object.
        password: Joi.string().min(1).max(128).required()
    }),
    // Trường refresh lưu Joi.object({ refresh_token: Joi.string() .pattern(/^[A- làm giá trị trong object.
    refresh: Joi.object({
        // Trường refresh_token lưu Joi.string() .pattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\ làm giá trị trong object.
        refresh_token: Joi.string()
            .pattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
            .max(4096)
            .required()
    }),
    // Trường verifyEmail lưu Joi.object({ email, otp: Joi.string().pattern(/^\d{6}$/ làm giá trị trong object.
    verifyEmail: Joi.object({
        // Khóa email nhận biến cùng tên làm giá trị.
        email,
        // Trường otp lưu Joi.string().pattern(/^\d{6}$/).required() làm giá trị trong object.
        otp: Joi.string().pattern(/^\d{6}$/).required()
    }),
    // Trường resendVerification lưu Joi.object({ email }) làm giá trị trong object.
    resendVerification: Joi.object({
        // Khóa email nhận biến cùng tên làm giá trị.
        email
    }),
    // Trường updateProfile lưu Joi.object({ name: Joi.string().trim().min(1).max(100), làm giá trị trong object.
    updateProfile: Joi.object({
        // Trường name lưu Joi.string().trim().min(1).max(100) làm giá trị trong object.
        name: Joi.string().trim().min(1).max(100),
        // Trường phone_number lưu Joi.string().trim().max(12).allow('', null) làm giá trị trong object.
        phone_number: Joi.string().trim().max(12).allow('', null)
    }).min(1),
    // Trường changePassword lưu Joi.object({ current_password: Joi.string().min(1).max( làm giá trị trong object.
    changePassword: Joi.object({
        // Trường current_password lưu Joi.string().min(1).max(128).required() làm giá trị trong object.
        current_password: Joi.string().min(1).max(128).required(),
        // Trường new_password lưu Joi.string().min(8).max(128).required() làm giá trị trong object.
        new_password: Joi.string().min(8).max(128).required()
    })
});

// Khai báo registerSchema nhận giá trị từ authValidation.register. const giữ biến không gán lại; let cho phép cập nhật.
export const registerSchema = authValidation.register;
// Khai báo loginSchema nhận giá trị từ authValidation.login. const giữ biến không gán lại; let cho phép cập nhật.
export const loginSchema = authValidation.login;
// Khai báo refreshSchema nhận giá trị từ authValidation.refresh. const giữ biến không gán lại; let cho phép cập nhật.
export const refreshSchema = authValidation.refresh;
// Khai báo verifyEmailSchema nhận giá trị từ authValidation.verifyEmail. const giữ biến không gán lại; let cho phép cập nhật.
export const verifyEmailSchema = authValidation.verifyEmail;
// Khai báo resendVerificationSchema nhận giá trị từ authValidation.resendVerification. const giữ biến không gán lại; let cho phép cập nhật.
export const resendVerificationSchema = authValidation.resendVerification;
