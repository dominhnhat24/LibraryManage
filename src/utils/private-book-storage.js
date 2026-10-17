// [KHO FILE RIÊNG TƯ] Phân giải/xóa file sách chỉ trong thư mục lưu trữ không public.
import { mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
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
