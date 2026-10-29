import { randomUUID } from 'node:crypto';
import { mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { basename, relative, resolve, sep } from 'node:path';
import ApiError from './api-error.js';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const getImageInfo = (buffer) => {
    if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        let offset = 8;
        let width;
        let height;
        let hasIdat = false;
        let hasIend = false;
        while (offset + 12 <= buffer.length) {
            const length = buffer.readUInt32BE(offset);
            const dataStart = offset + 8;
            const dataEnd = dataStart + length;
            const chunkEnd = dataEnd + 4;
            if (chunkEnd > buffer.length) return null;
            const type = buffer.toString('ascii', offset + 4, offset + 8);
            const chunkCrc = buffer.readUInt32BE(dataEnd);
            if (crc32(buffer.subarray(offset + 4, dataEnd)) !== chunkCrc) return null;
            if (offset === 8) {
                if (type !== 'IHDR' || length !== 13) return null;
                width = buffer.readUInt32BE(dataStart);
                height = buffer.readUInt32BE(dataStart + 4);
            } else if (type === 'IHDR') return null;
            if (type === 'IDAT') hasIdat = true;
            if (type === 'IEND') {
                if (length !== 0 || !hasIdat || chunkEnd !== buffer.length) return null;
                hasIend = true;
                break;
            }
            offset = chunkEnd;
        }
        if (hasIend) return { extension: '.png', contentType: 'image/png', width, height };
        return null;
    }
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8
        || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) return null;
    let offset = 2;
    while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const segmentLength = buffer.readUInt16BE(offset + 2);
        if (segmentLength < 2 || offset + segmentLength + 2 > buffer.length) return null;
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
            return {
                extension: '.jpg', contentType: 'image/jpeg',
                height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7)
            };
        }
        offset += segmentLength + 2;
    }
    return null;
};

export const inspectAvatarUpload = (file) => {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.buffer.length > MAX_AVATAR_BYTES) {
        throw new ApiError(413, 'Avatar must be a non-empty image no larger than 5 MB');
    }
    const name = String(file.originalname || '');
    const safeName = basename(name.replace(/\\/g, '/'));
    const extension = safeName.slice(safeName.lastIndexOf('.')).toLowerCase();
    const image = getImageInfo(file.buffer);
    if (!safeName || safeName.length > 255 || /[\0\r\n]/.test(safeName)
        || !image || extension !== image.extension || file.mimetype !== image.contentType
        || image.width < 32 || image.height < 32
        || image.width > 8000 || image.height > 8000) {
        throw new ApiError(422, 'Avatar must be a valid PNG or JPEG image with a matching filename extension');
    }
    return image;
};

const avatarRoot = () => resolve(process.env.AVATAR_STORAGE_DIR || 'private-avatars');

export const saveAvatar = async (file) => {
    const image = inspectAvatarUpload(file);
    const root = avatarRoot();
    await mkdir(root, { recursive: true });
    const key = `${randomUUID()}${image.extension}`;
    await writeFile(resolve(root, key), file.buffer, { flag: 'wx', mode: 0o600 });
    return { key, content_type: image.contentType };
};

export const resolveAvatar = async (key) => {
    if (typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key)) {
        throw new ApiError(404, 'Avatar not found');
    }
    const root = await realpath(avatarRoot()).catch((error) => {
        if (error.code === 'ENOENT') throw new ApiError(404, 'Avatar not found');
        throw error;
    });
    const path = resolve(root, key);
    const fromRoot = relative(root, path);
    if (fromRoot.startsWith(`..${sep}`) || fromRoot === '..') throw new ApiError(404, 'Avatar not found');
    const actual = await realpath(path).catch((error) => {
        if (error.code === 'ENOENT') throw new ApiError(404, 'Avatar not found');
        throw error;
    });
    const actualRelative = relative(root, actual);
    const fileStat = await stat(actual);
    if (actualRelative.startsWith(`..${sep}`) || actualRelative === '..' || !fileStat.isFile()) {
        throw new ApiError(404, 'Avatar not found');
    }
    return { path: actual, content_type: key.endsWith('.png') ? 'image/png' : 'image/jpeg' };
};

export const removeAvatar = async (key) => {
    if (typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key)) return;
    const root = avatarRoot();
    const path = resolve(root, key);
    const fromRoot = relative(root, path);
    if (fromRoot.startsWith(`..${sep}`) || fromRoot === '..') return;
    await rm(path, { force: true });
};
