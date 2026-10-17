import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    toBookDto, toBookmarkDto, toChapterDto, toCommentDto,
    toReadingProgressDto, toReportDto, toSubscriptionDto, toUserDto
} from '../src/utils/api-dto.js';
import { validateBookFile } from '../src/utils/book-file-validation.js';
import { removePrivateBookFile, resolvePrivateBookFile, savePrivateBookFile } from '../src/utils/private-book-storage.js';

// Kiểm thử DTO user: Không để password/refresh token hash thoát ra kể cả khi nhận dữ liệu lean.
test('user DTO excludes credentials and derives active entitlements', () => {
    const dto = toUserDto({
        _id: 'user-id',
        name: 'Reader',
        email: 'reader@example.com',
        role: 'USER',
        password_hash: 'secret',
        refresh_token_hash: 'secret-token',
        is_vip: true,
        vip_expires_at: new Date(Date.now() + 60_000)
    });
    assert.equal(dto.is_vip, true);
    assert.equal(dto.is_premium, true);
    assert.equal(dto.password_hash, undefined);
    assert.equal(dto.refresh_token_hash, undefined);
});

// Kiểm thử DTO domain: Chỉ giữ allowlist và chuẩn hóa các quan hệ đã populate.
test('resource DTOs exclude internal fields and safely map populated references', () => {
    const owner = { _id: 'u1', name: 'Reader', password_hash: 'secret' };
    const book = toBookDto({
        _id: 'b1', title: 'Book', owner, file_key: 'private.pdf', __v: 1
    });
    const chapter = toChapterDto({
        _id: 'c1', title: 'Chapter',
        book_id: { _id: 'b1', title: 'Book', cover_url: 'https://example.test/cover.jpg', file_key: 'private.pdf' },
        __v: 1
    });
    const subscription = toSubscriptionDto({
        _id: 's1', user: owner, reviewed_by: owner, transfer_note: 'NOTE', password_hash: 'secret'
    });
    const comment = toCommentDto({ _id: 'm1', user: owner, body: 'Good', password_hash: 'secret' });
    const bookmark = toBookmarkDto({ _id: 'k1', user: owner, book: { _id: 'b1', title: 'Book' } });
    const progress = toReadingProgressDto({ _id: 'p1', user: owner, book: { _id: 'b1', title: 'Book' } });
    const report = toReportDto({ _id: 'r1', user: owner, subject: 'Help', password_hash: 'secret' });

    for (const dto of [book, chapter, subscription, comment, bookmark, progress, report]) {
        assert.equal(dto.password_hash, undefined);
        assert.equal(dto.__v, undefined);
    }
    assert.equal(book.file_key, undefined);
    assert.equal(chapter.book_id.cover_url, 'https://example.test/cover.jpg');
    assert.equal(book.owner.password_hash, undefined);
    assert.equal(chapter.book_id.file_key, undefined);
    assert.equal(subscription.user.password_hash, undefined);
    assert.equal(bookmark.user, undefined);
    assert.equal(progress.user, undefined);
});

// Kiểm thử file upload: Chỉ chấp nhận MIME, danh mục và magic bytes cùng khớp nhau.
test('book upload validation verifies MIME type, category, and file signature', () => {
    const pdf = Buffer.from('%PDF-1.7\nbody');
    assert.equal(validateBookFile({
        buffer: pdf,
        originalname: 'book.pdf',
        mimetype: 'application/pdf',
        category: 'ebook'
    }), '.pdf');
    assert.throws(() => validateBookFile({
        buffer: pdf,
        originalname: 'book.pdf',
        mimetype: 'text/plain',
        category: 'ebook'
    }), /MIME type/);
    assert.throws(() => validateBookFile({
        buffer: Buffer.from('not a PDF'),
        originalname: 'book.pdf',
        mimetype: 'application/pdf',
        category: 'ebook'
    }), /content does not match/);
    assert.throws(() => validateBookFile({
        buffer: pdf,
        originalname: 'book.pdf',
        mimetype: 'application/pdf',
        category: 'audiobook'
    }), /category/);
});

// Kiểm thử kho file riêng: Tạo PDF có khóa ngẫu nhiên trong thư mục cấu hình và xóa đúng file đã lưu.
test('private book storage saves PDF under a random non-public key', async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'openbook-private-book-'));
    const previousDirectory = process.env.BOOK_STORAGE_DIR;
    process.env.BOOK_STORAGE_DIR = directory;
    context.after(async () => {
        if (previousDirectory === undefined) delete process.env.BOOK_STORAGE_DIR;
        else process.env.BOOK_STORAGE_DIR = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    });

    const buffer = Buffer.from('%PDF-1.7\nprivate test');
    const saved = await savePrivateBookFile({
        buffer,
        originalname: 'reader-book.pdf',
        mimetype: 'application/pdf'
    }, 'ebook');
    assert.match(saved.file_key, /^[\da-f-]{36}\.pdf$/i);
    assert.equal(saved.original_name, 'reader-book.pdf');
    assert.deepEqual(await readFile(await resolvePrivateBookFile(saved.file_key)), buffer);
    await removePrivateBookFile(saved.file_key);
    await assert.rejects(resolvePrivateBookFile(saved.file_key), /not found/i);
});
