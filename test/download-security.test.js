// [KIỂM THỬ BẢO MẬT TẢI FILE] Xác nhận kho riêng chỉ phân giải file con và từ chối path traversal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { resolvePrivateBookFile } from '../src/utils/private-book-storage.js';

// [CHỐNG PATH TRAVERSAL] Tạo kho tạm, kiểm tra file hợp lệ và luôn khôi phục biến môi trường.
test('private file resolver blocks traversal outside the configured book directory', async () => {
    const previousStorage = process.env.BOOK_STORAGE_DIR;
    const storage = await mkdtemp(join(tmpdir(), 'openbook-private-'));
    const validPath = join(storage, 'sample.epub');
    try {
        process.env.BOOK_STORAGE_DIR = storage;
        await writeFile(validPath, 'test content');
        assert.equal(await resolvePrivateBookFile('sample.epub'), await resolve(validPath));
        await assert.rejects(
            resolvePrivateBookFile(`..${process.platform === 'win32' ? '\\' : '/'}outside.pdf`),
            (error) => error.statusCode === 404
        );
    } finally {
        if (previousStorage === undefined) delete process.env.BOOK_STORAGE_DIR;
        else process.env.BOOK_STORAGE_DIR = previousStorage;
        await rm(storage, { recursive: true, force: true });
    }
});
