import { extname } from 'node:path';
import ApiError from './api-error.js';

const MIME_TYPES = Object.freeze({
    '.epub': ['application/epub+zip', 'application/zip'],
    '.pdf': ['application/pdf'],
    '.mp3': ['audio/mpeg', 'audio/mp3'],
    '.m4a': ['audio/mp4', 'audio/x-m4a'],
    '.mp4': ['video/mp4', 'audio/mp4'],
    '.webm': ['video/webm', 'audio/webm']
});

const categoryExtensions = Object.freeze({
    ebook: ['.epub', '.pdf'],
    audiobook: ['.mp3', '.m4a'],
    comic: ['.pdf', '.epub', '.mp4', '.webm'],
    webnovel: ['.pdf', '.epub']
});

// Hàm hasValidSignature: Kiểm tra magic bytes của file để không tin riêng extension/MIME do client gửi.
const hasValidSignature = (buffer, extension) => {
    if (!Buffer.isBuffer(buffer)) return false;
    if (extension === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (extension === '.epub') {
        return buffer.length >= 4
            && buffer[0] === 0x50 && buffer[1] === 0x4b
            && buffer.includes(Buffer.from('mimetype'))
            && buffer.includes(Buffer.from('application/epub+zip'));
    }
    if (extension === '.mp3') {
        return buffer.subarray(0, 3).toString('ascii') === 'ID3'
            || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    }
    if (['.m4a', '.mp4'].includes(extension)) {
        return buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    }
    if (extension === '.webm') {
        return buffer.length >= 4
            && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    return false;
};

// Hàm validateBookFile: Đối chiếu loại file, MIME, danh mục sách và signature trước khi ghi vào kho riêng.
export const validateBookFile = ({ buffer, originalname, mimetype, category }) => {
    const extension = extname(String(originalname || '')).toLowerCase();
    const acceptedMimeTypes = MIME_TYPES[extension];
    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(String(mimetype || '').toLowerCase())) {
        throw new ApiError(400, 'File extension and MIME type are not supported');
    }
    if (categoryExtensions[category] && !categoryExtensions[category].includes(extension)) {
        throw new ApiError(400, 'File type does not match the book category');
    }
    if (!hasValidSignature(buffer, extension)) {
        throw new ApiError(400, 'Uploaded file content does not match its declared file type');
    }
    return extension;
};
