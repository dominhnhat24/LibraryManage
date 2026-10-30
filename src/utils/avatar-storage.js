// Import { randomUUID } từ node:crypto để dùng trong module.
/**
 * Tệp src/utils/avatar-storage.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { randomUUID } from 'node:crypto';
// Import { mkdir, realpath, rm, stat, writeFile } từ node:fs/promises để dùng trong module.
import { mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
// Import { basename, relative, resolve, sep } từ node:path để dùng trong module.
import { basename, relative, resolve, sep } from 'node:path';
// Import ApiError từ ./api-error.js để dùng trong module.
import ApiError from './api-error.js';

// Khai báo MAX_AVATAR_BYTES nhận giá trị từ 5 * 1024 * 1024. const giữ biến không gán lại; let cho phép cập nhật.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
// Khai báo PNG_SIGNATURE nhận giá trị từ Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]). const giữ biến không gán lại; let cho phép cập nhật.
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Hàm crc32: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: buffer.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: return.
 */
const crc32 = (buffer) => {
    // Khai báo crc nhận giá trị từ 0xffffffff. const giữ biến không gán lại; let cho phép cập nhật.
    let crc = 0xffffffff;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const byte of buffer) {
        // Gọi/thực thi biểu thức để thực hiện thao tác: crc ^= byte
        crc ^= byte;
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    // return kết thúc hàm và trả (crc ^ 0xffffffff) >>> 0 về nơi gọi.
    return (crc ^ 0xffffffff) >>> 0;
};

/**
 * Hàm getImageInfo: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: buffer.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: subarray, equals, readUInt32BE, toString, crc32, readUInt16BE, includes.
 */
const getImageInfo = (buffer) => {
    // if chỉ chạy nhánh này khi điều kiện buffer.subarray(0, 8).equals(PNG_SIGNATURE) đúng.
    if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        // Khai báo offset nhận giá trị từ 8. const giữ biến không gán lại; let cho phép cập nhật.
        let offset = 8;
        // Khai báo width nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
        let width;
        // Khai báo height nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
        let height;
        // Khai báo hasIdat nhận giá trị từ false. const giữ biến không gán lại; let cho phép cập nhật.
        let hasIdat = false;
        // Khai báo hasIend nhận giá trị từ false. const giữ biến không gán lại; let cho phép cập nhật.
        let hasIend = false;
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        while (offset + 12 <= buffer.length) {
            // Khai báo length nhận giá trị từ buffer.readUInt32BE(offset). const giữ biến không gán lại; let cho phép cập nhật.
            const length = buffer.readUInt32BE(offset);
            // Khai báo dataStart nhận giá trị từ offset + 8. const giữ biến không gán lại; let cho phép cập nhật.
            const dataStart = offset + 8;
            // Khai báo dataEnd nhận giá trị từ dataStart + length. const giữ biến không gán lại; let cho phép cập nhật.
            const dataEnd = dataStart + length;
            // Khai báo chunkEnd nhận giá trị từ dataEnd + 4. const giữ biến không gán lại; let cho phép cập nhật.
            const chunkEnd = dataEnd + 4;
            // if chỉ chạy nhánh này khi điều kiện chunkEnd > buffer.length đúng.
            if (chunkEnd > buffer.length) return null;
            // Khai báo type nhận giá trị từ buffer.toString('ascii', offset + 4, offset + 8). const giữ biến không gán lại; let cho phép cập nhật.
            const type = buffer.toString('ascii', offset + 4, offset + 8);
            // Khai báo chunkCrc nhận giá trị từ buffer.readUInt32BE(dataEnd). const giữ biến không gán lại; let cho phép cập nhật.
            const chunkCrc = buffer.readUInt32BE(dataEnd);
            // if chỉ chạy nhánh này khi điều kiện crc32(buffer.subarray(offset + 4, dataEnd)) !== chunkCrc đúng.
            if (crc32(buffer.subarray(offset + 4, dataEnd)) !== chunkCrc) return null;
            // if chỉ chạy nhánh này khi điều kiện offset === 8 đúng.
            if (offset === 8) {
                // if chỉ chạy nhánh này khi điều kiện type !== 'IHDR' || length !== 13 đúng.
                if (type !== 'IHDR' || length !== 13) return null;
                // Gọi/thực thi buffer.readUInt32BE với các đối số để thực hiện thao tác: width = buffer.readUInt32BE(dataStart)
                width = buffer.readUInt32BE(dataStart);
                // Gọi/thực thi buffer.readUInt32BE với các đối số để thực hiện thao tác: height = buffer.readUInt32BE(dataStart + 4)
                height = buffer.readUInt32BE(dataStart + 4);
            } else if (type === 'IHDR') return null;
            // if chỉ chạy nhánh này khi điều kiện type === 'IDAT' đúng.
            if (type === 'IDAT') hasIdat = true;
            // if chỉ chạy nhánh này khi điều kiện type === 'IEND' đúng.
            if (type === 'IEND') {
                // if chỉ chạy nhánh này khi điều kiện length !== 0 || !hasIdat || chunkEnd !== buffer.length đúng.
                if (length !== 0 || !hasIdat || chunkEnd !== buffer.length) return null;
                // Gọi/thực thi biểu thức để thực hiện thao tác: hasIend = true
                hasIend = true;

                break;
            }
            // Gọi/thực thi biểu thức để thực hiện thao tác: offset = chunkEnd
            offset = chunkEnd;
        }
        // if chỉ chạy nhánh này khi điều kiện hasIend đúng.
        if (hasIend) return { extension: '.png', contentType: 'image/png', width, height };
        // return kết thúc hàm và trả null về nơi gọi.
        return null;
    }
    // if chỉ chạy nhánh này khi điều kiện buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[buf đúng.
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8
        || buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) return null;
    // Khai báo offset nhận giá trị từ 2. const giữ biến không gán lại; let cho phép cập nhật.
    let offset = 2;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    while (offset + 9 < buffer.length) {
        // if chỉ chạy nhánh này khi điều kiện buffer[offset] !== 0xff đúng.
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        // Khai báo marker nhận giá trị từ buffer[offset + 1]. const giữ biến không gán lại; let cho phép cập nhật.
        const marker = buffer[offset + 1];
        // Khai báo segmentLength nhận giá trị từ buffer.readUInt16BE(offset + 2). const giữ biến không gán lại; let cho phép cập nhật.
        const segmentLength = buffer.readUInt16BE(offset + 2);
        // if chỉ chạy nhánh này khi điều kiện segmentLength < 2 || offset + segmentLength + 2 > buffer.length đúng.
        if (segmentLength < 2 || offset + segmentLength + 2 > buffer.length) return null;
        // if chỉ chạy nhánh này khi điều kiện [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0x đúng.
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
            // return kết thúc hàm và trả { extension: '.jpg', contentType: 'image/jpeg', height: buffer.readUInt16BE về nơi gọi.
            return {
                // Trường extension lưu '.jpg' làm giá trị trong object.
                extension: '.jpg', contentType: 'image/jpeg',
                // Trường height lưu buffer.readUInt16BE(offset + 5) làm giá trị trong object.
                height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7)
            };
        }
        // Gọi/thực thi biểu thức để thực hiện thao tác: offset += segmentLength + 2
        offset += segmentLength + 2;
    }
    // return kết thúc hàm và trả null về nơi gọi.
    return null;
};

/**
 * Hàm inspectAvatarUpload: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: file.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isBuffer, ApiError, String, basename, replace, slice, lastIndexOf, toLowerCase.
 */
export const inspectAvatarUpload = (file) => {
    // if chỉ chạy nhánh này khi điều kiện !file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file. đúng.
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.buffer.length > MAX_AVATAR_BYTES) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(413, 'Avatar must be a non-empty image no larger than 5 MB');
    }
    // Khai báo name nhận giá trị từ String(file.originalname || ''). const giữ biến không gán lại; let cho phép cập nhật.
    const name = String(file.originalname || '');
    // Khai báo safeName nhận giá trị từ basename(name.replace(/\\/g, '/')). const giữ biến không gán lại; let cho phép cập nhật.
    const safeName = basename(name.replace(/\\/g, '/'));
    // Khai báo extension nhận giá trị từ safeName.slice(safeName.lastIndexOf('.')).toLowerCase(). const giữ biến không gán lại; let cho phép cập nhật.
    const extension = safeName.slice(safeName.lastIndexOf('.')).toLowerCase();
    // Khai báo image nhận giá trị từ getImageInfo(file.buffer). const giữ biến không gán lại; let cho phép cập nhật.
    const image = getImageInfo(file.buffer);
    // if chỉ chạy nhánh này khi điều kiện !safeName || safeName.length > 255 || /[\0\r\n]/.test(safeName) || !image | đúng.
    if (!safeName || safeName.length > 255 || /[\0\r\n]/.test(safeName)
        || !image || extension !== image.extension || file.mimetype !== image.contentType
        || image.width < 32 || image.height < 32
        || image.width > 8000 || image.height > 8000) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, 'Avatar must be a valid PNG or JPEG image with a matching filename extension');
    }
    // return kết thúc hàm và trả image về nơi gọi.
    return image;
};

/**
 * Hàm avatarRoot: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: resolve.
 */
const avatarRoot = () => resolve(process.env.AVATAR_STORAGE_DIR || 'private-avatars');

/**
 * Hàm saveAvatar: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: file.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: inspectAvatarUpload, avatarRoot, mkdir, randomUUID, writeFile, resolve.
 */
export const saveAvatar = async (file) => {
    // Khai báo image nhận giá trị từ inspectAvatarUpload(file). const giữ biến không gán lại; let cho phép cập nhật.
    const image = inspectAvatarUpload(file);
    // Khai báo root nhận giá trị từ avatarRoot(). const giữ biến không gán lại; let cho phép cập nhật.
    const root = avatarRoot();
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await mkdir(root, { recursive: true })
    await mkdir(root, { recursive: true });
    // Khai báo key nhận giá trị từ `${randomUUID()}${image.extension}`. const giữ biến không gán lại; let cho phép cập nhật.
    const key = `${randomUUID()}${image.extension}`;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await writeFile(resolve(root, key), file.buffer, { flag: 'wx', mode: 0o600
    await writeFile(resolve(root, key), file.buffer, { flag: 'wx', mode: 0o600 });
    // return kết thúc hàm và trả { key, content_type: image.contentType } về nơi gọi.
    return { key, content_type: image.contentType };
};

/**
 * Hàm resolveAvatar: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: key.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: test, ApiError, realpath, avatarRoot, resolve, relative, startsWith, stat.
 */
export const resolveAvatar = async (key) => {
    // if chỉ chạy nhánh này khi điều kiện typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key) đúng.
    if (typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Avatar not found');
    }
    // Khai báo root nhận giá trị từ await realpath(avatarRoot()).catch((error) => { if (err. const giữ biến không gán lại; let cho phép cập nhật.
    const root = await realpath(avatarRoot()).catch((error) => {
        // if chỉ chạy nhánh này khi điều kiện error.code === 'ENOENT' đúng.
        if (error.code === 'ENOENT') throw new ApiError(404, 'Avatar not found');
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    });
    // Khai báo path nhận giá trị từ resolve(root, key). const giữ biến không gán lại; let cho phép cập nhật.
    const path = resolve(root, key);
    // Khai báo fromRoot nhận giá trị từ relative(root, path). const giữ biến không gán lại; let cho phép cập nhật.
    const fromRoot = relative(root, path);
    // if chỉ chạy nhánh này khi điều kiện fromRoot.startsWith(`..${sep}`) || fromRoot === '..' đúng.
    if (fromRoot.startsWith(`..${sep}`) || fromRoot === '..') throw new ApiError(404, 'Avatar not found');
    // Khai báo actual nhận giá trị từ await realpath(path).catch((error) => { if (error.code . const giữ biến không gán lại; let cho phép cập nhật.
    const actual = await realpath(path).catch((error) => {
        // if chỉ chạy nhánh này khi điều kiện error.code === 'ENOENT' đúng.
        if (error.code === 'ENOENT') throw new ApiError(404, 'Avatar not found');
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    });
    // Khai báo actualRelative nhận giá trị từ relative(root, actual). const giữ biến không gán lại; let cho phép cập nhật.
    const actualRelative = relative(root, actual);
    // Khai báo fileStat nhận giá trị từ await stat(actual). const giữ biến không gán lại; let cho phép cập nhật.
    const fileStat = await stat(actual);
    // if chỉ chạy nhánh này khi điều kiện actualRelative.startsWith(`..${sep}`) || actualRelative === '..' || !fileSt đúng.
    if (actualRelative.startsWith(`..${sep}`) || actualRelative === '..' || !fileStat.isFile()) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Avatar not found');
    }
    // return kết thúc hàm và trả { path: actual, content_type: key.endsWith('.png') ? 'image/png' : 'image/j về nơi gọi.
    return { path: actual, content_type: key.endsWith('.png') ? 'image/png' : 'image/jpeg' };
};

/**
 * Hàm removeAvatar: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: key.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: test, avatarRoot, resolve, relative, startsWith, rm.
 */
export const removeAvatar = async (key) => {
    // if chỉ chạy nhánh này khi điều kiện typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key) đúng.
    if (typeof key !== 'string' || !/^[\da-f-]{36}\.(?:png|jpg)$/.test(key)) return;
    // Khai báo root nhận giá trị từ avatarRoot(). const giữ biến không gán lại; let cho phép cập nhật.
    const root = avatarRoot();
    // Khai báo path nhận giá trị từ resolve(root, key). const giữ biến không gán lại; let cho phép cập nhật.
    const path = resolve(root, key);
    // Khai báo fromRoot nhận giá trị từ relative(root, path). const giữ biến không gán lại; let cho phép cập nhật.
    const fromRoot = relative(root, path);
    // if chỉ chạy nhánh này khi điều kiện fromRoot.startsWith(`..${sep}`) || fromRoot === '..' đúng.
    if (fromRoot.startsWith(`..${sep}`) || fromRoot === '..') return;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await rm(path, { force: true })
    await rm(path, { force: true });
};
