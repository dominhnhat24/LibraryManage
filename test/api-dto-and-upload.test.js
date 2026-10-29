import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import {
    toBookDto, toBookmarkDto, toChapterDto, toCommentDto,
    toReadingProgressDto, toReportDto, toSubscriptionDto, toUserDto
} from '../src/utils/api-dto.js';
import { validateBookFile } from '../src/utils/book-file-validation.js';
import {
    inspectPrivateBookCover, removePrivateBookFile, resolvePrivateBookFile,
    savePrivateBookFile, savePrivateBookStream
} from '../src/utils/private-book-storage.js';
import { inspectAvatarUpload, removeAvatar, resolveAvatar, saveAvatar } from '../src/utils/avatar-storage.js';
import { resolveWikisourceLicense } from '../src/services/book-import.service.js';
import { createWikisourcePdfStream, wikisourceWikitextToText } from '../src/utils/wikisource-pdf.js';

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
    assert.equal(dto.is_premium, false);
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

// Kiểm thử import PDF: Chỉ công bố file sau khi đọc đủ stream, giới hạn kích thước và xác minh cấu trúc PDF.
test('streamed PDF imports reject incomplete or oversized files and keep valid files private', async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'openbook-import-stream-'));
    const previousDirectory = process.env.BOOK_STORAGE_DIR;
    process.env.BOOK_STORAGE_DIR = directory;
    context.after(async () => {
        if (previousDirectory === undefined) delete process.env.BOOK_STORAGE_DIR;
        else process.env.BOOK_STORAGE_DIR = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    });

    const pdf = Buffer.from(`%PDF-1.7\n1 0 obj << /Type /Page >> endobj\n${'x'.repeat(1200)}\n%%EOF\n`);
    const saved = await savePrivateBookStream({
        stream: Readable.from([pdf]), originalname: 'licensed-book.pdf',
        mimetype: 'application/pdf', category: 'ebook', maxBytes: 4096
    });
    assert.equal(saved.size, pdf.length);
    assert.deepEqual(await readFile(await resolvePrivateBookFile(saved.file_key)), pdf);

    await assert.rejects(savePrivateBookStream({
        stream: Readable.from([Buffer.from('<html>not a pdf</html>')]), originalname: 'bad.pdf',
        mimetype: 'application/pdf', category: 'ebook', maxBytes: 4096
    }), /not a non-empty PDF/i);
    await assert.rejects(savePrivateBookStream({
        stream: Readable.from([pdf]), originalname: 'large.pdf',
        mimetype: 'application/pdf', category: 'ebook', maxBytes: 100
    }), /size limit/i);
});

// Kiểm thử metadata pháp lý: Chỉ cho phép các thẻ PD/Creative Commons được khai báo; NC/ND không được nhận.
test('Wikisource license parsing allows only explicitly supported reuse licenses', () => {
    assert.equal(resolveWikisourceLicense('{{CC-BY-4.0}}')?.name, 'Creative Commons Attribution 4.0');
    assert.equal(resolveWikisourceLicense('{{CC-BY-SA-4.0|author=Test}}')?.access, 'free');
    assert.equal(resolveWikisourceLicense('{{PVCC-Việt Nam}}')?.template, 'pvcc-việt nam');
    assert.equal(resolveWikisourceLicense('', [{ title: 'Thể loại:PVCC-cũ' }])?.evidence, 'category');
    assert.equal(resolveWikisourceLicense('{{CC-BY-NC-SA-4.0}}'), null);
    assert.equal(resolveWikisourceLicense('{{CC-BY-ND-4.0}}'), null);
    assert.equal(resolveWikisourceLicense('No license tag'), null);
});

// Kiểm thử ảnh bìa: Từ chối ảnh không dọc hoặc sai chữ ký trước khi lưu.
test('cover validation requires a supported portrait PNG/JPEG image', () => {
    const png = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
    png.writeUInt32BE(240, 16);
    png.writeUInt32BE(360, 20);
    assert.deepEqual(inspectPrivateBookCover({ buffer: png, mimetype: 'image/png' }), {
        width: 240, height: 360, extension: '.png'
    });
    assert.throws(() => inspectPrivateBookCover({ buffer: png, mimetype: 'image/jpeg' }), /portrait/i);
    const landscape = Buffer.from(png);
    landscape.writeUInt32BE(360, 16);
    landscape.writeUInt32BE(240, 20);
    assert.throws(() => inspectPrivateBookCover({ buffer: landscape, mimetype: 'image/png' }), /portrait/i);
});

test('avatar upload rejects client-claimed image MIME without matching image bytes', () => {
    assert.throws(() => inspectAvatarUpload({
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('not an image')
    }), { statusCode: 422 });
    assert.throws(() => inspectAvatarUpload({
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1)
    }), { statusCode: 413 });
});

test('avatar storage validates PNG structure and keeps files behind the configured API storage path', async () => {
    const crc32 = (buffer) => {
        let crc = 0xffffffff;
        for (const byte of buffer) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
        return (crc ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const typeBytes = Buffer.from(type);
        const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
        const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
        return Buffer.concat([length, typeBytes, data, crc]);
    };
    const header = Buffer.alloc(13);
    header.writeUInt32BE(32, 0); header.writeUInt32BE(32, 4);
    header[8] = 8; header[9] = 6;
    const raw = Buffer.alloc(32 * (1 + 32 * 4));
    const png = Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
    ]);
    const upload = { originalname: 'portrait.PNG', mimetype: 'image/png', buffer: png };
    assert.equal(inspectAvatarUpload(upload).width, 32);

    const tempDirectory = await mkdtemp(join(tmpdir(), 'harvey-avatar-test-'));
    const previousDirectory = process.env.AVATAR_STORAGE_DIR;
    process.env.AVATAR_STORAGE_DIR = tempDirectory;
    try {
        const saved = await saveAvatar(upload);
        assert.match(saved.key, /^[\da-f-]{36}\.png$/);
        const resolved = await resolveAvatar(saved.key);
        assert.equal(resolved.content_type, 'image/png');
        assert.deepEqual(await readFile(resolved.path), png);
        await removeAvatar(saved.key);
        await assert.rejects(resolveAvatar(saved.key), { statusCode: 404 });
    } finally {
        if (previousDirectory === undefined) delete process.env.AVATAR_STORAGE_DIR;
        else process.env.AVATAR_STORAGE_DIR = previousDirectory;
        await rm(tempDirectory, { recursive: true, force: true });
    }
});

// Kiểm thử PDF tiếng Việt: Bảo đảm Wikitext được chuyển thành nội dung có dấu và PDF có thể lưu vào kho riêng.
test('Wikisource text is rendered into a valid private Vietnamese PDF', async (context) => {
    const directory = await mkdtemp(join(tmpdir(), 'openbook-wikisource-pdf-'));
    const previousDirectory = process.env.BOOK_STORAGE_DIR;
    process.env.BOOK_STORAGE_DIR = directory;
    context.after(async () => {
        if (previousDirectory === undefined) delete process.env.BOOK_STORAGE_DIR;
        else process.env.BOOK_STORAGE_DIR = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    });

    const poem = Array.from({ length: 220 }, (_, index) => `Trăm năm trong cõi người ta, câu số ${index + 1}.`).join('\n');
    const wikitext = `{{đầu đề|tựa đề=Thử nghiệm}}\n<poem>'''Thử nghiệm''' [[w:Nguyễn Du|Nguyễn Du]]\n${poem}</poem>`;
    const plainText = wikisourceWikitextToText(wikitext);
    assert.match(plainText, /Trăm năm trong cõi người ta/);
    assert.doesNotMatch(plainText, /\{\{|\[\[|<poem>/);

    const generated = createWikisourcePdfStream({
        title: 'Tác phẩm thử nghiệm', author: 'Nguyễn Du', wikitext,
        sourceUrl: 'https://vi.wikisource.org/wiki/Th%E1%BB%AD_nghi%E1%BB%87m',
        license: { name: 'Phạm vi công cộng', url: 'https://vi.wikisource.org/' }
    });
    const saved = await savePrivateBookStream({
        stream: generated.stream, originalname: 'wikisource-test.pdf',
        mimetype: 'application/pdf', category: 'ebook', maxBytes: 2 * 1024 * 1024
    });
    assert.ok(saved.size > 1024);
    const pdf = await readFile(await resolvePrivateBookFile(saved.file_key));
    assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
    assert.match(pdf.subarray(-512).toString('latin1'), /%%EOF/);
});
