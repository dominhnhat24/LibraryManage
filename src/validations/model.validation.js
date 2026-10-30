// Import Joi từ joi để dùng trong module.
/**
 * Tệp src/validations/model.validation.js: kiểm tra dữ liệu đầu vào. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import Joi from 'joi';
// Import { STATUS } từ ../constants/status.constant.js để dùng trong module.
import { STATUS } from '../constants/status.constant.js';
// Import { authValidation } từ ./auth.validation.js để dùng trong module.
import { authValidation } from './auth.validation.js';

// Khai báo objectId nhận giá trị từ Joi.string().hex().length(24). const giữ biến không gán lại; let cho phép cập nhật.
const objectId = Joi.string().hex().length(24);
// Hàm optionalText: Tạo quy tắc chuỗi đã cắt khoảng trắng và giới hạn độ dài tối đa theo Model.
/**
 * Hàm optionalText: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: max.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: string, trim, max.
 */
const optionalText = (max) => Joi.string().trim().max(max);
// Hàm trimmedString: Tạo quy tắc chuỗi chỉ loại bỏ khoảng trắng hai đầu khi Model không giới hạn độ dài.
/**
 * Hàm trimmedString: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: string, trim.
 */
const trimmedString = () => Joi.string().trim();
// Khai báo accessLevel nhận giá trị từ Joi.string().valid('free', 'premium', 'vip'). const giữ biến không gán lại; let cho phép cập nhật.
const accessLevel = Joi.string().valid('free', 'premium', 'vip');
// Khai báo category nhận giá trị từ Joi.string().valid('ebook', 'audiobook', 'comic', 'webn. const giữ biến không gán lại; let cho phép cập nhật.
const category = Joi.string().valid('ebook', 'audiobook', 'comic', 'webnovel');
// Khai báo genre nhận giá trị từ Joi.string().valid('van_hoc_viet_nam', 'truyen_ngan_vie. const giữ biến không gán lại; let cho phép cập nhật.
const genre = Joi.string().valid('van_hoc_viet_nam', 'truyen_ngan_viet_nam', 'tho_viet_nam', 'van_hoc_dan_gian', 'van_hoc_the_gioi', 'kinh_doanh', 'phat_trien_ban_than', 'tam_ly_hoc', 'lich_su', 'khoa_hoc');
// Khai báo page nhận giá trị từ Joi.number().integer().min(1).default(1). const giữ biến không gán lại; let cho phép cập nhật.
const page = Joi.number().integer().min(1).default(1);
// Khai báo limit nhận giá trị từ Joi.number().integer().min(1).max(50).default(20). const giữ biến không gán lại; let cho phép cập nhật.
const limit = Joi.number().integer().min(1).max(50).default(20);
// Accept the previous reader client's page size; the service still clamps results to MAX_LIMIT (50).
// Khai báo readingProgressLimit nhận giá trị từ Joi.number().integer().min(1).max(100).default(20). const giữ biến không gán lại; let cho phép cập nhật.
const readingProgressLimit = Joi.number().integer().min(1).max(100).default(20);
// Khai báo search nhận giá trị từ Joi.string().trim().max(100). const giữ biến không gán lại; let cho phép cập nhật.
const search = Joi.string().trim().max(100);
// Khai báo paginationQuery nhận giá trị từ { page, limit }. const giữ biến không gán lại; let cho phép cập nhật.
const paginationQuery = { page, limit };

// Hàm makeUpdateSchema: Tạo schema cập nhật chỉ nhận các trường được cho phép và bắt buộc có ít nhất một trường.
/**
 * Hàm makeUpdateSchema: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: fields.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: object, min.
 */
const makeUpdateSchema = (fields) => Joi.object(fields).min(1);

// Bộ kiểm tra tạo/cập nhật bám theo các trường Model; trường sở hữu, token và dữ liệu hệ thống không nhận từ client.
// Khai báo modelValidation nhận giá trị từ Object.freeze({ auth: authValidation, user: Object.free. const giữ biến không gán lại; let cho phép cập nhật.
export const modelValidation = Object.freeze({
    // Trường auth lưu authValidation làm giá trị trong object.
    auth: authValidation,
    // Trường user lưu Object.freeze({ create: Joi.object({ name: optionalText làm giá trị trong object.
    user: Object.freeze({
        // Trường create lưu Joi.object({ name: optionalText(100).required(), email: làm giá trị trong object.
        create: Joi.object({
            // Trường name lưu optionalText(100).required() làm giá trị trong object.
            name: optionalText(100).required(),
            // Trường email lưu Joi.string().email().max(254).lowercase().trim().requir làm giá trị trong object.
            email: Joi.string().email().max(254).lowercase().trim().required(),
            // Trường phone_number lưu optionalText(12).allow('', null) làm giá trị trong object.
            phone_number: optionalText(12).allow('', null),
            // Trường password lưu Joi.string().min(8).max(128).required() làm giá trị trong object.
            password: Joi.string().min(8).max(128).required()
        }).rename('full_name', 'name'),
        // Trường update lưu makeUpdateSchema({ name: optionalText(100), email: Joi. làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường name lưu optionalText(100) làm giá trị trong object.
            name: optionalText(100),
            // Trường email lưu Joi.string().email().max(254).lowercase().trim() làm giá trị trong object.
            email: Joi.string().email().max(254).lowercase().trim(),
            // Trường phone_number lưu optionalText(12).allow('', null) làm giá trị trong object.
            phone_number: optionalText(12).allow('', null),
            // Trường password lưu Joi.string().min(8).max(128) làm giá trị trong object.
            password: Joi.string().min(8).max(128),
            // Trường role lưu Joi.string().valid('ADMIN', 'USER') làm giá trị trong object.
            role: Joi.string().valid('ADMIN', 'USER')
        })
    }),
    // Trường tempUser lưu Object.freeze({ create: Joi.object({ email: Joi.string( làm giá trị trong object.
    tempUser: Object.freeze({
        // Trường create lưu Joi.object({ email: Joi.string().email().max(254).lower làm giá trị trong object.
        create: Joi.object({
            // Trường email lưu Joi.string().email().max(254).lowercase().trim().requir làm giá trị trong object.
            email: Joi.string().email().max(254).lowercase().trim().required(),
            // Trường password_hash lưu Joi.string().required() làm giá trị trong object.
            password_hash: Joi.string().required(),
            // Trường name lưu optionalText(100).required() làm giá trị trong object.
            name: optionalText(100).required(),
            // Trường phone_number lưu optionalText(12).required() làm giá trị trong object.
            phone_number: optionalText(12).required(),
            // Trường otp lưu Joi.string().pattern(/^\d{6}$/).required() làm giá trị trong object.
            otp: Joi.string().pattern(/^\d{6}$/).required(),
            // Trường otp_expires_at lưu Joi.date().iso().required() làm giá trị trong object.
            otp_expires_at: Joi.date().iso().required()
        }),
        // Trường update lưu makeUpdateSchema({ email: Joi.string().email().max(254) làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường email lưu Joi.string().email().max(254).lowercase().trim() làm giá trị trong object.
            email: Joi.string().email().max(254).lowercase().trim(),
            // Trường password_hash lưu Joi.string() làm giá trị trong object.
            password_hash: Joi.string(),
            // Trường name lưu optionalText(100) làm giá trị trong object.
            name: optionalText(100),
            // Trường phone_number lưu optionalText(12) làm giá trị trong object.
            phone_number: optionalText(12),
            // Trường otp lưu Joi.string().pattern(/^\d{6}$/) làm giá trị trong object.
            otp: Joi.string().pattern(/^\d{6}$/),
            // Trường otp_expires_at lưu Joi.date().iso() làm giá trị trong object.
            otp_expires_at: Joi.date().iso()
        })
    }),
    // Trường book lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    book: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, search, title: Joi.str làm giá trị trong object.
        list: Joi.object({
            ...paginationQuery,
            // Khóa search nhận biến cùng tên làm giá trị.
            search,
            // Trường title lưu Joi.string().trim().max(200) làm giá trị trong object.
            title: Joi.string().trim().max(200),
            // Trường author lưu Joi.string().trim().max(120) làm giá trị trong object.
            author: Joi.string().trim().max(120),
            // Khóa category nhận biến cùng tên làm giá trị.
            category,
            // Khóa genre nhận biến cùng tên làm giá trị.
            genre,
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.BOOK)) làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.BOOK)),
            // Trường year lưu Joi.number().integer().min(1).max(3000) làm giá trị trong object.
            year: Joi.number().integer().min(1).max(3000)
        }),
        // Trường create lưu Joi.object({ title: optionalText(200).required(), autho làm giá trị trong object.
        create: Joi.object({
            // Trường title lưu optionalText(200).required() làm giá trị trong object.
            title: optionalText(200).required(),
            // Trường author_name lưu optionalText(120).required() làm giá trị trong object.
            author_name: optionalText(120).required(),
            // Trường category lưu category.required() làm giá trị trong object.
            category: category.required(),
            // Khóa genre nhận biến cùng tên làm giá trị.
            genre,
            // Trường publication_year lưu Joi.number().integer().min(1).max(3000).allow(null) làm giá trị trong object.
            publication_year: Joi.number().integer().min(1).max(3000).allow(null),
            // Trường description lưu optionalText(5000).allow('') làm giá trị trong object.
            description: optionalText(5000).allow(''),
            // Trường cover_url lưu trimmedString().allow('') làm giá trị trong object.
            cover_url: trimmedString().allow(''),
            // Trường access_level lưu accessLevel.default('free') làm giá trị trong object.
            access_level: accessLevel.default('free'),
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.BOOK)).defau làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.BOOK)).default(STATUS.BOOK.PUBLISHED)
        }),
        // Trường update lưu makeUpdateSchema({ title: optionalText(200), author_nam làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường title lưu optionalText(200) làm giá trị trong object.
            title: optionalText(200),
            // Trường author_name lưu optionalText(120) làm giá trị trong object.
            author_name: optionalText(120),
            // Khóa category nhận biến cùng tên làm giá trị.
            category,
            // Khóa genre nhận biến cùng tên làm giá trị.
            genre,
            // Trường publication_year lưu Joi.number().integer().min(1).max(3000).allow(null) làm giá trị trong object.
            publication_year: Joi.number().integer().min(1).max(3000).allow(null),
            // Trường description lưu optionalText(5000).allow('') làm giá trị trong object.
            description: optionalText(5000).allow(''),
            // Trường cover_url lưu trimmedString().allow('') làm giá trị trong object.
            cover_url: trimmedString().allow(''),
            // Trường access_level lưu accessLevel làm giá trị trong object.
            access_level: accessLevel,
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.BOOK)) làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.BOOK))
        })
    }),
    // Trường chapter lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    chapter: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, search, book_id: objec làm giá trị trong object.
        list: Joi.object({
            ...paginationQuery,
            // Khóa search nhận biến cùng tên làm giá trị.
            search,
            // Trường book_id lưu objectId làm giá trị trong object.
            book_id: objectId,
            // Trường access_level lưu accessLevel làm giá trị trong object.
            access_level: accessLevel
        }),
        // Trường create lưu Joi.object({ book_id: objectId.required(), title: optio làm giá trị trong object.
        create: Joi.object({
            // Trường book_id lưu objectId.required() làm giá trị trong object.
            book_id: objectId.required(),
            // Trường title lưu optionalText(200).required() làm giá trị trong object.
            title: optionalText(200).required(),
            // Trường content lưu Joi.string().max(200000).allow('') làm giá trị trong object.
            content: Joi.string().max(200000).allow(''),
            // Trường chapter_number lưu Joi.number().integer().min(1).required() làm giá trị trong object.
            chapter_number: Joi.number().integer().min(1).required(),
            // Trường access_level lưu accessLevel.default('free') làm giá trị trong object.
            access_level: accessLevel.default('free'),
            // Trường published_at lưu Joi.date().iso() làm giá trị trong object.
            published_at: Joi.date().iso()
        }),
        // Trường update lưu makeUpdateSchema({ title: optionalText(200), content: J làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường title lưu optionalText(200) làm giá trị trong object.
            title: optionalText(200),
            // Trường content lưu Joi.string().max(200000).allow('') làm giá trị trong object.
            content: Joi.string().max(200000).allow(''),
            // Trường chapter_number lưu Joi.number().integer().min(1) làm giá trị trong object.
            chapter_number: Joi.number().integer().min(1),
            // Trường access_level lưu accessLevel làm giá trị trong object.
            access_level: accessLevel,
            // Trường published_at lưu Joi.date().iso() làm giá trị trong object.
            published_at: Joi.date().iso()
        })
    }),
    // Trường chapterCatalog lưu Joi.object({ ...paginationQuery }) làm giá trị trong object.
    chapterCatalog: Joi.object({
        ...paginationQuery
    }),
    // Trường comment lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    comment: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, search }) làm giá trị trong object.
        list: Joi.object({ ...paginationQuery, search }),
        // Trường create lưu Joi.object({ body: optionalText(3000).required(), ratin làm giá trị trong object.
        create: Joi.object({
            // Trường body lưu optionalText(3000).required() làm giá trị trong object.
            body: optionalText(3000).required(),
            // Trường rating lưu Joi.number().integer().min(1).max(5).allow(null) làm giá trị trong object.
            rating: Joi.number().integer().min(1).max(5).allow(null)
        }),
        // Trường update lưu makeUpdateSchema({ body: optionalText(3000), rating: Jo làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường body lưu optionalText(3000) làm giá trị trong object.
            body: optionalText(3000),
            // Trường rating lưu Joi.number().integer().min(1).max(5).allow(null) làm giá trị trong object.
            rating: Joi.number().integer().min(1).max(5).allow(null)
        })
    }),
    // Trường report lưu Object.freeze({ create: Joi.object({ email: Joi.string( làm giá trị trong object.
    report: Object.freeze({
        // Trường create lưu Joi.object({ email: Joi.string().email().max(254).lower làm giá trị trong object.
        create: Joi.object({
            // Trường email lưu Joi.string().email().max(254).lowercase().trim().when(' làm giá trị trong object.
            email: Joi.string().email().max(254).lowercase().trim().when('$authenticated', {
                // Trường is lưu true làm giá trị trong object.
                is: true,
                // Trường then lưu Joi.optional() làm giá trị trong object.
                then: Joi.optional(),
                // Trường otherwise lưu Joi.required() làm giá trị trong object.
                otherwise: Joi.required()
            }),
            // Trường subject lưu optionalText(200).pattern(/^[^\r\n]+$/).required() làm giá trị trong object.
            subject: optionalText(200).pattern(/^[^\r\n]+$/).required(),
            // Trường message lưu optionalText(5000).required() làm giá trị trong object.
            message: optionalText(5000).required(),
            // Trường type lưu Joi.string().valid('contact', 'bug').default('contact') làm giá trị trong object.
            type: Joi.string().valid('contact', 'bug').default('contact')
        }),
        // Trường update lưu makeUpdateSchema({ status: Joi.string().valid(...Object làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.REPORT)) làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.REPORT))
        })
    }),
    // Trường subscription lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    subscription: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, status: Joi.string().v làm giá trị trong object.
        list: Joi.object({
            ...paginationQuery,
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION)),
            // Trường plan lưu Joi.string().valid('vip_monthly', 'premium_monthly') làm giá trị trong object.
            plan: Joi.string().valid('vip_monthly', 'premium_monthly'),
            // Trường user lưu objectId làm giá trị trong object.
            user: objectId
        }),
        // Trường create lưu Joi.object({ plan: Joi.string().valid('vip_monthly', 'p làm giá trị trong object.
        create: Joi.object({
            // Trường plan lưu Joi.string().valid('vip_monthly', 'premium_monthly').de làm giá trị trong object.
            plan: Joi.string().valid('vip_monthly', 'premium_monthly').default('premium_monthly'),
            // Trường payment_reference lưu optionalText(120).allow('', null) làm giá trị trong object.
            payment_reference: optionalText(120).allow('', null)
        }),
        // Trường update lưu makeUpdateSchema({ payment_reference: optionalText(120) làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường payment_reference lưu optionalText(120).allow('', null) làm giá trị trong object.
            payment_reference: optionalText(120).allow('', null)
        }),
        // Trường review lưu makeUpdateSchema({ status: Joi.string().valid(...Object làm giá trị trong object.
        review: makeUpdateSchema({
            // Trường status lưu Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION làm giá trị trong object.
            status: Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION))
        })
    }),
    // Trường bookmark lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    bookmark: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, book: objectId }) làm giá trị trong object.
        list: Joi.object({ ...paginationQuery, book: objectId }),
        // Trường create lưu Joi.object({ book: objectId.required(), chapter: object làm giá trị trong object.
        create: Joi.object({
            // Trường book lưu objectId.required() làm giá trị trong object.
            book: objectId.required(),
            // Trường chapter lưu objectId.required() làm giá trị trong object.
            chapter: objectId.required()
        }),
        // Trường update lưu makeUpdateSchema({ book: objectId, chapter: objectId }) làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường book lưu objectId làm giá trị trong object.
            book: objectId,
            // Trường chapter lưu objectId làm giá trị trong object.
            chapter: objectId
        })
    }),
    // Trường readingProgress lưu Object.freeze({ list: Joi.object({ ...paginationQuery,  làm giá trị trong object.
    readingProgress: Object.freeze({
        // Trường list lưu Joi.object({ ...paginationQuery, limit: readingProgress làm giá trị trong object.
        list: Joi.object({ ...paginationQuery, limit: readingProgressLimit, book: objectId, search }),
        // Trường create lưu Joi.object({ book: objectId.required(), }) làm giá trị trong object.
        create: Joi.object({
            // Trường book lưu objectId.required() làm giá trị trong object.
            book: objectId.required(),
        }),
        // Trường update lưu makeUpdateSchema({ chapters_since_ad: Joi.number().vali làm giá trị trong object.
        update: makeUpdateSchema({
            // Trường chapters_since_ad lưu Joi.number().valid(0) làm giá trị trong object.
            chapters_since_ad: Joi.number().valid(0),
            // Trường total_chapter_reads lưu Joi.number().valid(0) làm giá trị trong object.
            total_chapter_reads: Joi.number().valid(0)
        })
    }),
    // Trường vipGrant lưu Joi.object({ vip_expires_at: Joi.date().iso().greater(' làm giá trị trong object.
    vipGrant: Joi.object({
        // Trường vip_expires_at lưu Joi.date().iso().greater('now').required() làm giá trị trong object.
        vip_expires_at: Joi.date().iso().greater('now').required()
    }),
    // Trường premiumGrant lưu Joi.object({ premium_expires_at: Joi.date().iso().great làm giá trị trong object.
    premiumGrant: Joi.object({
        // Trường premium_expires_at lưu Joi.date().iso().greater('now').required() làm giá trị trong object.
        premium_expires_at: Joi.date().iso().greater('now').required()
    }),
    // Trường userList lưu Joi.object({ ...paginationQuery, search, role: Joi.stri làm giá trị trong object.
    userList: Joi.object({
        ...paginationQuery,
        // Khóa search nhận biến cùng tên làm giá trị.
        search,
        // Trường role lưu Joi.string().valid('ADMIN', 'USER') làm giá trị trong object.
        role: Joi.string().valid('ADMIN', 'USER')
    }),
    // Trường reportList lưu Joi.object({ ...paginationQuery, search, status: Joi.st làm giá trị trong object.
    reportList: Joi.object({
        ...paginationQuery,
        // Khóa search nhận biến cùng tên làm giá trị.
        search,
        // Trường status lưu Joi.string().valid(...Object.values(STATUS.REPORT)) làm giá trị trong object.
        status: Joi.string().valid(...Object.values(STATUS.REPORT))
    }),
    // Trường params lưu Object.freeze({ book: Joi.object({ bookId: objectId.req làm giá trị trong object.
    params: Object.freeze({
        // Trường book lưu Joi.object({ bookId: objectId.required() }) làm giá trị trong object.
        book: Joi.object({ bookId: objectId.required() }),
        // Trường bookChapter lưu Joi.object({ bookId: objectId.required(), chapterId: ob làm giá trị trong object.
        bookChapter: Joi.object({
            // Trường bookId lưu objectId.required() làm giá trị trong object.
            bookId: objectId.required(),
            // Trường chapterId lưu objectId.required() làm giá trị trong object.
            chapterId: objectId.required()
        }),
        // Trường bookIdentifier lưu Joi.object({ bookId: Joi.alternatives().try( objectId,  làm giá trị trong object.
        bookIdentifier: Joi.object({
            // Trường bookId lưu Joi.alternatives().try( objectId, Joi.string().pattern( làm giá trị trong object.
            bookId: Joi.alternatives().try(
                objectId,
                Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            ).required()
        }),
        // Trường chapter lưu Joi.object({ chapterId: objectId.required() }) làm giá trị trong object.
        chapter: Joi.object({ chapterId: objectId.required() }),
        // Trường chapterIdentifier lưu Joi.object({ chapterId: Joi.alternatives().try( objectI làm giá trị trong object.
        chapterIdentifier: Joi.object({
            // Trường chapterId lưu Joi.alternatives().try( objectId, Joi.string().pattern( làm giá trị trong object.
            chapterId: Joi.alternatives().try(
                objectId,
                Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            ).required()
        }),
        // Trường user lưu Joi.object({ userId: objectId.required() }) làm giá trị trong object.
        user: Joi.object({ userId: objectId.required() }),
        // Trường subscription lưu Joi.object({ subscriptionId: objectId.required() }) làm giá trị trong object.
        subscription: Joi.object({ subscriptionId: objectId.required() }),
        // Trường report lưu Joi.object({ reportId: objectId.required() }) làm giá trị trong object.
        report: Joi.object({ reportId: objectId.required() }),
        // Trường comment lưu Joi.object({ commentId: objectId.required() }) làm giá trị trong object.
        comment: Joi.object({ commentId: objectId.required() }),
        // Trường bookmark lưu Joi.object({ bookmarkId: objectId.required() }) làm giá trị trong object.
        bookmark: Joi.object({ bookmarkId: objectId.required() }),
        // Trường progress lưu Joi.object({ progressId: objectId.required() }) làm giá trị trong object.
        progress: Joi.object({ progressId: objectId.required() })
    })
});

// Khai báo createBookSchema nhận giá trị từ modelValidation.book.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createBookSchema = modelValidation.book.create;
// Khai báo updateBookSchema nhận giá trị từ modelValidation.book.update. const giữ biến không gán lại; let cho phép cập nhật.
export const updateBookSchema = modelValidation.book.update;
// Khai báo bookListSchema nhận giá trị từ modelValidation.book.list. const giữ biến không gán lại; let cho phép cập nhật.
export const bookListSchema = modelValidation.book.list;
// Khai báo createChapterSchema nhận giá trị từ modelValidation.chapter.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createChapterSchema = modelValidation.chapter.create;
// Khai báo updateChapterSchema nhận giá trị từ modelValidation.chapter.update. const giữ biến không gán lại; let cho phép cập nhật.
export const updateChapterSchema = modelValidation.chapter.update;
// Khai báo chapterListSchema nhận giá trị từ modelValidation.chapter.list. const giữ biến không gán lại; let cho phép cập nhật.
export const chapterListSchema = modelValidation.chapter.list;
// Khai báo createSubscriptionSchema nhận giá trị từ modelValidation.subscription.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createSubscriptionSchema = modelValidation.subscription.create;
// Khai báo subscriptionListSchema nhận giá trị từ modelValidation.subscription.list. const giữ biến không gán lại; let cho phép cập nhật.
export const subscriptionListSchema = modelValidation.subscription.list;
// Khai báo createCommentSchema nhận giá trị từ modelValidation.comment.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createCommentSchema = modelValidation.comment.create;
// Khai báo updateCommentSchema nhận giá trị từ modelValidation.comment.update. const giữ biến không gán lại; let cho phép cập nhật.
export const updateCommentSchema = modelValidation.comment.update;
// Khai báo commentListSchema nhận giá trị từ modelValidation.comment.list. const giữ biến không gán lại; let cho phép cập nhật.
export const commentListSchema = modelValidation.comment.list;
// Khai báo createBookmarkSchema nhận giá trị từ modelValidation.bookmark.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createBookmarkSchema = modelValidation.bookmark.create;
// Khai báo updateBookmarkSchema nhận giá trị từ modelValidation.bookmark.update. const giữ biến không gán lại; let cho phép cập nhật.
export const updateBookmarkSchema = modelValidation.bookmark.update;
// Khai báo bookmarkListSchema nhận giá trị từ modelValidation.bookmark.list. const giữ biến không gán lại; let cho phép cập nhật.
export const bookmarkListSchema = modelValidation.bookmark.list;
// Khai báo createReadingProgressSchema nhận giá trị từ modelValidation.readingProgress.create. const giữ biến không gán lại; let cho phép cập nhật.
export const createReadingProgressSchema = modelValidation.readingProgress.create;
// Khai báo updateReadingProgressSchema nhận giá trị từ modelValidation.readingProgress.update. const giữ biến không gán lại; let cho phép cập nhật.
export const updateReadingProgressSchema = modelValidation.readingProgress.update;
// Khai báo readingProgressListSchema nhận giá trị từ modelValidation.readingProgress.list. const giữ biến không gán lại; let cho phép cập nhật.
export const readingProgressListSchema = modelValidation.readingProgress.list;
