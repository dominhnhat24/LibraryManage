// [KIỂM THỬ MODEL] Xác minh role, hạn thuê bao và schema nội dung số mà không cần MongoDB.
import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/user.model.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import Subscription from '../src/models/subscription.model.js';
import ReadingProgress from '../src/models/reading-progress.model.js';
import ReadingEvent from '../src/models/reading-event.model.js';
import { ADS_CHAPTER_INTERVAL, shouldShowAd } from '../src/middlewares/ads.middleware.js';
import { ROLES } from '../src/constants/roles.constant.js';
import { checkDownloadPermission, requireAdmin } from '../src/middlewares/role.middleware.js';
import { loadAccessibleBook, loadReadableBook } from '../src/controllers/book.controller.js';
import { getReadableChapterMetadata } from '../src/controllers/chapter.controller.js';
import { resolveBookReaderMode } from '../src/utils/book-reader-mode.js';
import { completeChapter, getAllReadingProgress, recordReadingOpen } from '../src/services/reading-progress.service.js';

// [QUYỀN PREMIUM/VIP] Bao phủ tài khoản Free, Premium còn/hết hạn, VIP còn/hết hạn và admin.
test('user model limits authorization roles and computes Premium/VIP from independent entitlements', () => {
    const now = new Date('2026-10-01T00:00:00.000Z');
    const free = new User({ role: ROLES.USER });
    const premium = new User({
        role: ROLES.USER, is_premium: true, premium_expires_at: new Date('2026-10-02T00:00:00.000Z')
    });
    const expiredPremium = new User({
        role: ROLES.USER, is_premium: true, premium_expires_at: new Date('2026-09-30T00:00:00.000Z')
    });
    const vip = new User({
        role: ROLES.USER, is_vip: true, vip_expires_at: new Date('2026-10-02T00:00:00.000Z')
    });
    const expiredVip = new User({
        role: ROLES.USER, is_vip: true, vip_expires_at: new Date('2026-09-30T00:00:00.000Z')
    });
    const admin = new User({ role: ROLES.ADMIN });

    assert.deepEqual(User.schema.path('role').enumValues, ['ADMIN', 'USER']);
    assert.equal(User.schema.path('email_verified').defaultValue, true);
    assert.equal(User.schema.path('email_otp_hash').options.select, false);
    assert.equal(User.schema.path('email_otp_expires_at').options.select, false);
    assert.equal(free.hasActivePremium(now), false);
    assert.equal(free.hasActiveVip(now), false);
    assert.equal(premium.hasActivePremium(now), true);
    assert.equal(premium.hasActiveVip(now), true);
    assert.equal(expiredPremium.hasActivePremium(now), false);
    assert.equal(vip.hasActivePremium(now), false);
    assert.equal(vip.hasActiveVip(now), true);
    assert.equal(expiredVip.hasActivePremium(now), false);
    assert.equal(expiredVip.toPublicJSON().role, ROLES.USER);
    assert.equal(expiredVip.toPublicJSON().is_vip, false);
    assert.equal(admin.hasActivePremium(now), true);
    assert.equal(admin.hasActiveVip(now), true);
});

// Kiểm thử phân quyền: Xác nhận USER bị chặn và chỉ ADMIN được đi qua middleware quản trị.
test('requireAdmin permits only the ADMIN role', () => {
    let denied;
    requireAdmin({ authUser: { role: ROLES.USER } }, {}, (error) => { denied = error; });
    assert.equal(denied?.statusCode, 403);

    let allowed = false;
    requireAdmin({ authUser: { role: ROLES.ADMIN } }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
});

test('private book downloads require active Premium or ADMIN entitlement', () => {
    const vipOnly = { hasActivePremium: () => false, hasActiveVip: () => true };
    let rejection;
    checkDownloadPermission({ authUser: vipOnly }, {}, (error) => { rejection = error; });
    assert.equal(rejection?.statusCode, 403);

    let allowed = false;
    checkDownloadPermission({ authUser: { hasActivePremium: () => true } }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
});

// [SCHEMA SÁCH] Danh mục giới hạn theo sản phẩm và khóa tệp bị ẩn khỏi truy vấn thông thường.
test('book schema validates digital categories and protects storage keys', async () => {
    const allowedCategories = Book.schema.path('category').enumValues;
    assert.ok(['ebook', 'audiobook', 'comic', 'webnovel'].every((category) => allowedCategories.includes(category)));
    assert.equal(Book.schema.path('slug').options.unique, true);
    assert.equal(Book.schema.path('file_key').options.select, false);
    assert.equal(Book.schema.path('file_url'), undefined);
    const book = new Book({
        title: 'OpenBook test',
        author_name: 'Test Author',
        category: 'not-a-category',
        owner: '507f1f77bcf86cd799439011'
    });
    await assert.rejects(book.validate(), (error) => Boolean(error.errors.category));
});

// Kiểm thử stream PDF: Truy vấn sách phải chủ động chọn file_key dù schema ẩn trường này theo mặc định.
test('accessible book query selects the private file key required by the PDF stream', async () => {
    const originalFindOne = Book.findOne;
    const expectedBook = { _id: 'book-id', access_level: 'free', file_key: 'private.pdf' };
    let selectedFields;
    Book.findOne = () => ({
        select(fields) {
            selectedFields = fields;
            return Promise.resolve(expectedBook);
        }
    });

    const req = {
        params: { bookId: 'book-id' },
        authUser: { hasActivePremium: () => false, hasActiveVip: () => false }
    };

    try {
        await new Promise((resolve, reject) => {
            loadAccessibleBook(req, {}, (error) => error ? reject(error) : resolve());
        });
        assert.equal(selectedFields, '+file_key');
        assert.equal(req.book.file_key, 'private.pdf');
    } finally {
        Book.findOne = originalFindOne;
    }
});

test('public reading permits guest Free content and denies guest or VIP-only Premium access', async () => {
    const originalBookFind = Book.findOne;
    const originalChapterFind = Chapter.findOne;
    const freeBook = { _id: 'book-id', access_level: 'free' };
    const premiumBook = { _id: 'book-id', access_level: 'premium' };
    const freeChapter = { _id: 'chapter-id', access_level: 'free' };
    const premiumChapter = { _id: 'chapter-id', access_level: 'premium' };
    let activeBook = freeBook;
    let activeChapter = freeChapter;
    Book.findOne = () => ({ select: async () => activeBook });
    Chapter.findOne = async () => activeChapter;
    try {
        let freeError;
        const freeReq = { params: { bookId: 'book-id', chapterId: 'chapter-id' } };
        await new Promise((resolve) => loadReadableBook(freeReq, {}, (error) => { freeError = error; resolve(); }));
        assert.equal(freeError, undefined);
        assert.equal(freeReq.chapter, freeChapter);

        activeChapter = premiumChapter;
        let chapterError;
        await new Promise((resolve) => loadReadableBook({ params: { bookId: 'book-id', chapterId: 'chapter-id' } }, {}, (error) => { chapterError = error; resolve(); }));
        assert.equal(chapterError?.statusCode, 403);

        activeBook = premiumBook;
        activeChapter = freeChapter;
        let bookError;
        await new Promise((resolve) => loadAccessibleBook({ params: { bookId: 'book-id' } }, {}, (error) => { bookError = error; resolve(); }));
        assert.equal(bookError?.statusCode, 403);

        activeBook = { _id: 'book-id', access_level: 'premium' };
        let vipError;
        const vipUser = { hasActiveVip: () => true, hasActivePremium: () => false };
        await new Promise((resolve) => loadAccessibleBook({ params: { bookId: 'book-id' }, authUser: vipUser }, {}, (error) => { vipError = error; resolve(); }));
        assert.equal(vipError?.statusCode, 403);
    } finally {
        Book.findOne = originalBookFind;
        Chapter.findOne = originalChapterFind;
    }
});

test('direct readable chapter lookup restores a chapter outside the first catalog page without returning its content', async () => {
    const originalBookFind = Book.findOne;
    const originalChapterFind = Chapter.findOne;
    const expectedBook = { _id: 'book-id', access_level: 'free' };
    const expectedChapter = {
        _id: 'chapter-75', book_id: 'book-id', title: 'Chapter 75', chapter_number: 75,
        access_level: 'free', content: '<p>Private chapter text</p>'
    };
    let chapterQuery;
    Book.findOne = () => ({ select: async () => expectedBook });
    Chapter.findOne = async (query) => { chapterQuery = query; return expectedChapter; };
    const req = { params: { bookId: 'book-id', chapterId: 'chapter-75' } };
    try {
        await new Promise((resolve, reject) => loadReadableBook(req, {}, (error) => error ? reject(error) : resolve()));
        let response;
        await getReadableChapterMetadata(req, { json: (value) => { response = value; return value; } }, (error) => { throw error; });
        assert.deepEqual(chapterQuery, { _id: 'chapter-75', book_id: expectedBook._id });
        assert.equal(response.data.chapter_number, 75);
        assert.equal(response.data.content, undefined);
    } finally {
        Book.findOne = originalBookFind;
        Chapter.findOne = originalChapterFind;
    }
});

test('reading history uses real page boundaries for empty, single, 10, 11, and over-20 records', async () => {
    const originalFind = ReadingProgress.find;
    const originalCount = ReadingProgress.countDocuments;
    const originalEventFindOne = ReadingEvent.findOne;
    let recordCount = 0;
    let requestedOffset = 0;
    let requestedLimit = 0;
    let progressQuery;
    ReadingProgress.find = (query) => {
        progressQuery = query;
        return ({
        populate() { return this; },
        sort() { return this; },
        skip(value) { requestedOffset = value; return this; },
        limit(value) { requestedLimit = value; return this; },
        lean() {
            return Promise.resolve(Array.from({ length: recordCount }, (_, index) => ({
                _id: `progress-${index + 1}`, updatedAt: new Date(index),
                book: { _id: `book-${index + 1}`, title: `Book ${index + 1}` }
            })).slice(requestedOffset, requestedOffset + requestedLimit));
        }
        });
    };
    ReadingProgress.countDocuments = async () => recordCount;
    ReadingEvent.findOne = () => ({
        sort() { return this; }, populate() { return this; }, lean: async () => null
    });
    try {
        for (const [total, expectedPages, expectedLastPageRows] of [
            [0, 0, 0], [1, 1, 1], [10, 1, 10], [11, 2, 1], [25, 3, 5]
        ]) {
            recordCount = total;
            const firstPage = await getAllReadingProgress('user-1', { page: 1, limit: 10 });
            assert.equal(progressQuery.user, 'user-1');
            assert.equal(firstPage.progress.length, Math.min(total, 10), `first page size for ${total}`);
            assert.equal(firstPage.pagination.total, total);
            assert.equal(firstPage.pagination.totalPages, expectedPages);
            if (expectedPages) {
                const lastPage = await getAllReadingProgress('user-1', { page: expectedPages, limit: 10 });
                assert.equal(lastPage.progress.length, expectedLastPageRows, `last page size for ${total}`);
                assert.equal(lastPage.pagination.page, expectedPages);
            }
        }
        recordCount = 25;
        const legacyLargePage = await getAllReadingProgress('user-1', { page: 1, limit: 100 });
        assert.equal(requestedLimit, 50);
        assert.equal(legacyLargePage.progress.length, 25);
        assert.equal(legacyLargePage.pagination.limit, 50);
    } finally {
        ReadingProgress.find = originalFind;
        ReadingProgress.countDocuments = originalCount;
        ReadingEvent.findOne = originalEventFindOne;
    }
});

test('book reader mode follows readable chapter content and stored source metadata', () => {
    assert.equal(resolveBookReaderMode({ file_format: 'PDF', file_key: 'source.pdf', hasReadableChapters: true }), 'chapters');
    assert.equal(resolveBookReaderMode({ file_format: 'PDF', file_key: 'source.pdf', hasReadableChapters: false }), 'pdf');
    assert.equal(resolveBookReaderMode({ file_format: 'EPUB', file_key: 'source.epub', hasReadableChapters: false }), 'unsupported');
    assert.equal(resolveBookReaderMode({ file_format: 'TXT', file_key: null, hasReadableChapters: false }), 'unavailable');
});

test('chapter completion increments progress once and retries do not count twice', async () => {
    const originalFindOneAndUpdate = ReadingProgress.findOneAndUpdate;
    const originalFindOne = ReadingProgress.findOne;
    const originalCreate = ReadingProgress.create;
    const originalEventCreate = ReadingEvent.create;
    let updateFilter;
    let updatePipeline;
    let eventCount = 0;
    ReadingProgress.findOneAndUpdate = async (filter, pipeline) => {
        updateFilter = filter;
        updatePipeline = pipeline;
        return { completed_chapter_count: 1, completed_chapters_since_ad: 1 };
    };
    ReadingProgress.findOne = async () => null;
    ReadingProgress.create = async () => { throw new Error('Unexpected create'); };
    ReadingEvent.create = async () => { eventCount += 1; return {}; };
    try {
        const result = await completeChapter('user-1', 'book-1', 'chapter-1');
        assert.equal(result.newly_completed, true);
        assert.equal(result.completed_chapter_count, 1);
        assert.equal(result.ad_eligibility_due, false);
        assert.deepEqual(updateFilter.completed_chapter_ids, { $ne: 'chapter-1' });
        assert.equal(typeof updatePipeline[0].$set.completed_chapter_ids.$setUnion, 'object');
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(eventCount, 1);

        ReadingProgress.findOneAndUpdate = async () => null;
        ReadingProgress.findOne = async () => ({
            completed_chapter_count: 1,
            completed_chapters_since_ad: 1,
            completed_chapter_ids: ['chapter-1']
        });
        const retry = await completeChapter('user-1', 'book-1', 'chapter-1');
        assert.equal(retry.newly_completed, false);
        assert.equal(retry.completed_chapter_count, 1);
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(eventCount, 1);
    } finally {
        ReadingProgress.findOneAndUpdate = originalFindOneAndUpdate;
        ReadingProgress.findOne = originalFindOne;
        ReadingProgress.create = originalCreate;
        ReadingEvent.create = originalEventCreate;
    }
});

test('chapter-open events are distinct from completion and idempotent within the retry window', async () => {
    const originalProgressUpdate = ReadingProgress.updateOne;
    const originalEventUpdate = ReadingEvent.updateOne;
    const originalEventExists = ReadingEvent.exists;
    const calls = [];
    let eventAlreadyExists = false;
    ReadingProgress.updateOne = async (...args) => { calls.push(['progress', ...args]); return {}; };
    ReadingEvent.exists = async () => eventAlreadyExists;
    ReadingEvent.updateOne = async (...args) => { calls.push(['event', ...args]); eventAlreadyExists = true; return {}; };
    try {
        const at = new Date('2026-10-29T10:00:00.000Z');
        assert.equal(await recordReadingOpen('user-1', 'book-1', 'chapter-1', 'chapter_open', at), true);
        assert.equal(await recordReadingOpen('user-1', 'book-1', 'chapter-1', 'chapter_open', at), true);
        assert.equal(calls.filter(([kind]) => kind === 'progress').length, 2);
        const openWrites = calls.filter(([kind]) => kind === 'event');
        assert.equal(openWrites.length, 1);
        assert.equal(openWrites[0][2].$setOnInsert.action, 'chapter_open');
        assert.equal(await recordReadingOpen(null, 'book-1'), false);
    } finally {
        ReadingProgress.updateOne = originalProgressUpdate;
        ReadingEvent.updateOne = originalEventUpdate;
        ReadingEvent.exists = originalEventExists;
    }
});

// [SCHEMA THUÊ BAO] Premium có giá cố định 20.000 VND/tháng và yêu cầu duyệt thủ công.
test('subscription model uses the Premium monthly plan and manual review states', async () => {
    assert.deepEqual(Subscription.schema.path('plan').enumValues, ['vip_monthly', 'premium_monthly']);
    assert.deepEqual(Subscription.schema.path('status').enumValues, ['pending', 'active', 'rejected', 'expired']);
    const record = new Subscription({
        user: '507f1f77bcf86cd799439011',
        payment_reference: 'BANK-123',
        transfer_note: 'OPENBOOK-123'
    });

    assert.equal(record.amount_vnd, 20000);
    assert.equal(record.status, 'pending');
    assert.equal(record.gateway, 'manual');
    await record.validate();
});

// [CHU KỲ QUẢNG CÁO] Harvey theo dõi mốc sáu chương theo yêu cầu; phân phối quảng cáo vẫn phụ thuộc chính sách Google.
test('user reading progress reaches the six chapter ad cadence', () => {
    assert.equal(ADS_CHAPTER_INTERVAL, 6);
    assert.equal(shouldShowAd(5), false);
    assert.equal(shouldShowAd(6), true);
    assert.equal(shouldShowAd(0), false);
});
