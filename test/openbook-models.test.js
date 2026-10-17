// [KIỂM THỬ MODEL] Xác minh role, hạn thuê bao và schema nội dung số mà không cần MongoDB.
import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/user.model.js';
import Book from '../src/models/book.model.js';
import Subscription from '../src/models/subscription.model.js';
import { ADS_CHAPTER_INTERVAL, shouldShowAd } from '../src/middlewares/ads.middleware.js';
import { ROLES } from '../src/constants/roles.constant.js';
import { requireAdmin } from '../src/middlewares/role.middleware.js';
import { loadAccessibleBook } from '../src/controllers/book.controller.js';

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
    assert.equal(premium.hasActiveVip(now), false);
    assert.equal(expiredPremium.hasActivePremium(now), false);
    assert.equal(vip.hasActivePremium(now), true);
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

// [SCHEMA SÁCH] Danh mục giới hạn theo sản phẩm và khóa tệp bị ẩn khỏi truy vấn thông thường.
test('book schema validates digital categories and protects storage keys', async () => {
    assert.deepEqual(Book.schema.path('category').enumValues, ['ebook', 'audiobook', 'comic', 'webnovel']);
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
    await record.validate();
});

// [CHU KỲ QUẢNG CÁO] Xác nhận USER thấy quảng cáo sau mỗi ba lượt đọc chương.
test('user reading ads are due once per three chapter reads', () => {
    assert.equal(ADS_CHAPTER_INTERVAL, 3);
    for (let chapterRead = 1; chapterRead <= 9; chapterRead += 1) {
        assert.equal(shouldShowAd(chapterRead % ADS_CHAPTER_INTERVAL), chapterRead % 3 === 0);
    }
});
