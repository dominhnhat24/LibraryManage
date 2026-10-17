import Joi from 'joi';
import { STATUS } from '../constants/status.constant.js';
import { authValidation } from './auth.validation.js';

const objectId = Joi.string().hex().length(24);
// Hàm optionalText: Tạo quy tắc chuỗi đã cắt khoảng trắng và giới hạn độ dài tối đa theo Model.
const optionalText = (max) => Joi.string().trim().max(max);
// Hàm trimmedString: Tạo quy tắc chuỗi chỉ loại bỏ khoảng trắng hai đầu khi Model không giới hạn độ dài.
const trimmedString = () => Joi.string().trim();
const accessLevel = Joi.string().valid('free', 'premium', 'vip');
const category = Joi.string().valid('ebook', 'audiobook', 'comic', 'webnovel');
const page = Joi.number().integer().min(1).default(1);
const limit = Joi.number().integer().min(1).max(50).default(20);
const search = Joi.string().trim().max(100);
const paginationQuery = { page, limit };

// Hàm makeUpdateSchema: Tạo schema cập nhật chỉ nhận các trường được cho phép và bắt buộc có ít nhất một trường.
const makeUpdateSchema = (fields) => Joi.object(fields).min(1);

// Bộ kiểm tra tạo/cập nhật bám theo các trường Model; trường sở hữu, token và dữ liệu hệ thống không nhận từ client.
export const modelValidation = Object.freeze({
    auth: authValidation,
    user: Object.freeze({
        create: Joi.object({
            name: optionalText(100).required(),
            email: Joi.string().email().max(254).lowercase().trim().required(),
            phone_number: optionalText(12).allow('', null),
            password: Joi.string().min(8).max(128).required()
        }).rename('full_name', 'name'),
        update: makeUpdateSchema({
            name: optionalText(100),
            email: Joi.string().email().max(254).lowercase().trim(),
            phone_number: optionalText(12).allow('', null),
            password: Joi.string().min(8).max(128),
            role: Joi.string().valid('ADMIN', 'USER')
        })
    }),
    tempUser: Object.freeze({
        create: Joi.object({
            email: Joi.string().email().max(254).lowercase().trim().required(),
            password_hash: Joi.string().required(),
            name: optionalText(100).required(),
            phone_number: optionalText(12).required(),
            otp: Joi.string().pattern(/^\d{6}$/).required(),
            otp_expires_at: Joi.date().iso().required()
        }),
        update: makeUpdateSchema({
            email: Joi.string().email().max(254).lowercase().trim(),
            password_hash: Joi.string(),
            name: optionalText(100),
            phone_number: optionalText(12),
            otp: Joi.string().pattern(/^\d{6}$/),
            otp_expires_at: Joi.date().iso()
        })
    }),
    book: Object.freeze({
        list: Joi.object({
            ...paginationQuery,
            search,
            title: Joi.string().trim().max(200),
            author: Joi.string().trim().max(120),
            category,
            status: Joi.string().valid(...Object.values(STATUS.BOOK)),
            year: Joi.number().integer().min(1).max(3000)
        }),
        create: Joi.object({
            title: optionalText(200).required(),
            author_name: optionalText(120).required(),
            category: category.required(),
            publication_year: Joi.number().integer().min(1).max(3000).allow(null),
            description: optionalText(5000).allow(''),
            cover_url: trimmedString().allow(''),
            access_level: accessLevel.default('free'),
            status: Joi.string().valid(...Object.values(STATUS.BOOK)).default(STATUS.BOOK.PUBLISHED)
        }),
        update: makeUpdateSchema({
            title: optionalText(200),
            author_name: optionalText(120),
            category,
            publication_year: Joi.number().integer().min(1).max(3000).allow(null),
            description: optionalText(5000).allow(''),
            cover_url: trimmedString().allow(''),
            access_level: accessLevel,
            status: Joi.string().valid(...Object.values(STATUS.BOOK))
        })
    }),
    chapter: Object.freeze({
        list: Joi.object({
            ...paginationQuery,
            search,
            book_id: objectId,
            access_level: accessLevel
        }),
        create: Joi.object({
            book_id: objectId.required(),
            title: optionalText(200).required(),
            content: Joi.string().max(200000).allow(''),
            chapter_number: Joi.number().integer().min(1).required(),
            access_level: accessLevel.default('free'),
            published_at: Joi.date().iso()
        }),
        update: makeUpdateSchema({
            title: optionalText(200),
            content: Joi.string().max(200000).allow(''),
            chapter_number: Joi.number().integer().min(1),
            access_level: accessLevel,
            published_at: Joi.date().iso()
        })
    }),
    chapterCatalog: Joi.object({
        ...paginationQuery
    }),
    comment: Object.freeze({
        list: Joi.object({ ...paginationQuery, search }),
        create: Joi.object({
            body: optionalText(3000).required(),
            rating: Joi.number().integer().min(1).max(5).allow(null)
        }),
        update: makeUpdateSchema({
            body: optionalText(3000),
            rating: Joi.number().integer().min(1).max(5).allow(null)
        })
    }),
    report: Object.freeze({
        create: Joi.object({
            email: Joi.string().email().max(254).lowercase().trim().when('$authenticated', {
                is: true,
                then: Joi.optional(),
                otherwise: Joi.required()
            }),
            subject: optionalText(200).pattern(/^[^\r\n]+$/).required(),
            message: optionalText(5000).required(),
            type: Joi.string().valid('contact', 'bug').default('contact')
        }),
        update: makeUpdateSchema({
            status: Joi.string().valid(...Object.values(STATUS.REPORT))
        })
    }),
    subscription: Object.freeze({
        list: Joi.object({
            ...paginationQuery,
            status: Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION)),
            plan: Joi.string().valid('vip_monthly', 'premium_monthly'),
            user: objectId
        }),
        create: Joi.object({
            plan: Joi.string().valid('vip_monthly', 'premium_monthly').default('premium_monthly'),
            payment_reference: optionalText(120).allow('', null)
        }),
        update: makeUpdateSchema({
            payment_reference: optionalText(120).allow('', null)
        }),
        review: makeUpdateSchema({
            status: Joi.string().valid(...Object.values(STATUS.SUBSCRIPTION))
        })
    }),
    bookmark: Object.freeze({
        list: Joi.object({ ...paginationQuery, book: objectId }),
        create: Joi.object({
            book: objectId.required(),
            chapter: objectId.required()
        }),
        update: makeUpdateSchema({
            book: objectId,
            chapter: objectId
        })
    }),
    readingProgress: Object.freeze({
        list: Joi.object({ ...paginationQuery, book: objectId }),
        create: Joi.object({
            book: objectId.required(),
            chapters_since_ad: Joi.number().integer().min(0).max(2).default(0),
            total_chapter_reads: Joi.number().integer().min(0).default(0)
        }),
        update: makeUpdateSchema({
            chapters_since_ad: Joi.number().integer().min(0).max(2),
            total_chapter_reads: Joi.number().integer().min(0)
        })
    }),
    vipGrant: Joi.object({
        vip_expires_at: Joi.date().iso().greater('now').required()
    }),
    userList: Joi.object({
        ...paginationQuery,
        search,
        role: Joi.string().valid('ADMIN', 'USER')
    }),
    reportList: Joi.object({
        ...paginationQuery,
        search,
        status: Joi.string().valid(...Object.values(STATUS.REPORT))
    }),
    params: Object.freeze({
        book: Joi.object({ bookId: objectId.required() }),
        bookChapter: Joi.object({
            bookId: objectId.required(),
            chapterId: objectId.required()
        }),
        bookIdentifier: Joi.object({
            bookId: Joi.alternatives().try(
                objectId,
                Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            ).required()
        }),
        chapter: Joi.object({ chapterId: objectId.required() }),
        chapterIdentifier: Joi.object({
            chapterId: Joi.alternatives().try(
                objectId,
                Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            ).required()
        }),
        user: Joi.object({ userId: objectId.required() }),
        subscription: Joi.object({ subscriptionId: objectId.required() }),
        report: Joi.object({ reportId: objectId.required() }),
        comment: Joi.object({ commentId: objectId.required() }),
        bookmark: Joi.object({ bookmarkId: objectId.required() }),
        progress: Joi.object({ progressId: objectId.required() })
    })
});

export const createBookSchema = modelValidation.book.create;
export const updateBookSchema = modelValidation.book.update;
export const bookListSchema = modelValidation.book.list;
export const createChapterSchema = modelValidation.chapter.create;
export const updateChapterSchema = modelValidation.chapter.update;
export const chapterListSchema = modelValidation.chapter.list;
export const createSubscriptionSchema = modelValidation.subscription.create;
export const subscriptionListSchema = modelValidation.subscription.list;
export const createCommentSchema = modelValidation.comment.create;
export const updateCommentSchema = modelValidation.comment.update;
export const commentListSchema = modelValidation.comment.list;
export const createBookmarkSchema = modelValidation.bookmark.create;
export const updateBookmarkSchema = modelValidation.bookmark.update;
export const bookmarkListSchema = modelValidation.bookmark.list;
export const createReadingProgressSchema = modelValidation.readingProgress.create;
export const updateReadingProgressSchema = modelValidation.readingProgress.update;
export const readingProgressListSchema = modelValidation.readingProgress.list;
