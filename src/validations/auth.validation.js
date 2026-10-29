import Joi from 'joi';

const email = Joi.string().trim().lowercase().email().max(254).required();

// Hàm makeAuthSchemas: Định nghĩa schema Joi cho đăng ký và đăng nhập, chỉ giữ các trường được cho phép.
export const authValidation = Object.freeze({
    register: Joi.object({
        name: Joi.string().trim().min(1).max(100),
        full_name: Joi.string().trim().min(1).max(100),
        email,
        phone_number: Joi.string().trim().pattern(/^\+?[0-9()\s-]{7,12}$/).allow('', null),
        password: Joi.string().min(8).max(128).required()
    }).xor('name', 'full_name'),
    login: Joi.object({
        email,
        password: Joi.string().min(1).max(128).required()
    }),
    refresh: Joi.object({
        refresh_token: Joi.string()
            .pattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
            .max(4096)
            .required()
    }),
    verifyEmail: Joi.object({
        email,
        otp: Joi.string().pattern(/^\d{6}$/).required()
    }),
    resendVerification: Joi.object({
        email
    }),
    updateProfile: Joi.object({
        name: Joi.string().trim().min(1).max(100),
        phone_number: Joi.string().trim().max(12).allow('', null)
    }).min(1),
    changePassword: Joi.object({
        current_password: Joi.string().min(1).max(128).required(),
        new_password: Joi.string().min(8).max(128).required()
    })
});

export const registerSchema = authValidation.register;
export const loginSchema = authValidation.login;
export const refreshSchema = authValidation.refresh;
export const verifyEmailSchema = authValidation.verifyEmail;
export const resendVerificationSchema = authValidation.resendVerification;
