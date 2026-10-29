// [KHO FILE RIÊNG TƯ] Phân giải/xóa file sách chỉ trong thư mục lưu trữ không public.
import { createWriteStream } from 'node:fs';
import { mkdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import ApiError from './api-error.js';
import { validateBookFile } from './book-file-validation.js';

// Hàm savePrivateBookFile: Xác thực chữ ký file rồi ghi file với tên UUID vào kho không phục vụ static.
export const savePrivateBookFile = async (file, category) => {
    if (!file) throw new ApiError(400, 'A book file is required');
    const extension = validateBookFile({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        category
    });
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    await mkdir(storageRoot, { recursive: true });
    const fileKey = `${randomUUID()}${extension}`;
    const filePath = resolve(storageRoot, fileKey);
    await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
    return { file_key: fileKey, original_name: file.originalname.slice(0, 200) };
};

// [IMPORT STREAM] Lưu PDF theo luồng có giới hạn byte, kiểm tra chữ ký/EOF/trang rồi mới công bố khóa file.
export const savePrivateBookStream = async ({ stream, originalname, mimetype, category, maxBytes }) => {
    if (!stream || typeof stream.pipe !== 'function') throw new ApiError(400, 'A readable book stream is required');
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    await mkdir(storageRoot, { recursive: true });
    const id = randomUUID();
    const temporaryPath = resolve(storageRoot, `${id}.part`);
    const extension = '.pdf';
    const fileKey = `${id}${extension}`;
    const filePath = resolve(storageRoot, fileKey);
    let totalBytes = 0;
    let prefix = Buffer.alloc(0);
    let tail = Buffer.alloc(0);
    let pageMarkerFound = false;
    let scanTail = Buffer.alloc(0);
    const inspectAndLimit = new Transform({
        transform(chunk, encoding, callback) {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
            totalBytes += bytes.length;
            if (!Number.isFinite(maxBytes) || maxBytes <= 0 || totalBytes > maxBytes) {
                return callback(new ApiError(413, 'The ebook exceeds the configured size limit'));
            }
            if (prefix.length < 4096) prefix = Buffer.concat([prefix, bytes.subarray(0, 4096 - prefix.length)]);
            tail = Buffer.concat([tail, bytes]).subarray(-4096);
            const scan = Buffer.concat([scanTail, bytes]);
            if (/\/Type\s*\/Page\b/.test(scan.toString('latin1'))) pageMarkerFound = true;
            scanTail = scan.subarray(-64);
            return callback(null, bytes);
        }
    });

    try {
        await pipeline(stream, inspectAndLimit, createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }));
        if (totalBytes < 1024 || prefix.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new ApiError(422, 'The source response is not a non-empty PDF file');
        }
        if (!pageMarkerFound || !/%%EOF\s*$/.test(tail.toString('latin1'))) {
            throw new ApiError(422, 'The PDF is incomplete or has no readable page structure');
        }
        validateBookFile({ buffer: prefix, originalname, mimetype, category });
        await rename(temporaryPath, filePath);
        return { file_key: fileKey, original_name: basename(String(originalname || 'book.pdf')).slice(0, 200), size: totalBytes };
    } catch (error) {
        await rm(temporaryPath, { force: true }).catch(() => {});
        await rm(filePath, { force: true }).catch(() => {});
        throw error;
    }
};

const imageDimensions = (buffer, mimetype) => {
    if (mimetype === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), extension: '.png' };
    }
    if (mimetype !== 'image/jpeg' || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
    let offset = 2;
    while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const segmentLength = buffer.readUInt16BE(offset + 2);
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
            return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7), extension: '.jpg' };
        }
        if (segmentLength < 2) break;
        offset += segmentLength + 2;
    }
    return null;
};

// [XÁC MINH BÌA] Kiểm tra signature, MIME, pixel size và tỷ lệ dọc trước khi dùng ảnh làm bìa.
export const inspectPrivateBookCover = ({ buffer, mimetype }) => {
    if (!Buffer.isBuffer(buffer) || buffer.length > 5 * 1024 * 1024) {
        throw new ApiError(422, 'The verified cover image is empty or exceeds 5 MB');
    }
    const dimensions = imageDimensions(buffer, mimetype);
    if (!dimensions || dimensions.width < 120 || dimensions.height < 160
        || dimensions.height / dimensions.width < 1.15 || dimensions.height / dimensions.width > 2.2) {
        throw new ApiError(422, 'The source cover is not a valid portrait JPEG or PNG image');
    }
    return dimensions;
};

// [LƯU BÌA ĐÃ XÁC MINH] Chỉ nhận ảnh đã qua kiểm tra signature, MIME và tỷ lệ bìa sách.
export const savePrivateBookCover = async ({ buffer, mimetype }) => {
    const dimensions = inspectPrivateBookCover({ buffer, mimetype });
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    await mkdir(storageRoot, { recursive: true });
    const fileKey = `cover-${randomUUID()}${dimensions.extension}`;
    await writeFile(resolve(storageRoot, fileKey), buffer, { flag: 'wx', mode: 0o600 });
    return { file_key: fileKey, mimetype, width: dimensions.width, height: dimensions.height };
};

// [PHÂN GIẢI FILE] Từ chối path traversal, đường dẫn tuyệt đối và symlink thoát khỏi kho riêng.
export const resolvePrivateBookFile = async (fileKey) => {
    let root;
    try {
        root = await realpath(resolve(process.env.BOOK_STORAGE_DIR || 'private-books'));
    } catch (error) {
        if (error.code === 'ENOENT') throw new ApiError(404, 'Book file not found');
        throw error;
    }
    const candidate = resolve(root, fileKey);
    const pathFromRoot = relative(root, candidate);
    if (!fileKey || fileKey !== basename(fileKey) || isAbsolute(fileKey)
        || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
        throw new ApiError(404, 'Book file not found');
    }
    let actualPath;
    try {
        actualPath = await realpath(candidate);
    } catch (error) {
        if (error.code === 'ENOENT') throw new ApiError(404, 'Book file not found');
        throw error;
    }
    const actualRelativePath = relative(root, actualPath);
    if (actualRelativePath.startsWith(`..${sep}`) || actualRelativePath === '..') {
        throw new ApiError(404, 'Book file not found');
    }
    const fileStat = await stat(actualPath);
    if (!fileStat.isFile()) throw new ApiError(404, 'Book file not found');
    return actualPath;
};

// [XÓA FILE RIÊNG TƯ] Dọn file khi sách bị xóa/thay thế; file vắng mặt được xem là đã dọn.
export const removePrivateBookFile = async (fileKey) => {
    if (!fileKey) return;
    try {
        await rm(await resolvePrivateBookFile(fileKey));
    } catch (error) {
        if (error.statusCode === 404) return;
        throw error;
    }
};
