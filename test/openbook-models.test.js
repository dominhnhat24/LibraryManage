// [KIỂM THỬ MODEL] Xác minh role, hạn thuê bao và schema nội dung số mà không cần MongoDB.
import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/user.model.js';
import Book from '../src/models/book.model.js';
import Subscription from '../src/models/subscription.model.js';
import { ADS_CHAPTER_INTERVAL, shouldShowAd } from '../src/middlewares/ads.middleware.js';

// [QUYỀN PREMIUM/VIP] Bao phủ tài khoản Free, Premium còn/hết hạn, VIP còn/hết hạn và admin.
test('user model computes Premium and VIP permissions using current expiry', () => {
    const now = new Date('2026-10-01T00:00:00.000Z');
    const free = new User({ role: 'free' });
    const premium = new User({
        role: 'free', is_premium: true, premium_expires_at: new Date('2026-10-02T00:00:00.000Z')
    });
    const expiredPremium = new User({
        role: 'free', is_premium: true, premium_expires_at: new Date('2026-09-30T00:00:00.000Z')
    });
    const vip = new User({
        role: 'vip', is_vip: true, vip_expires_at: new Date('2026-10-02T00:00:00.000Z')
    });
    const expiredVip = new User({
        role: 'vip', is_vip: true, vip_expires_at: new Date('2026-09-30T00:00:00.000Z')
    });
    const admin = new User({ role: 'admin' });

    assert.equal(free.hasActivePremium(now), false);
    assert.equal(free.hasActiveVip(now), false);
    assert.equal(premium.hasActivePremium(now), true);
    assert.equal(premium.hasActiveVip(now), false);
    assert.equal(expiredPremium.hasActivePremium(now), false);
    assert.equal(vip.hasActivePremium(now), true);
    assert.equal(vip.hasActiveVip(now), true);
    assert.equal(expiredVip.hasActivePremium(now), false);
    assert.equal(expiredVip.toPublicJSON().role, 'free');
    assert.equal(admin.hasActivePremium(now), true);
    assert.equal(admin.hasActiveVip(now), true);
});

// [SCHEMA SÁCH] Danh mục giới hạn theo sản phẩm và khóa tệp bị ẩn khỏi truy vấn thông thường.
test('book schema validates digital categories and protects storage keys', async () => {
    assert.deepEqual(Book.schema.path('category').enumValues, ['ebook', 'audiobook', 'comic', 'webnovel']);
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

// [SCHEMA THUÊ BAO] Premium có giá cố định 20.000 VND/tháng và yêu cầu duyệt thủ công.
test('subscription model uses the Premium monthly plan and manual review states', async () => {
    assert.deepEqual(Subscription.schema.path('plan').enumValues, ['premium_monthly']);
    assert.deepEqual(Subscription.schema.path('status').enumValues, ['pending', 'active', 'rejected', 'expired']);
    const record = new Subscription({
        user: '507f1f77bcf86cd799439011',
        payment_reference: 'BANK-123',
        transfer_note: 'OPENBOOK-123'
    });

    // [CHU KỲ QUẢNG CÁO] Kiểm tra đúng ngưỡng: quảng cáo chỉ xuất hiện sau mỗi ba lượt đọc.
    test('free reading ads are due once per three chapter reads', () => {
        assert.equal(ADS_CHAPTER_INTERVAL, 3);
        for (let chapterRead = 1; chapterRead <= 9; chapterRead += 1) {
            assert.equal(shouldShowAd(chapterRead % ADS_CHAPTER_INTERVAL), chapterRead % 3 === 0);
        }
    });
    assert.equal(record.amount_vnd, 20000);
    assert.equal(record.status, 'pending');
    await record.validate();
});
