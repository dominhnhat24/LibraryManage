import ApiError from '../utils/api-error.js';

// Hàm createValidator: Kiểm tra một phần request theo Joi schema và thay bằng dữ liệu đã chuẩn hóa.
const createValidator = (property, schema) => (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        convert: property !== 'params',
        stripUnknown: true,
        context: { authenticated: Boolean(req.authUser) }
    });

    if (error) {
        const violations = error.details.map(({ path, message }) => ({
            field: path.join('.'),
            message
        }));
        return next(new ApiError(400, 'Request validation failed', violations));
    }

    if (property === 'query') {
        Object.defineProperty(req, 'query', {
            configurable: true,
            enumerable: true,
            writable: true,
            value
        });
    } else {
        req[property] = value;
    }
    return next();
};

// Hàm validateBody: Xác thực body bằng schema Joi, loại trường không khai báo và chuyển lỗi về ApiError 400.
export const validateBody = (schema) => createValidator('body', schema);

// Hàm validateParams: Xác thực route params trước khi controller truy vấn tài nguyên.
export const validateParams = (schema) => createValidator('params', schema);

// Hàm validateQuery: Xác thực query string, chuyển kiểu dữ liệu và bỏ các query field không được hỗ trợ.
export const validateQuery = (schema) => createValidator('query', schema);
