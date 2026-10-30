// [KHO FILE RIÊNG TƯ] Phân giải/xóa file sách chỉ trong thư mục lưu trữ không public.
// Import { createWriteStream } từ node:fs để dùng trong module.
/**
 * Tệp src/utils/private-book-storage.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { createWriteStream } from 'node:fs';
// Import { mkdir, realpath, rename, rm, stat, writeFile } từ node:fs/promises để dùng trong module.
import { mkdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
// Import { randomUUID } từ node:crypto để dùng trong module.
import { randomUUID } from 'node:crypto';
// Import { basename, isAbsolute, relative, resolve, sep } từ node:path để dùng trong module.
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
// Import { Transform } từ node:stream để dùng trong module.
import { Transform } from 'node:stream';
// Import { pipeline } từ node:stream/promises để dùng trong module.
import { pipeline } from 'node:stream/promises';
// Import ApiError từ ./api-error.js để dùng trong module.
import ApiError from './api-error.js';
// Import { validateBookFile } từ ./book-file-validation.js để dùng trong module.
import { validateBookFile } from './book-file-validation.js';

// Hàm savePrivateBookFile: Xác thực chữ ký file rồi ghi file với tên UUID vào kho không phục vụ static.
/**
 * Hàm savePrivateBookFile: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: file, category.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, validateBookFile, resolve, mkdir, randomUUID, writeFile, slice.
 */
export const savePrivateBookFile = async (file, category) => {
    // if chỉ chạy nhánh này khi điều kiện !file đúng.
    if (!file) throw new ApiError(400, 'A book file is required');
    // Khai báo extension nhận giá trị từ validateBookFile({ buffer: file.buffer, originalname: f. const giữ biến không gán lại; let cho phép cập nhật.
    const extension = validateBookFile({
        // Trường buffer lưu file.buffer làm giá trị trong object.
        buffer: file.buffer,
        // Trường originalname lưu file.originalname làm giá trị trong object.
        originalname: file.originalname,
        // Trường mimetype lưu file.mimetype làm giá trị trong object.
        mimetype: file.mimetype,
        // Khóa category nhận biến cùng tên làm giá trị.
        category
    });
    // Khai báo storageRoot nhận giá trị từ resolve(process.env.BOOK_STORAGE_DIR || 'private-books'. const giữ biến không gán lại; let cho phép cập nhật.
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await mkdir(storageRoot, { recursive: true })
    await mkdir(storageRoot, { recursive: true });
    // Khai báo fileKey nhận giá trị từ `${randomUUID()}${extension}`. const giữ biến không gán lại; let cho phép cập nhật.
    const fileKey = `${randomUUID()}${extension}`;
    // Khai báo filePath nhận giá trị từ resolve(storageRoot, fileKey). const giữ biến không gán lại; let cho phép cập nhật.
    const filePath = resolve(storageRoot, fileKey);
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 })
    await writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
    // return kết thúc hàm và trả { file_key: fileKey, original_name: file.originalname.slice(0, 200) } về nơi gọi.
    return { file_key: fileKey, original_name: file.originalname.slice(0, 200) };
};

// [IMPORT STREAM] Lưu PDF theo luồng có giới hạn byte, kiểm tra chữ ký/EOF/trang rồi mới công bố khóa file.
/**
 * Hàm savePrivateBookStream: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { stream, originalname, mimetype, catego.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, resolve, mkdir, randomUUID, alloc, Transform, transform, isBuffer.
 */
export const savePrivateBookStream = async ({ stream, originalname, mimetype, category, maxBytes }) => {
    // if chỉ chạy nhánh này khi điều kiện !stream || typeof stream.pipe !== 'function' đúng.
    if (!stream || typeof stream.pipe !== 'function') throw new ApiError(400, 'A readable book stream is required');
    // Khai báo storageRoot nhận giá trị từ resolve(process.env.BOOK_STORAGE_DIR || 'private-books'. const giữ biến không gán lại; let cho phép cập nhật.
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await mkdir(storageRoot, { recursive: true })
    await mkdir(storageRoot, { recursive: true });
    // Khai báo id nhận giá trị từ randomUUID(). const giữ biến không gán lại; let cho phép cập nhật.
    const id = randomUUID();
    // Khai báo temporaryPath nhận giá trị từ resolve(storageRoot, `${id}.part`). const giữ biến không gán lại; let cho phép cập nhật.
    const temporaryPath = resolve(storageRoot, `${id}.part`);
    // Khai báo extension nhận giá trị từ '.pdf'. const giữ biến không gán lại; let cho phép cập nhật.
    const extension = '.pdf';
    // Khai báo fileKey nhận giá trị từ `${id}${extension}`. const giữ biến không gán lại; let cho phép cập nhật.
    const fileKey = `${id}${extension}`;
    // Khai báo filePath nhận giá trị từ resolve(storageRoot, fileKey). const giữ biến không gán lại; let cho phép cập nhật.
    const filePath = resolve(storageRoot, fileKey);
    // Khai báo totalBytes nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
    let totalBytes = 0;
    // Khai báo prefix nhận giá trị từ Buffer.alloc(0). const giữ biến không gán lại; let cho phép cập nhật.
    let prefix = Buffer.alloc(0);
    // Khai báo tail nhận giá trị từ Buffer.alloc(0). const giữ biến không gán lại; let cho phép cập nhật.
    let tail = Buffer.alloc(0);
    // Khai báo pageMarkerFound nhận giá trị từ false. const giữ biến không gán lại; let cho phép cập nhật.
    let pageMarkerFound = false;
    // Khai báo scanTail nhận giá trị từ Buffer.alloc(0). const giữ biến không gán lại; let cho phép cập nhật.
    let scanTail = Buffer.alloc(0);
    // Khai báo inspectAndLimit nhận giá trị từ new Transform({ transform(chunk, encoding, callback) { . const giữ biến không gán lại; let cho phép cập nhật.
    const inspectAndLimit = new Transform({
        /**
         * Hàm transform: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
         * Tham số: chunk, encoding, callback.
         * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
         * Gọi tiếp: isBuffer, from, isFinite, callback, ApiError, concat, subarray, test.
         */
        transform(chunk, encoding, callback) {
            // Khai báo bytes nhận giá trị từ Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc. const giữ biến không gán lại; let cho phép cập nhật.
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
            // Gọi/thực thi biểu thức để thực hiện thao tác: totalBytes += bytes.length
            totalBytes += bytes.length;
            // if chỉ chạy nhánh này khi điều kiện !Number.isFinite(maxBytes) || maxBytes <= 0 || totalBytes > maxBytes đúng.
            if (!Number.isFinite(maxBytes) || maxBytes <= 0 || totalBytes > maxBytes) {
                // return kết thúc hàm và trả callback(new ApiError(413, 'The ebook exceeds the configured size limit')) về nơi gọi.
                return callback(new ApiError(413, 'The ebook exceeds the configured size limit'));
            }
            // if chỉ chạy nhánh này khi điều kiện prefix.length < 4096 đúng.
            if (prefix.length < 4096) prefix = Buffer.concat([prefix, bytes.subarray(0, 4096 - prefix.length)]);
            // Gọi/thực thi Buffer.concat với các đối số để thực hiện thao tác: tail = Buffer.concat([tail, bytes]).subarray(-4096)
            tail = Buffer.concat([tail, bytes]).subarray(-4096);
            // Khai báo scan nhận giá trị từ Buffer.concat([scanTail, bytes]). const giữ biến không gán lại; let cho phép cập nhật.
            const scan = Buffer.concat([scanTail, bytes]);
            // if chỉ chạy nhánh này khi điều kiện /\/Type\s*\/Page\b/.test(scan.toString('latin1')) đúng.
            if (/\/Type\s*\/Page\b/.test(scan.toString('latin1'))) pageMarkerFound = true;
            // Gọi/thực thi scan.subarray với các đối số để thực hiện thao tác: scanTail = scan.subarray(-64)
            scanTail = scan.subarray(-64);
            // return kết thúc hàm và trả callback(null, bytes) về nơi gọi.
            return callback(null, bytes);
        }
    });

    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await pipeline(stream, inspectAndLimit, createWriteStream(temporaryPath, {
        await pipeline(stream, inspectAndLimit, createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }));
        // if chỉ chạy nhánh này khi điều kiện totalBytes < 1024 || prefix.subarray(0, 5).toString('ascii') !== '%PDF-' đúng.
        if (totalBytes < 1024 || prefix.subarray(0, 5).toString('ascii') !== '%PDF-') {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(422, 'The source response is not a non-empty PDF file');
        }
        // if chỉ chạy nhánh này khi điều kiện !pageMarkerFound || !/%%EOF\s*$/.test(tail.toString('latin1')) đúng.
        if (!pageMarkerFound || !/%%EOF\s*$/.test(tail.toString('latin1'))) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(422, 'The PDF is incomplete or has no readable page structure');
        }
        // Gọi/thực thi validateBookFile với các đối số để thực hiện thao tác: validateBookFile({ buffer: prefix, originalname, mimetype, category })
        validateBookFile({ buffer: prefix, originalname, mimetype, category });
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await rename(temporaryPath, filePath)
        await rename(temporaryPath, filePath);
        // return kết thúc hàm và trả { file_key: fileKey, original_name: basename(String(originalname || 'book.p về nơi gọi.
        return { file_key: fileKey, original_name: basename(String(originalname || 'book.pdf')).slice(0, 200), size: totalBytes };
    } catch (error) {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await rm(temporaryPath, { force: true }).catch(() => {})
        await rm(temporaryPath, { force: true }).catch(() => {});
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await rm(filePath, { force: true }).catch(() => {})
        await rm(filePath, { force: true }).catch(() => {});
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
};

/**
 * Hàm imageDimensions: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: buffer, mimetype.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: subarray, equals, from, readUInt32BE, readUInt16BE, includes.
 */
const imageDimensions = (buffer, mimetype) => {
    // if chỉ chạy nhánh này khi điều kiện mimetype === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137,  đúng.
    if (mimetype === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        // return kết thúc hàm và trả { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), extensio về nơi gọi.
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), extension: '.png' };
    }
    // if chỉ chạy nhánh này khi điều kiện mimetype !== 'image/jpeg' || buffer[0] !== 0xff || buffer[1] !== 0xd8 đúng.
    if (mimetype !== 'image/jpeg' || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
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
        // if chỉ chạy nhánh này khi điều kiện [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0x đúng.
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
            // return kết thúc hàm và trả { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offse về nơi gọi.
            return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7), extension: '.jpg' };
        }
        // if chỉ chạy nhánh này khi điều kiện segmentLength < 2 đúng.
        if (segmentLength < 2) break;
        // Gọi/thực thi biểu thức để thực hiện thao tác: offset += segmentLength + 2
        offset += segmentLength + 2;
    }
    // return kết thúc hàm và trả null về nơi gọi.
    return null;
};

// [XÁC MINH BÌA] Kiểm tra signature, MIME, pixel size và tỷ lệ dọc trước khi dùng ảnh làm bìa.
/**
 * Hàm inspectPrivateBookCover: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { buffer, mimetype }.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isBuffer, ApiError, imageDimensions.
 */
export const inspectPrivateBookCover = ({ buffer, mimetype }) => {
    // if chỉ chạy nhánh này khi điều kiện !Buffer.isBuffer(buffer) || buffer.length > 5 * 1024 * 1024 đúng.
    if (!Buffer.isBuffer(buffer) || buffer.length > 5 * 1024 * 1024) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, 'The verified cover image is empty or exceeds 5 MB');
    }
    // Khai báo dimensions nhận giá trị từ imageDimensions(buffer, mimetype). const giữ biến không gán lại; let cho phép cập nhật.
    const dimensions = imageDimensions(buffer, mimetype);
    // if chỉ chạy nhánh này khi điều kiện !dimensions || dimensions.width < 120 || dimensions.height < 160 || dimensi đúng.
    if (!dimensions || dimensions.width < 120 || dimensions.height < 160
        || dimensions.height / dimensions.width < 1.15 || dimensions.height / dimensions.width > 2.2) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, 'The source cover is not a valid portrait JPEG or PNG image');
    }
    // return kết thúc hàm và trả dimensions về nơi gọi.
    return dimensions;
};

// [LƯU BÌA ĐÃ XÁC MINH] Chỉ nhận ảnh đã qua kiểm tra signature, MIME và tỷ lệ bìa sách.
/**
 * Hàm savePrivateBookCover: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { buffer, mimetype }.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: inspectPrivateBookCover, resolve, mkdir, randomUUID, writeFile.
 */
export const savePrivateBookCover = async ({ buffer, mimetype }) => {
    // Khai báo dimensions nhận giá trị từ inspectPrivateBookCover({ buffer, mimetype }). const giữ biến không gán lại; let cho phép cập nhật.
    const dimensions = inspectPrivateBookCover({ buffer, mimetype });
    // Khai báo storageRoot nhận giá trị từ resolve(process.env.BOOK_STORAGE_DIR || 'private-books'. const giữ biến không gán lại; let cho phép cập nhật.
    const storageRoot = resolve(process.env.BOOK_STORAGE_DIR || 'private-books');
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await mkdir(storageRoot, { recursive: true })
    await mkdir(storageRoot, { recursive: true });
    // Khai báo fileKey nhận giá trị từ `cover-${randomUUID()}${dimensions.extension}`. const giữ biến không gán lại; let cho phép cập nhật.
    const fileKey = `cover-${randomUUID()}${dimensions.extension}`;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await writeFile(resolve(storageRoot, fileKey), buffer, { flag: 'wx', mode:
    await writeFile(resolve(storageRoot, fileKey), buffer, { flag: 'wx', mode: 0o600 });
    // return kết thúc hàm và trả { file_key: fileKey, mimetype, width: dimensions.width, height: dimensions. về nơi gọi.
    return { file_key: fileKey, mimetype, width: dimensions.width, height: dimensions.height };
};

// [PHÂN GIẢI FILE] Từ chối path traversal, đường dẫn tuyệt đối và symlink thoát khỏi kho riêng.
/**
 * Hàm resolvePrivateBookFile: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: fileKey.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: realpath, resolve, ApiError, relative, basename, isAbsolute, startsWith, stat.
 */
export const resolvePrivateBookFile = async (fileKey) => {
    // Khai báo root nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let root;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: root = await realpath(resolve(process.env.BOOK_STORAGE_DIR || 'private-book
        root = await realpath(resolve(process.env.BOOK_STORAGE_DIR || 'private-books'));
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.code === 'ENOENT' đúng.
        if (error.code === 'ENOENT') throw new ApiError(404, 'Book file not found');
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // Khai báo candidate nhận giá trị từ resolve(root, fileKey). const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = resolve(root, fileKey);
    // Khai báo pathFromRoot nhận giá trị từ relative(root, candidate). const giữ biến không gán lại; let cho phép cập nhật.
    const pathFromRoot = relative(root, candidate);
    // if chỉ chạy nhánh này khi điều kiện !fileKey || fileKey !== basename(fileKey) || isAbsolute(fileKey) || pathFro đúng.
    if (!fileKey || fileKey !== basename(fileKey) || isAbsolute(fileKey)
        || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Book file not found');
    }
    // Khai báo actualPath nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let actualPath;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: actualPath = await realpath(candidate)
        actualPath = await realpath(candidate);
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.code === 'ENOENT' đúng.
        if (error.code === 'ENOENT') throw new ApiError(404, 'Book file not found');
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
    // Khai báo actualRelativePath nhận giá trị từ relative(root, actualPath). const giữ biến không gán lại; let cho phép cập nhật.
    const actualRelativePath = relative(root, actualPath);
    // if chỉ chạy nhánh này khi điều kiện actualRelativePath.startsWith(`..${sep}`) || actualRelativePath === '..' đúng.
    if (actualRelativePath.startsWith(`..${sep}`) || actualRelativePath === '..') {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(404, 'Book file not found');
    }
    // Khai báo fileStat nhận giá trị từ await stat(actualPath). const giữ biến không gán lại; let cho phép cập nhật.
    const fileStat = await stat(actualPath);
    // if chỉ chạy nhánh này khi điều kiện !fileStat.isFile() đúng.
    if (!fileStat.isFile()) throw new ApiError(404, 'Book file not found');
    // return kết thúc hàm và trả actualPath về nơi gọi.
    return actualPath;
};

// [XÓA FILE RIÊNG TƯ] Dọn file khi sách bị xóa/thay thế; file vắng mặt được xem là đã dọn.
/**
 * Hàm removePrivateBookFile: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: fileKey.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: rm, resolvePrivateBookFile.
 */
export const removePrivateBookFile = async (fileKey) => {
    // if chỉ chạy nhánh này khi điều kiện !fileKey đúng.
    if (!fileKey) return;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await rm(await resolvePrivateBookFile(fileKey))
        await rm(await resolvePrivateBookFile(fileKey));
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện error.statusCode === 404 đúng.
        if (error.statusCode === 404) return;
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
};
