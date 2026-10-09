// [KHO FILE RIÊNG TƯ] Phân giải/xóa file sách chỉ trong thư mục lưu trữ không public.
import { realpath, rm, stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import ApiError from './api-error.js';

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
