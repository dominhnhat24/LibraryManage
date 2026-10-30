// Import ApiError từ ../utils/api-error.js để dùng trong module.
/**
 * Tệp src/middlewares/validate.middleware.js: kiểm tra/điều chỉnh request trong pipeline. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import ApiError from '../utils/api-error.js';

// Hàm createValidator: Kiểm tra một phần request theo Joi schema và thay bằng dữ liệu đã chuẩn hóa.
/**
 * Hàm createValidator: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: property, schema.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: validate, Boolean, map, join, next, ApiError, defineProperty.
 */
const createValidator = (property, schema) => (req, res, next) => {
    // Khai báo { error, value } nhận giá trị từ schema.validate(req[property], { abortEarly: false, con. const giữ biến không gán lại; let cho phép cập nhật.
    const { error, value } = schema.validate(req[property], {
        // Trường abortEarly lưu false làm giá trị trong object.
        abortEarly: false,
        // Trường convert lưu property !== 'params' làm giá trị trong object.
        convert: property !== 'params',
        // Trường stripUnknown lưu true làm giá trị trong object.
        stripUnknown: true,
        // Trường context lưu { authenticated: Boolean(req.authUser) } làm giá trị trong object.
        context: { authenticated: Boolean(req.authUser) }
    });

    // if chỉ chạy nhánh này khi điều kiện error đúng.
    if (error) {
        // Khai báo violations nhận giá trị từ error.details.map(({ path, message }) => ({ field: path. const giữ biến không gán lại; let cho phép cập nhật.
        const violations = error.details.map(({ path, message }) => ({
            // Trường field lưu path.join('.') làm giá trị trong object.
            field: path.join('.'),
            // Khóa message nhận biến cùng tên làm giá trị.
            message
        }));
        // return kết thúc hàm và trả next(new ApiError(400, 'Request validation failed', violations)) về nơi gọi.
        return next(new ApiError(400, 'Request validation failed', violations));
    }

    // if chỉ chạy nhánh này khi điều kiện property === 'query' đúng.
    if (property === 'query') {
        // Gọi/thực thi Object.defineProperty với các đối số để thực hiện thao tác: Object.defineProperty(req, 'query', { configurable: true, enumerable: true,
        Object.defineProperty(req, 'query', {
            // Trường configurable lưu true làm giá trị trong object.
            configurable: true,
            // Trường enumerable lưu true làm giá trị trong object.
            enumerable: true,
            // Trường writable lưu true làm giá trị trong object.
            writable: true,
            // Khóa value nhận biến cùng tên làm giá trị.
            value
        });
    } else {
        // Gọi/thực thi biểu thức để thực hiện thao tác: req[property] = value
        req[property] = value;
    }
    // return kết thúc hàm và trả next() về nơi gọi.
    return next();
};

// Hàm validateBody: Xác thực body bằng schema Joi, loại trường không khai báo và chuyển lỗi về ApiError 400.
/**
 * Hàm validateBody: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: schema.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createValidator.
 */
export const validateBody = (schema) => createValidator('body', schema);

// Hàm validateParams: Xác thực route params trước khi controller truy vấn tài nguyên.
/**
 * Hàm validateParams: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: schema.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createValidator.
 */
export const validateParams = (schema) => createValidator('params', schema);

// Hàm validateQuery: Xác thực query string, chuyển kiểu dữ liệu và bỏ các query field không được hỗ trợ.
/**
 * Hàm validateQuery: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: schema.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: createValidator.
 */
export const validateQuery = (schema) => createValidator('query', schema);
