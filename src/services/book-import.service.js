// [IMPORT WIKISOURCE] Tìm tác phẩm tiếng Việt có license rõ ràng, bìa hợp lệ và xuất PDF từ WS Export.
// Import { createHash, randomUUID } từ node:crypto để dùng trong module.
/**
 * Tệp src/services/book-import.service.js: xử lý nghiệp vụ, phối hợp model/tiện ích. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { createHash, randomUUID } from 'node:crypto';
// Import mongoose từ mongoose để dùng trong module.
import mongoose from 'mongoose';
// Import Book từ ../models/book.model.js để dùng trong module.
import Book from '../models/book.model.js';
// Import Chapter từ ../models/chapter.model.js để dùng trong module.
import Chapter from '../models/chapter.model.js';
// Import BookImportJob từ ../models/book-import-job.model.js để dùng trong module.
import BookImportJob from '../models/book-import-job.model.js';
// Import ApiError từ ../utils/api-error.js để dùng trong module.
import ApiError from '../utils/api-error.js';
// Import { createWikisourcePdfStream, findWikisourcePdfFont, wikisourceWikitextToTex từ ../utils/wikisource-pdf.js để dùng trong module.
import { createWikisourcePdfStream, findWikisourcePdfFont, wikisourceWikitextToText } from '../utils/wikisource-pdf.js';
// Import { removePrivateBookFile, savePrivateBookStream } từ ../utils/private-book-storage.js để dùng trong module.
import { removePrivateBookFile, savePrivateBookStream } from '../utils/private-book-storage.js';

// Khai báo WIKI_API nhận giá trị từ 'https:. const giữ biến không gán lại; let cho phép cập nhật.
const WIKI_API = 'https://vi.wikisource.org/w/api.php';
// Khai báo WIKI_ORIGIN nhận giá trị từ 'https:. const giữ biến không gán lại; let cho phép cập nhật.
const WIKI_ORIGIN = 'https://vi.wikisource.org';
// Khai báo MAX_BOOK_BYTES nhận giá trị từ Math.min(100, Math.max(1, Number(process.env.BOOK_IMPOR. const giữ biến không gán lại; let cho phép cập nhật.
const MAX_BOOK_BYTES = Math.min(100, Math.max(1, Number(process.env.BOOK_IMPORT_MAX_MB) || 80)) * 1024 * 1024;
// Khai báo MAX_COVER_BYTES nhận giá trị từ 5 * 1024 * 1024. const giữ biến không gán lại; let cho phép cập nhật.
const MAX_COVER_BYTES = 5 * 1024 * 1024;
/**
 * Hàm getUserAgent: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, test, ApiError.
 */
const getUserAgent = () => {
    // Khai báo configuredUserAgent nhận giá trị từ String(process.env.WIKISOURCE_USER_AGENT || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const configuredUserAgent = String(process.env.WIKISOURCE_USER_AGENT || '').trim();
    // Khai báo contactEmail nhận giá trị từ String(process.env.WIKISOURCE_CONTACT_EMAIL || process.. const giữ biến không gán lại; let cho phép cập nhật.
    const contactEmail = String(process.env.WIKISOURCE_CONTACT_EMAIL || process.env.ADMIN_EMAIL
        || process.env.SMTP_USER || process.env.MAIL_USER || '').trim();
    // Khai báo userAgent nhận giá trị từ configuredUserAgent || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.te. const giữ biến không gán lại; let cho phép cập nhật.
    const userAgent = configuredUserAgent || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
        ? `HarveyBookImport/1.0 (mailto:${contactEmail})` : '');
    // if chỉ chạy nhánh này khi điều kiện !userAgent || !/\((?:https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/i.test(userAgent) đúng.
    if (!userAgent || !/\((?:https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/i.test(userAgent)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Configure WIKISOURCE_USER_AGENT with a project contact URL or email before searching Wikisource');
    }
    // return kết thúc hàm và trả userAgent về nơi gọi.
    return userAgent;
};
/**
 * Hàm sleep: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: milliseconds.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Promise, setTimeout.
 */
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
// Khai báo apiRequestQueue nhận giá trị từ Promise.resolve(). const giữ biến không gán lại; let cho phép cập nhật.
let apiRequestQueue = Promise.resolve();
// Khai báo apiNextAllowedAt nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
let apiNextAllowedAt = 0;
// Khai báo apiCooldownUntil nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
let apiCooldownUntil = 0;
// Khai báo LICENSES nhận giá trị từ new Map([ ['pvcc-việt nam', { name: 'Phạm vi công cộng . const giữ biến không gán lại; let cho phép cập nhật.
const LICENSES = new Map([
    ['pvcc-việt nam', { name: 'Phạm vi công cộng tại Việt Nam', url: 'https://vi.wikisource.org/wiki/Tr%E1%BB%A3_gi%C3%BAp:B%E1%BA%A3n_quy%E1%BB%81n_v%C3%A0_Wikisource', access: 'free' }],
    ['pvcc-cũ', { name: 'Phạm vi công cộng', url: 'https://vi.wikisource.org/wiki/Wikisource:Th%E1%BA%BB_b%E1%BA%A3n_quy%E1%BB%81n', access: 'free' }],
    ['pvcc-phát hành', { name: 'Phạm vi công cộng do chủ sở hữu phát hành', url: 'https://vi.wikisource.org/wiki/Wikisource:Th%E1%BA%BB_b%E1%BA%A3n_quy%E1%BB%81n', access: 'free' }],
    ['pvcc-tác giả-phát hành', { name: 'Phạm vi công cộng do tác giả phát hành', url: 'https://vi.wikisource.org/wiki/Wikisource:Th%E1%BA%BB_b%E1%BA%A3n_quy%E1%BB%81n', access: 'free' }],
    ['pvcc-cpvn', { name: 'Văn bản thuộc phạm vi công cộng theo luật Việt Nam', url: 'https://vi.wikisource.org/wiki/Tr%E1%BB%A3_gi%C3%BAp:B%E1%BA%A3n_quy%E1%BB%81n_v%C3%A0_Wikisource', access: 'free' }],
    ['cc-by-4.0', { name: 'Creative Commons Attribution 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', access: 'free' }],
    ['cc-by-sa-4.0', { name: 'Creative Commons Attribution-ShareAlike 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', access: 'free' }],
    ['cc-zero', { name: 'Creative Commons CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', access: 'free' }]
]);

/**
 * Hàm normalizeText: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, replace, fromCodePoint, parseInt, toLowerCase, slice, trim.
 */
const normalizeText = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code, code[0].toLowerCase() === 'x' ? 16 : 10)))
    .replace(/&#39;|&apos;/gi, "'").replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\[https?:\/\/[^ ]+ ([^\]]+)\]/g, '$1')
    .replace(/'''?([^']+)'''?/g, '$1').replace(/\s+/g, ' ').trim();

/**
 * Hàm unwrapTextTemplates: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: source.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, slice, indexOf, trim, toLocaleLowerCase, includes.
 */
const unwrapTextTemplates = (source) => {
    // Khai báo value nhận giá trị từ String(source || ''). const giữ biến không gán lại; let cho phép cập nhật.
    const value = String(source || '');
    // Khai báo output nhận giá trị từ ''. const giữ biến không gán lại; let cho phép cập nhật.
    let output = '';
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (let index = 0; index < value.length;) {
        // if chỉ chạy nhánh này khi điều kiện value.slice(index, index + 2) !== '{{' đúng.
        if (value.slice(index, index + 2) !== '{{') {
            // Gọi/thực thi biểu thức để thực hiện thao tác: output += value[index++]
            output += value[index++];

            continue;
        }
        // Khai báo depth nhận giá trị từ 1. const giữ biến không gán lại; let cho phép cập nhật.
        let depth = 1;
        // Khai báo end nhận giá trị từ index + 2. const giữ biến không gán lại; let cho phép cập nhật.
        let end = index + 2;
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        while (end < value.length && depth > 0) {
            // if chỉ chạy nhánh này khi điều kiện value.slice(end, end + 2) === '{{' đúng.
            if (value.slice(end, end + 2) === '{{') { depth += 1; end += 2; }
            else if (value.slice(end, end + 2) === '}}') { depth -= 1; end += 2; }
            else end += 1;
        }
        // if chỉ chạy nhánh này khi điều kiện depth !== 0 đúng.
        if (depth !== 0) { index += 2; continue; }
        // Khai báo inner nhận giá trị từ value.slice(index + 2, end - 2). const giữ biến không gán lại; let cho phép cập nhật.
        const inner = value.slice(index + 2, end - 2);
        // Khai báo separator nhận giá trị từ inner.indexOf('|'). const giữ biến không gán lại; let cho phép cập nhật.
        const separator = inner.indexOf('|');
        // Khai báo name nhận giá trị từ (separator < 0 ? inner : inner.slice(0, separator)).tri. const giữ biến không gán lại; let cho phép cập nhật.
        const name = (separator < 0 ? inner : inner.slice(0, separator)).trim().toLocaleLowerCase('vi');
        // if chỉ chạy nhánh này khi điều kiện separator >= 0 && ['văn', 'poem'].includes(name) đúng.
        if (separator >= 0 && ['văn', 'poem'].includes(name)) output += unwrapTextTemplates(inner.slice(separator + 1));
        // Gọi/thực thi biểu thức để thực hiện thao tác: index = end
        index = end;
    }
    // return kết thúc hàm và trả output về nơi gọi.
    return output;
};

/**
 * Hàm compactWikitext: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: wikitext.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, replace, unwrapTextTemplates, normalizeText.
 */
const compactWikitext = (wikitext) => {
    // Khai báo value nhận giá trị từ String(wikitext || '').replace(/<!--([\s\S]*?)-->/g, ' . const giữ biến không gán lại; let cho phép cập nhật.
    let value = String(wikitext || '').replace(/<!--([\s\S]*?)-->/g, ' ')
        .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, ' ')
        .replace(/<ref\b[^/]*\/\s*>/gi, ' ');
    // Gọi/thực thi unwrapTextTemplates với các đối số để thực hiện thao tác: value = unwrapTextTemplates(value)
    value = unwrapTextTemplates(value);
    // return kết thúc hàm và trả normalizeText(value.replace(/\{\|[\s\S]*?\|\}/g, ' ') .replace(/^\s*[=;:*#| về nơi gọi.
    return normalizeText(value.replace(/\{\|[\s\S]*?\|\}/g, ' ')
        .replace(/^\s*[=;:*#|].*$/gm, ' '));
};

/**
 * Hàm isVietnameseText: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, toLocaleLowerCase, match.
 */
const isVietnameseText = (value) => {
    // Khai báo text nhận giá trị từ String(value || '').toLocaleLowerCase('vi'). const giữ biến không gán lại; let cho phép cập nhật.
    const text = String(value || '').toLocaleLowerCase('vi');
    // Khai báo letters nhận giá trị từ text.match(/[\p{L}]/gu) || []. const giữ biến không gán lại; let cho phép cập nhật.
    const letters = text.match(/[\p{L}]/gu) || [];
    // Khai báo accented nhận giá trị từ text.match(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọ. const giữ biến không gán lại; let cho phép cập nhật.
    const accented = text.match(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gu) || [];
    // return kết thúc hàm và trả letters.length >= 1500 && accented.length >= 45 && accented.length / letter về nơi gọi.
    return letters.length >= 1500 && accented.length >= 45 && accented.length / letters.length >= 0.015;
};

/**
 * Hàm resolveWikisourceLicense: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: wikitext, categories mặc định [].
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, matchAll, map, trim, toLocaleLowerCase, replace, includes.
 */
export const resolveWikisourceLicense = (wikitext, categories = []) => {
    // Khai báo templates nhận giá trị từ [...String(wikitext || '').matchAll(/\{\{\s*([^|}\n]+?). const giữ biến không gán lại; let cho phép cập nhật.
    const templates = [...String(wikitext || '').matchAll(/\{\{\s*([^|}\n]+?)\s*(?:\||\}\})/g)]
        .map((match) => match[1].trim().toLocaleLowerCase('vi'));
    // Khai báo categoryNames nhận giá trị từ categories.map((category) => String(category?.title || . const giữ biến không gán lại; let cho phép cập nhật.
    const categoryNames = categories.map((category) => String(category?.title || category || '')
        .replace(/^Thể loại:/i, '').trim().toLocaleLowerCase('vi'));
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const [template, license] of LICENSES) {
        // if chỉ chạy nhánh này khi điều kiện templates.includes(template) || categoryNames.includes(template) đúng.
        if (templates.includes(template) || categoryNames.includes(template)) {
            // return kết thúc hàm và trả { ...license, template, evidence: templates.includes(template) ? 'template' về nơi gọi.
            return { ...license, template, evidence: templates.includes(template) ? 'template' : 'category' };
        }
    }
    // return kết thúc hàm và trả null về nơi gọi.
    return null;
};

/**
 * Hàm assertAllowedUrl: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value, allowedHosts.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: URL, ApiError, includes.
 */
const assertAllowedUrl = (value, allowedHosts) => {
    // Khai báo url nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
    let url;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try { url = new URL(value); } catch { throw new ApiError(502, 'A source returned an invalid URL'); }
    // if chỉ chạy nhánh này khi điều kiện url.protocol !== 'https:' || !allowedHosts.includes(url.hostname) đúng.
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(502, 'A source URL did not match the allowed Wikisource hosts');
    }
    // return kết thúc hàm và trả url về nơi gọi.
    return url;
};

/**
 * Hàm fetchAllowed: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value, allowedHosts, options mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: assertAllowedUrl, getUserAgent, fetch, timeout, ApiError, includes, get, cancel.
 */
const fetchAllowed = async (value, allowedHosts, options = {}) => {
    // Khai báo url nhận giá trị từ assertAllowedUrl(value, allowedHosts). const giữ biến không gán lại; let cho phép cập nhật.
    let url = assertAllowedUrl(value, allowedHosts);
    // Khai báo userAgent nhận giá trị từ getUserAgent(). const giữ biến không gán lại; let cho phép cập nhật.
    const userAgent = getUserAgent();
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (let redirect = 0; redirect <= 4; redirect += 1) {
        // Khai báo response nhận giá trị từ chưa khởi tạo. const giữ biến không gán lại; let cho phép cập nhật.
        let response;
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
        try {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: response = await fetch(url, { ...options, redirect: 'manual', signal: optio
            response = await fetch(url, {
                ...options,
                // Trường redirect lưu 'manual' làm giá trị trong object.
                redirect: 'manual',
                // Trường signal lưu options.signal || AbortSignal.timeout(30000) làm giá trị trong object.
                signal: options.signal || AbortSignal.timeout(30000),
                // Trường headers lưu { 'User-Agent': userAgent, ...(options.headers || {}) } làm giá trị trong object.
                headers: { 'User-Agent': userAgent, ...(options.headers || {}) }
            });
        } catch (error) {
            // if chỉ chạy nhánh này khi điều kiện error.name === 'TimeoutError' || error.name === 'AbortError' đúng.
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(504, 'Wikisource did not respond before the request timed out');
            }
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(502, 'Could not connect to the Wikisource export service');
        }
        // if chỉ chạy nhánh này khi điều kiện [301, 302, 303, 307, 308].includes(response.status) đúng.
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            // Khai báo location nhận giá trị từ response.headers.get('location'). const giữ biến không gán lại; let cho phép cập nhật.
            const location = response.headers.get('location');
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await response.body?.cancel().catch(() => {})
            await response.body?.cancel().catch(() => {});
            // if chỉ chạy nhánh này khi điều kiện !location || redirect === 4 đúng.
            if (!location || redirect === 4) throw new ApiError(502, 'The Wikisource service returned an invalid redirect');
            // Gọi/thực thi assertAllowedUrl với các đối số để thực hiện thao tác: url = assertAllowedUrl(new URL(location, url).toString(), allowedHosts)
            url = assertAllowedUrl(new URL(location, url).toString(), allowedHosts);

            continue;
        }
        // if chỉ chạy nhánh này khi điều kiện response.status === 429 đúng.
        if (response.status === 429) return response;
        // if chỉ chạy nhánh này khi điều kiện response.status >= 500 đúng.
        if (response.status >= 500) {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await response.body?.cancel().catch(() => {})
            await response.body?.cancel().catch(() => {});
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(503, 'The Wikisource service is temporarily unavailable; try again shortly');
        }
        // return kết thúc hàm và trả response về nơi gọi.
        return response;
    }
    // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
    throw new ApiError(502, 'Too many redirects from the Wikisource service');
};

/**
 * Hàm fetchJson: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: url.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: then, async, max, now, sleep, fetchAllowed, URL, timeout.
 */
const fetchJson = async (url) => {
    // Khai báo request nhận giá trị từ apiRequestQueue.then(async () => { const waitUntil = Ma. const giữ biến không gán lại; let cho phép cập nhật.
    const request = apiRequestQueue.then(async () => {
        // Khai báo waitUntil nhận giá trị từ Math.max(apiNextAllowedAt, apiCooldownUntil). const giữ biến không gán lại; let cho phép cập nhật.
        const waitUntil = Math.max(apiNextAllowedAt, apiCooldownUntil);
        // if chỉ chạy nhánh này khi điều kiện waitUntil > Date.now() đúng.
        if (waitUntil > Date.now()) await sleep(waitUntil - Date.now());
        // Gọi/thực thi Date.now với các đối số để thực hiện thao tác: apiNextAllowedAt = Date.now() + 1100
        apiNextAllowedAt = Date.now() + 1100;
        // Khai báo response nhận giá trị từ await fetchAllowed(url, [new URL(WIKI_ORIGIN).hostname]. const giữ biến không gán lại; let cho phép cập nhật.
        const response = await fetchAllowed(url, [new URL(WIKI_ORIGIN).hostname], {
            // Trường headers lưu { Accept: 'application/json' } làm giá trị trong object.
            headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000)
        });
        // if chỉ chạy nhánh này khi điều kiện response.status === 429 đúng.
        if (response.status === 429) {
            // Khai báo retryAfterSeconds nhận giá trị từ Number(response.headers.get('retry-after')) || 5. const giữ biến không gán lại; let cho phép cập nhật.
            const retryAfterSeconds = Number(response.headers.get('retry-after')) || 5;
            // Khai báo retryAfterMs nhận giá trị từ Math.max(5000, Math.min(10 * 60 * 1000, retryAfterSecon. const giữ biến không gán lại; let cho phép cập nhật.
            const retryAfterMs = Math.max(5000, Math.min(10 * 60 * 1000, retryAfterSeconds * 1000));
            // Gọi/thực thi Date.now với các đối số để thực hiện thao tác: apiCooldownUntil = Date.now() + retryAfterMs
            apiCooldownUntil = Date.now() + retryAfterMs;
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await response.body?.cancel().catch(() => {})
            await response.body?.cancel().catch(() => {});
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(503, `Wikisource rate-limited this client; retry in about ${Math.ceil(retryAfterMs / 1000)} seconds`);
        }
        // if chỉ chạy nhánh này khi điều kiện !response.ok đúng.
        if (!response.ok) throw new ApiError(502, `Wikisource API returned HTTP ${response.status}`);
        // if chỉ chạy nhánh này khi điều kiện !response.headers.get('content-type')?.toLowerCase().includes('json') đúng.
        if (!response.headers.get('content-type')?.toLowerCase().includes('json')) {
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw new ApiError(502, 'Wikisource API returned a non-JSON response');
        }
        // return kết thúc hàm và trả response.json() về nơi gọi.
        return response.json();
    });
    // Gọi/thực thi request.catch với các đối số để thực hiện thao tác: apiRequestQueue = request.catch(() => {})
    apiRequestQueue = request.catch(() => {});
    // return kết thúc hàm và trả request về nơi gọi.
    return request;
};

/**
 * Hàm readResponseLimited: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: response, maxBytes.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, getReader, read, cancel, push, from, concat, releaseLock.
 */
const readResponseLimited = async (response, maxBytes) => {
    // if chỉ chạy nhánh này khi điều kiện !response.body đúng.
    if (!response.body) throw new ApiError(422, 'The source response has no body');
    // Khai báo reader nhận giá trị từ response.body.getReader(). const giữ biến không gán lại; let cho phép cập nhật.
    const reader = response.body.getReader();
    // Khai báo chunks nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const chunks = [];
    // Khai báo totalBytes nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
    let totalBytes = 0;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        while (true) {
            // Khai báo { done, value } nhận giá trị từ await reader.read(). const giữ biến không gán lại; let cho phép cập nhật.
            const { done, value } = await reader.read();
            // if chỉ chạy nhánh này khi điều kiện done đúng.
            if (done) break;
            // Gọi/thực thi biểu thức để thực hiện thao tác: totalBytes += value.byteLength
            totalBytes += value.byteLength;
            // if chỉ chạy nhánh này khi điều kiện totalBytes > maxBytes đúng.
            if (totalBytes > maxBytes) {
                // await chờ tác vụ bất đồng bộ xong trước bước sau: await reader.cancel().catch(() => {})
                await reader.cancel().catch(() => {});
                // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
                throw new ApiError(413, 'The source image exceeds the 5 MB limit');
            }
            // Gọi/thực thi chunks.push với các đối số để thực hiện thao tác: chunks.push(Buffer.from(value))
            chunks.push(Buffer.from(value));
        }
        // return kết thúc hàm và trả Buffer.concat(chunks, totalBytes) về nơi gọi.
        return Buffer.concat(chunks, totalBytes);
    } finally {
        // Gọi/thực thi reader.releaseLock với các đối số để thực hiện thao tác: reader.releaseLock()
        reader.releaseLock();
    }
};

/**
 * Hàm getCandidateDetails: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: pageTitle, { minimumCharacters = 5000 } mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: URLSearchParams, fetchJson, resolveWikisourceLicense, compactWikitext, match, normalizeText, replace, trim.
 */
const getCandidateDetails = async (pageTitle, { minimumCharacters = 5000 } = {}) => {
    // Khai báo params nhận giá trị từ new URLSearchParams({ action: 'query', prop: 'info|cate. const giữ biến không gán lại; let cho phép cập nhật.
    const params = new URLSearchParams({
        // Trường action lưu 'query' làm giá trị trong object.
        action: 'query', prop: 'info|categories|pageimages|revisions|links', inprop: 'url',
        // Trường cllimit lưu 'max' làm giá trị trong object.
        cllimit: 'max', plnamespace: '0', pllimit: 'max', piprop: 'name|thumbnail', pithumbsize: '600',
        // Trường rvprop lưu 'content' làm giá trị trong object.
        rvprop: 'content', rvslots: 'main', titles: pageTitle, format: 'json', formatversion: '2'
    });
    // Khai báo payload nhận giá trị từ await fetchJson(`${WIKI_API}?${params}`). const giữ biến không gán lại; let cho phép cập nhật.
    const payload = await fetchJson(`${WIKI_API}?${params}`);
    // Khai báo page nhận giá trị từ payload?.query?.pages?.[0]. const giữ biến không gán lại; let cho phép cập nhật.
    const page = payload?.query?.pages?.[0];
    // if chỉ chạy nhánh này khi điều kiện !page || page.missing || page.invalid || page.ns !== 0 đúng.
    if (!page || page.missing || page.invalid || page.ns !== 0) return null;
    // Khai báo wikitext nhận giá trị từ page.revisions?.[0]?.slots?.main?.content || ''. const giữ biến không gán lại; let cho phép cập nhật.
    const wikitext = page.revisions?.[0]?.slots?.main?.content || '';
    // Khai báo license nhận giá trị từ resolveWikisourceLicense(wikitext, page.categories). const giữ biến không gán lại; let cho phép cập nhật.
    let license = resolveWikisourceLicense(wikitext, page.categories);
    // Khai báo readableContent nhận giá trị từ wikitext. const giữ biến không gán lại; let cho phép cập nhật.
    let readableContent = wikitext;
    // Khai báo bodyText nhận giá trị từ compactWikitext(wikitext). const giữ biến không gán lại; let cho phép cập nhật.
    let bodyText = compactWikitext(wikitext);
    // Khai báo authorParameter nhận giá trị từ wikitext.match(/(?:ghi đè tác giả|Tác giả|Author)[ \t]*. const giữ biến không gán lại; let cho phép cập nhật.
    const authorParameter = wikitext.match(/(?:ghi đè tác giả|Tác giả|Author)[ \t]*=[ \t]*([^\r\n]*)/i)?.[1] || '';
    // Khai báo author nhận giá trị từ normalizeText(authorParameter .replace(/\[\[([^\]|]+)\|. const giữ biến không gán lại; let cho phép cập nhật.
    const author = normalizeText(authorParameter
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\{\{[^{}]*\}\}/g, ' ')
        .replace(/^\s*\|?\s*ghi đè tác giả\s*=\s*/i, '')
        .replace(/^\s*của\s+/i, '')
        .replace(/\s*\}\}\s*$/, '').trim());
    // Khai báo translator nhận giá trị từ normalizeText(wikitext.match(/(?:dịch giả|translator)[ . const giữ biến không gán lại; let cho phép cập nhật.
    const translator = normalizeText(wikitext.match(/(?:dịch giả|translator)[ \t]*=[ \t]*([^\r\n]*)/i)?.[1]
        ?.replace(/\s*\}\}\s*$/, '').trim() || '');
    // Some Wikisource volumes carry only a US term template on the work page.
    // Accept a Vietnam-PD author-page record only when the named author page itself
    // is tagged PVCC-Việt Nam, gives a death year whose 50-year term has expired,
    // and explicitly lists this exact title outside its translated-works section.
    // if chỉ chạy nhánh này khi điều kiện !license && author && !translator && !author.includes(',') đúng.
    if (!license && author && !translator && !author.includes(',')) {
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
        try {
            // Khai báo authorParams nhận giá trị từ new URLSearchParams({ action: 'query', prop: 'categorie. const giữ biến không gán lại; let cho phép cập nhật.
            const authorParams = new URLSearchParams({
                // Trường action lưu 'query' làm giá trị trong object.
                action: 'query', prop: 'categories|revisions', cllimit: 'max',
                // Trường rvprop lưu 'content' làm giá trị trong object.
                rvprop: 'content', rvslots: 'main', titles: `Tác gia:${author}`,
                // Trường format lưu 'json' làm giá trị trong object.
                format: 'json', formatversion: '2'
            });
            // Khai báo authorPayload nhận giá trị từ await fetchJson(`${WIKI_API}?${authorParams}`). const giữ biến không gán lại; let cho phép cập nhật.
            const authorPayload = await fetchJson(`${WIKI_API}?${authorParams}`);
            // Khai báo authorPage nhận giá trị từ authorPayload?.query?.pages?.[0]. const giữ biến không gán lại; let cho phép cập nhật.
            const authorPage = authorPayload?.query?.pages?.[0];
            // Khai báo authorWikitext nhận giá trị từ authorPage?.revisions?.[0]?.slots?.main?.content || ''. const giữ biến không gán lại; let cho phép cập nhật.
            const authorWikitext = authorPage?.revisions?.[0]?.slots?.main?.content || '';
            // Khai báo authorLicense nhận giá trị từ resolveWikisourceLicense('', authorPage?.categories || . const giữ biến không gán lại; let cho phép cập nhật.
            const authorLicense = resolveWikisourceLicense('', authorPage?.categories || []);
            // Khai báo deathYear nhận giá trị từ (authorPage?.categories || []).map((item) => String(ite. const giữ biến không gán lại; let cho phép cập nhật.
            const deathYear = (authorPage?.categories || []).map((item) =>
                String(item.title || '').match(/^Thể loại:Mất\s+(\d{4})$/i)?.[1])
                .filter(Boolean).map(Number).sort((a, b) => b - a)[0];
            // Khai báo translatedSectionAt nhận giá trị từ authorWikitext.search(/^==+\s*Tác phẩm dịch\s*==+\s*$/i. const giữ biến không gán lại; let cho phép cập nhật.
            const translatedSectionAt = authorWikitext.search(/^==+\s*Tác phẩm dịch\s*==+\s*$/im);
            // Khai báo ownWorksText nhận giá trị từ translatedSectionAt < 0 ? authorWikitext : authorWikite. const giữ biến không gán lại; let cho phép cập nhật.
            const ownWorksText = translatedSectionAt < 0 ? authorWikitext : authorWikitext.slice(0, translatedSectionAt);
            /**
             * Hàm normalizePageTitle: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
             * Tham số: value.
             * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
             * Gọi tiếp: normalizeText, String, replace, toLocaleLowerCase, trim.
             */
            const normalizePageTitle = (value) => normalizeText(String(value || '').replace(/_/g, ' '))
                .toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
            // Khai báo listedWorks nhận giá trị từ [...ownWorksText.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?. const giữ biến không gán lại; let cho phép cập nhật.
            const listedWorks = [...ownWorksText.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
                .map((match) => match[1].split('#')[0].replace(/^(?:vi:)?/i, '').trim());
            // Khai báo titleListedByAuthor nhận giá trị từ listedWorks.some((listedTitle) => normalizePageTitle(li. const giữ biến không gán lại; let cho phép cập nhật.
            const titleListedByAuthor = listedWorks.some((listedTitle) =>
                normalizePageTitle(listedTitle) === normalizePageTitle(page.title));
            // if chỉ chạy nhánh này khi điều kiện authorLicense?.template === 'pvcc-việt nam' && deathYear && deathYear <= 19 đúng.
            if (authorLicense?.template === 'pvcc-việt nam' && deathYear && deathYear <= 1975 && titleListedByAuthor) {
                // Gọi/thực thi biểu thức để thực hiện thao tác: license = { ...authorLicense, evidence: `author-page:${authorPage.title};de
                license = {
                    ...authorLicense,
                    // Trường evidence lưu `author-page:${authorPage.title};death-year:${deathYear làm giá trị trong object.
                    evidence: `author-page:${authorPage.title};death-year:${deathYear};title-listed:true`
                };
            }
        } catch (error) {
            // Gọi/thực thi console.warn với các đối số để thực hiện thao tác: console.warn(`Wikisource author-rights check failed for ${page.title}: ${er
            console.warn(`Wikisource author-rights check failed for ${page.title}: ${error.message}`);
        }
    }
    // Khai báo reasons nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const reasons = [];
    // Khai báo title nhận giá trị từ normalizeText(page.title.replace(/_/g, ' ')). const giữ biến không gán lại; let cho phép cập nhật.
    const title = normalizeText(page.title.replace(/_/g, ' '));

    // Root pages often contain transclusion templates. Use MediaWiki's rendered page when raw wikitext is only a short index.
    // Some Wikisource scans store hundreds of pages in <pages> transclusion tags.
    // Raw wikitext can look non-empty but contain only title/TOC text; render these
    // pages before deciding the source is complete.
    // if chỉ chạy nhánh này khi điều kiện bodyText.length < 50000 && page.pageid đúng.
    if (bodyText.length < 50000 && page.pageid) {
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
        try {
            // Khai báo parseParams nhận giá trị từ new URLSearchParams({ action: 'parse', pageid: String(p. const giữ biến không gán lại; let cho phép cập nhật.
            const parseParams = new URLSearchParams({
                // Trường action lưu 'parse' làm giá trị trong object.
                action: 'parse', pageid: String(page.pageid), prop: 'text', format: 'json', formatversion: '2'
            });
            // Khai báo parsed nhận giá trị từ await fetchJson(`${WIKI_API}?${parseParams}`). const giữ biến không gán lại; let cho phép cập nhật.
            const parsed = await fetchJson(`${WIKI_API}?${parseParams}`);
            // Khai báo html nhận giá trị từ parsed?.parse?.text || ''. const giữ biến không gán lại; let cho phép cập nhật.
            const html = parsed?.parse?.text || '';
            // Khai báo renderedText nhận giá trị từ normalizeText(html .replace(/<br\s*\/?\s*>/gi, '\n') .r. const giữ biến không gán lại; let cho phép cập nhật.
            const renderedText = normalizeText(html
                .replace(/<br\s*\/?\s*>/gi, '\n')
                .replace(/<\/(?:p|div|li|h[1-6]|poem)\s*>/gi, '\n')
                .replace(/<[^>]*>/g, ' '));
            // if chỉ chạy nhánh này khi điều kiện renderedText.length > bodyText.length đúng.
            if (renderedText.length > bodyText.length) {
                // Gọi/thực thi biểu thức để thực hiện thao tác: bodyText = renderedText
                bodyText = renderedText;
                // Gọi/thực thi biểu thức để thực hiện thao tác: readableContent = html
                readableContent = html;
            }
        } catch (error) {
            // Gọi/thực thi console.warn với các đối số để thực hiện thao tác: console.warn(`Wikisource rendered-text check failed for ${page.title}: ${er
            console.warn(`Wikisource rendered-text check failed for ${page.title}: ${error.message}`);
        }
    }

    // Wikisource book landing pages often contain only a table of contents; fetch their linked chapter subpages.
    // if chỉ chạy nhánh này khi điều kiện bodyText.length < 5000 đúng.
    if (bodyText.length < 5000) {
        // Khai báo prefix nhận giá trị từ `${page.title}/`. const giữ biến không gán lại; let cho phép cập nhật.
        const prefix = `${page.title}/`;
        // Khai báo linkedTitles nhận giá trị từ [...new Set((page.links || []).map((link) => link.title. const giữ biến không gán lại; let cho phép cập nhật.
        const linkedTitles = [...new Set((page.links || []).map((link) => link.title)
            .filter((linkedTitle) => typeof linkedTitle === 'string' && linkedTitle.startsWith(prefix)))].slice(0, 40);
        // if chỉ chạy nhánh này khi điều kiện linkedTitles.length đúng.
        if (linkedTitles.length) {
            // Khai báo chapterParams nhận giá trị từ new URLSearchParams({ action: 'query', prop: 'revisions. const giữ biến không gán lại; let cho phép cập nhật.
            const chapterParams = new URLSearchParams({
                // Trường action lưu 'query' làm giá trị trong object.
                action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main',
                // Trường titles lưu linkedTitles.join('|') làm giá trị trong object.
                titles: linkedTitles.join('|'), format: 'json', formatversion: '2'
            });
            // Khai báo chapterPayload nhận giá trị từ await fetchJson(`${WIKI_API}?${chapterParams}`). const giữ biến không gán lại; let cho phép cập nhật.
            const chapterPayload = await fetchJson(`${WIKI_API}?${chapterParams}`);
            // Khai báo chapterPages nhận giá trị từ (chapterPayload?.query?.pages || []).filter((chapterPag. const giữ biến không gán lại; let cho phép cập nhật.
            const chapterPages = (chapterPayload?.query?.pages || []).filter((chapterPage) => !chapterPage.missing)
                .map((chapterPage) => ({
                    // Trường title lưu chapterPage.title làm giá trị trong object.
                    title: chapterPage.title,
                    // Trường content lưu chapterPage.revisions?.[0]?.slots?.main?.content || '' làm giá trị trong object.
                    content: chapterPage.revisions?.[0]?.slots?.main?.content || ''
                })).filter((chapterPage) => chapterPage.content.trim());
            // if chỉ chạy nhánh này khi điều kiện chapterPages.length đúng.
            if (chapterPages.length) {
                // Gọi/thực thi chapterPages.map với các đối số để thực hiện thao tác: readableContent = chapterPages.map((chapterPage) => { const chapterTitle =
                readableContent = chapterPages.map((chapterPage) => {
                    // Khai báo chapterTitle nhận giá trị từ normalizeText(chapterPage.title.slice(prefix.length).re. const giữ biến không gán lại; let cho phép cập nhật.
                    const chapterTitle = normalizeText(chapterPage.title.slice(prefix.length).replace(/_/g, ' '));
                    // return kết thúc hàm và trả `== ${chapterTitle} ==\n${chapterPage.content}` về nơi gọi.
                    return `== ${chapterTitle} ==\n${chapterPage.content}`;
                }).join('\n\n');
                // Gọi/thực thi compactWikitext với các đối số để thực hiện thao tác: bodyText = compactWikitext(readableContent)
                bodyText = compactWikitext(readableContent);
            }
        }
    }

    // if chỉ chạy nhánh này khi điều kiện !license đúng.
    if (!license) reasons.push('Trang nguồn không có license thuộc danh sách được hỗ trợ');
    // if chỉ chạy nhánh này khi điều kiện !author || author.length > 120 đúng.
    if (!author || author.length > 120) reasons.push('Không xác định được tác giả từ trang nguồn');
    // if chỉ chạy nhánh này khi điều kiện !isVietnameseText(bodyText) đúng.
    if (!isVietnameseText(bodyText)) reasons.push('Nội dung trích xuất chưa đủ bằng chứng là tiếng Việt đầy đủ');
    // if chỉ chạy nhánh này khi điều kiện bodyText.length < minimumCharacters đúng.
    if (bodyText.length < minimumCharacters) reasons.push('Văn bản quá ngắn để coi là một cuốn sách đầy đủ');
    // if chỉ chạy nhánh này khi điều kiện /vi phạm bản quyền|vpbq|thiếu giấy phép/i.test(wikitext) đúng.
    if (/vi phạm bản quyền|vpbq|thiếu giấy phép/i.test(wikitext)) reasons.push('Trang có cảnh báo quyền hoặc thiếu giấy phép');

    // Khai báo translatorIsContested nhận giá trị từ /dịch giả\s*=\s*[^|}\n]+/i.test(wikitext) && /hiện nay . const giữ biến không gán lại; let cho phép cập nhật.
    const translatorIsContested = /dịch giả\s*=\s*[^|}\n]+/i.test(wikitext)
        && /hiện nay có ý kiến cho là|vẫn còn tranh luận|chưa thống nhất về (?:tác giả|người dịch)/i.test(wikitext);
    // if chỉ chạy nhánh này khi điều kiện translatorIsContested đúng.
    if (translatorIsContested) reasons.push('Nguồn ghi nhận attribution người dịch còn tranh luận; không đủ điều kiện xác minh bản dịch');

    // if chỉ chạy nhánh này khi điều kiện !title || title.length > 200 đúng.
    if (!title || title.length > 200) reasons.push('Tiêu đề không hợp lệ hoặc vượt giới hạn lưu trữ');
    // if chỉ chạy nhánh này khi điều kiện !page.fullurl || !page.fullurl.startsWith(`${WIKI_ORIGIN}/wiki/`) đúng.
    if (!page.fullurl || !page.fullurl.startsWith(`${WIKI_ORIGIN}/wiki/`)) reasons.push('Không xác minh được URL nguồn Wikisource');
    // Khai báo publicationYear nhận giá trị từ Number(wikitext.match(/(?:Năm|Năm xuất bản|Năm sáng tác. const giữ biến không gán lại; let cho phép cập nhật.
    const publicationYear = Number(wikitext.match(/(?:Năm|Năm xuất bản|Năm sáng tác)\s*=\s*(\d{4})/i)?.[1]) || null;
    // Khai báo summary nhận giá trị từ bodyText.slice(0, 700). const giữ biến không gán lại; let cho phép cập nhật.
    const summary = bodyText.slice(0, 700);
    // return kết thúc hàm và trả { id: page.title, title, author, translator, summary, source: 'Wikisource t về nơi gọi.
    return {
        // Trường id lưu page.title làm giá trị trong object.
        id: page.title,
        // Khóa title nhận biến cùng tên làm giá trị.
        title,
        // Khóa author nhận biến cùng tên làm giá trị.
        author,
        // Khóa translator nhận biến cùng tên làm giá trị.
        translator,
        // Khóa summary nhận biến cùng tên làm giá trị.
        summary,
        // Trường source lưu 'Wikisource tiếng Việt' làm giá trị trong object.
        source: 'Wikisource tiếng Việt',
        // Trường sourceUrl lưu page.fullurl làm giá trị trong object.
        sourceUrl: page.fullurl,
        // Trường language lưu 'vi' làm giá trị trong object.
        language: 'vi',
        // Trường format lưu 'PDF' làm giá trị trong object.
        format: 'PDF',
        // Trường license lưu license?.name || '' làm giá trị trong object.
        license: license?.name || '',
        // Trường licenseUrl lưu license?.url || '' làm giá trị trong object.
        licenseUrl: license?.url || '',
        // Trường coverUrl lưu '' làm giá trị trong object.
        coverUrl: '',
        // Trường coverVerified lưu false làm giá trị trong object.
        coverVerified: false,
        // Trường coverLicense lưu '' làm giá trị trong object.
        coverLicense: '',
        // Trường coverLicenseUrl lưu '' làm giá trị trong object.
        coverLicenseUrl: '',
        // Trường coverSourceUrl lưu '' làm giá trị trong object.
        coverSourceUrl: '',
        // Trường coverAttribution lưu '' làm giá trị trong object.
        coverAttribution: '',
        // Trường coverWidth lưu null làm giá trị trong object.
        coverWidth: null,
        // Trường coverHeight lưu null làm giá trị trong object.
        coverHeight: null,
        // Trường contentCharacters lưu bodyText.length làm giá trị trong object.
        contentCharacters: bodyText.length,
        // Trường publicationYear lưu publicationYear && publicationYear >= 1000 && publicati làm giá trị trong object.
        publicationYear: publicationYear && publicationYear >= 1000 && publicationYear <= new Date().getFullYear() ? publicationYear : null,
        // Trường eligible lưu reasons.length === 0 làm giá trị trong object.
        eligible: reasons.length === 0,
        // Khóa reasons nhận biến cùng tên làm giá trị.
        reasons,
        // Trường _license lưu license làm giá trị trong object.
        _license: license,
        // Trường _wikitext lưu readableContent làm giá trị trong object.
        _wikitext: readableContent,
        // Trường _cover lưu null làm giá trị trong object.
        _cover: null
    };
};

/**
 * Hàm mapWithConcurrency: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: items, concurrency, mapper.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: Array, all, from, min, async, mapper.
 */
const mapWithConcurrency = async (items, concurrency, mapper) => {
    // Khai báo results nhận giá trị từ new Array(items.length). const giữ biến không gán lại; let cho phép cập nhật.
    const results = new Array(items.length);
    // Khai báo cursor nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
    let cursor = 0;
    // await chờ tác vụ bất đồng bộ xong trước bước sau: await Promise.all(Array.from({ length: Math.min(concurrency, items.length)
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        while (cursor < items.length) {
            // Khai báo index nhận giá trị từ cursor++. const giữ biến không gán lại; let cho phép cập nhật.
            const index = cursor++;
            // await chờ tác vụ bất đồng bộ xong trước bước sau: results[index] = await mapper(items[index], index)
            results[index] = await mapper(items[index], index);
        }
    }));
    // return kết thúc hàm và trả results về nơi gọi.
    return results;
};

// [TÌM KIẾM NGUỒN] API MediaWiki chính thức; chỉ trả ứng viên có metadata, nội dung, quyền và bìa đạt yêu cầu.
/**
 * Hàm searchWikisourceBooks: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: query, { minimumCharacters = 5000 } mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, slice, ApiError, URLSearchParams, fetchJson, mapWithConcurrency, async.
 */
export const searchWikisourceBooks = async (query, { minimumCharacters = 5000 } = {}) => {
    // Khai báo normalizedQuery nhận giá trị từ String(query || '').trim().slice(0, 120). const giữ biến không gán lại; let cho phép cập nhật.
    const normalizedQuery = String(query || '').trim().slice(0, 120);
    // if chỉ chạy nhánh này khi điều kiện normalizedQuery.length < 2 đúng.
    if (normalizedQuery.length < 2) throw new ApiError(400, 'Nhập ít nhất 2 ký tự để tìm sách');
    // Khai báo params nhận giá trị từ new URLSearchParams({ action: 'query', list: 'search', . const giữ biến không gán lại; let cho phép cập nhật.
    const params = new URLSearchParams({
        // Trường action lưu 'query' làm giá trị trong object.
        action: 'query', list: 'search', srnamespace: '0', srlimit: '8',
        // Trường srsearch lưu normalizedQuery làm giá trị trong object.
        srsearch: normalizedQuery, format: 'json', formatversion: '2'
    });
    // Khai báo response nhận giá trị từ await fetchJson(`${WIKI_API}?${params}`). const giữ biến không gán lại; let cho phép cập nhật.
    const response = await fetchJson(`${WIKI_API}?${params}`);
    // Khai báo results nhận giá trị từ response?.query?.search || []. const giữ biến không gán lại; let cho phép cập nhật.
    const results = response?.query?.search || [];
    // MediaWiki rate-limits anonymous clients; keep source metadata requests gentle and predictable.
    // Khai báo examined nhận giá trị từ await mapWithConcurrency(results, 2, async (result) => . const giữ biến không gán lại; let cho phép cập nhật.
    const examined = await mapWithConcurrency(results, 2, async (result) => {
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
        try {
            // Khai báo candidate nhận giá trị từ await getCandidateDetails(result.title, { minimumCharac. const giữ biến không gán lại; let cho phép cập nhật.
            const candidate = await getCandidateDetails(result.title, { minimumCharacters });
            // if chỉ chạy nhánh này khi điều kiện !candidate đúng.
            if (!candidate) return null;
            // if chỉ chạy nhánh này khi điều kiện candidate.eligible đúng.
            if (candidate.eligible) {
                // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
                try {
                    // Gọi/thực thi findWikisourcePdfFont với các đối số để thực hiện thao tác: findWikisourcePdfFont()
                    findWikisourcePdfFont();
                    // Gọi/thực thi biểu thức để thực hiện thao tác: candidate.exportAvailable = true
                    candidate.exportAvailable = true;
                } catch (error) {
                    // Gọi/thực thi biểu thức để thực hiện thao tác: candidate.eligible = false
                    candidate.eligible = false;
                    // Gọi/thực thi biểu thức để thực hiện thao tác: candidate.exportAvailable = false
                    candidate.exportAvailable = false;
                    // Gọi/thực thi candidate.reasons.push với các đối số để thực hiện thao tác: candidate.reasons.push(error.message)
                    candidate.reasons.push(error.message);
                }
            }
            // return kết thúc hàm và trả candidate về nơi gọi.
            return candidate;
        } catch (error) {
            // return kết thúc hàm và trả { id: result.title, title: result.title, eligible: false, reasons: [error i về nơi gọi.
            return {
                // Trường id lưu result.title làm giá trị trong object.
                id: result.title,
                // Trường title lưu result.title làm giá trị trong object.
                title: result.title,
                // Trường eligible lưu false làm giá trị trong object.
                eligible: false,
                // Trường reasons lưu [error instanceof ApiError ? error.message : 'Không thể làm giá trị trong object.
                reasons: [error instanceof ApiError ? error.message : 'Không thể xác minh đầy đủ trang nguồn lúc này']
            };
        }
    });
    // Khai báo candidates nhận giá trị từ examined.filter(Boolean). const giữ biến không gán lại; let cho phép cập nhật.
    const candidates = examined.filter(Boolean);
    // Khai báo eligible nhận giá trị từ candidates.filter((item) => item.eligible).map(({ _lice. const giữ biến không gán lại; let cho phép cập nhật.
    const eligible = candidates.filter((item) => item.eligible).map(({ _license, _wikitext, _cover, ...item }) => item);
    // Khai báo reasonCounts nhận giá trị từ {}. const giữ biến không gán lại; let cho phép cập nhật.
    const reasonCounts = {};
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const candidate of candidates) {
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        for (const reason of candidate.reasons || []) reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
    // return kết thúc hàm và trả { query: normalizedQuery, found: results.length, checked: candidates.length về nơi gọi.
    return {
        // Trường query lưu normalizedQuery làm giá trị trong object.
        query: normalizedQuery,
        // Trường found lưu results.length làm giá trị trong object.
        found: results.length,
        // Trường checked lưu candidates.length làm giá trị trong object.
        checked: candidates.length,
        // Trường eligible lưu eligible.length làm giá trị trong object.
        eligible: eligible.length,
        // Trường excluded lưu Math.max(0, results.length - eligible.length) làm giá trị trong object.
        excluded: Math.max(0, results.length - eligible.length),
        // Trường exclusions lưu Object.entries(reasonCounts).map(([reason, count]) => ( làm giá trị trong object.
        exclusions: Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count })),
        // Trường excludedCandidates lưu candidates.filter((item) => !item.eligible) .map(({ id, làm giá trị trong object.
        excludedCandidates: candidates.filter((item) => !item.eligible)
            .map(({ id, title, reasons }) => ({ id, title, reasons })),
        // Trường candidates lưu eligible làm giá trị trong object.
        candidates: eligible
    };
};

/**
 * Hàm titleKey: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, normalize, replace, toLocaleLowerCase, trim.
 */
const titleKey = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

/**
 * Hàm claimImportJob: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: candidate.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: titleKey, createHash, update, digest, Date, findById, select, lean.
 */
const claimImportJob = async (candidate) => {
    // Khai báo canonicalId nhận giá trị từ `vi:${titleKey(candidate.title)}::${titleKey(candidate.. const giữ biến không gán lại; let cho phép cập nhật.
    const canonicalId = `vi:${titleKey(candidate.title)}::${titleKey(candidate.author)}`;
    // Khai báo jobId nhận giá trị từ `wikisource:${createHash('sha256').update(canonicalId).. const giữ biến không gán lại; let cho phép cập nhật.
    const jobId = `wikisource:${createHash('sha256').update(canonicalId).digest('hex')}`;
    // Khai báo now nhận giá trị từ new Date(). const giữ biến không gán lại; let cho phép cập nhật.
    const now = new Date();
    // Khai báo existing nhận giá trị từ await BookImportJob.findById(jobId).select('+lock_token. const giữ biến không gán lại; let cho phép cập nhật.
    const existing = await BookImportJob.findById(jobId).select('+lock_token').lean();
    // if chỉ chạy nhánh này khi điều kiện existing?.status === 'imported' đúng.
    if (existing?.status === 'imported') {
        // return kết thúc hàm và trả { completed: true, jobId, bookId: existing.book_id } về nơi gọi.
        return { completed: true, jobId, bookId: existing.book_id };
    }
    // if chỉ chạy nhánh này khi điều kiện existing?.status === 'duplicate' đúng.
    if (existing?.status === 'duplicate') {
        // return kết thúc hàm và trả { duplicate: true, jobId, bookId: existing.book_id } về nơi gọi.
        return { duplicate: true, jobId, bookId: existing.book_id };
    }
    // if chỉ chạy nhánh này khi điều kiện existing?.status === 'importing' && existing.lease_expires_at > now đúng.
    if (existing?.status === 'importing' && existing.lease_expires_at > now) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(409, 'Tác phẩm này đang được một tác vụ khác import');
    }
    // Khai báo lockToken nhận giá trị từ randomUUID(). const giữ biến không gán lại; let cho phép cập nhật.
    const lockToken = randomUUID();
    // Khai báo leaseExpiresAt nhận giá trị từ new Date(now.getTime() + 5 * 60 * 1000). const giữ biến không gán lại; let cho phép cập nhật.
    const leaseExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    // if chỉ chạy nhánh này khi điều kiện !existing đúng.
    if (!existing) {
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
        try {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await BookImportJob.create({ _id: jobId, source: 'wikisource', source_id: c
            await BookImportJob.create({ _id: jobId, source: 'wikisource', source_id: candidate.id,
                // Trường status lưu 'importing' làm giá trị trong object.
                status: 'importing', lock_token: lockToken, lease_expires_at: leaseExpiresAt, attempts: 1 });
            // return kết thúc hàm và trả { jobId, lockToken } về nơi gọi.
            return { jobId, lockToken };
        } catch (error) {
            // if chỉ chạy nhánh này khi điều kiện error.code === 11000 đúng.
            if (error.code === 11000) throw new ApiError(409, 'Tác phẩm này vừa được một tác vụ khác bắt đầu import');
            // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
            throw error;
        }
    }
    // Khai báo updated nhận giá trị từ await BookImportJob.updateOne({ _id: jobId, $or: [{ sta. const giữ biến không gán lại; let cho phép cập nhật.
    const updated = await BookImportJob.updateOne({
        // Trường _id lưu jobId làm giá trị trong object.
        _id: jobId,
        // Trường $or lưu [{ status: 'failed' }, { status: 'importing', lease_exp làm giá trị trong object.
        $or: [{ status: 'failed' }, { status: 'importing', lease_expires_at: { $lte: now } }]
    }, { $set: { status: 'importing', lock_token: lockToken, lease_expires_at: leaseExpiresAt,
        // Trường last_error lưu null làm giá trị trong object.
        last_error: null, source_id: candidate.id }, $inc: { attempts: 1 } });
    // if chỉ chạy nhánh này khi điều kiện updated.modifiedCount !== 1 đúng.
    if (updated.modifiedCount !== 1) throw new ApiError(409, 'Tác phẩm này vừa được một tác vụ khác bắt đầu import');
    // return kết thúc hàm và trả { jobId, lockToken } về nơi gọi.
    return { jobId, lockToken };
};

/**
 * Hàm findExistingBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: candidate.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findOne, select, lean, RegExp, replace.
 */
const findExistingBook = async (candidate) => {
    // Khai báo existingBySource nhận giá trị từ await Book.findOne({ import_source: 'wikisource', sourc. const giữ biến không gán lại; let cho phép cập nhật.
    const existingBySource = await Book.findOne({ import_source: 'wikisource', source_id: candidate.id }).select('_id title').lean();
    // if chỉ chạy nhánh này khi điều kiện existingBySource đúng.
    if (existingBySource) return existingBySource;
    // Khai báo titlePattern nhận giá trị từ new RegExp(`^${candidate.title.replace(/[.*+?^${}()|[\]. const giữ biến không gán lại; let cho phép cập nhật.
    const titlePattern = new RegExp(`^${candidate.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    // Khai báo authorPattern nhận giá trị từ new RegExp(`^${candidate.author.replace(/[.*+?^${}()|[\. const giữ biến không gán lại; let cho phép cập nhật.
    const authorPattern = new RegExp(`^${candidate.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    // return kết thúc hàm và trả Book.findOne({ title: titlePattern, author_name: authorPattern }).select('_ về nơi gọi.
    return Book.findOne({ title: titlePattern, author_name: authorPattern }).select('_id title').lean();
};

/**
 * Hàm chapterSegmentsFromSource: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: source, title.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: matchAll, push, normalizeText, replace, sort, slice, map, wikisourceWikitextToText.
 */
const chapterSegmentsFromSource = (source, title) => {
    // Khai báo headings nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const headings = [];
    // Khai báo headingPattern nhận giá trị từ /^={2,}\s*(.+?)\s*={2,}\s*$/gm. const giữ biến không gán lại; let cho phép cập nhật.
    const headingPattern = /^={2,}\s*(.+?)\s*={2,}\s*$/gm;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const match of source.matchAll(headingPattern)) headings.push({ index: match.index, end: match.index + match[0].length, title: normalizeText(match[1]) });
    // Khai báo htmlHeadingPattern nhận giá trị từ /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi. const giữ biến không gán lại; let cho phép cập nhật.
    const htmlHeadingPattern = /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const match of source.matchAll(htmlHeadingPattern)) headings.push({ index: match.index, end: match.index + match[0].length, title: normalizeText(match[1].replace(/<[^>]*>/g, ' ')) });
    // Gọi/thực thi headings.sort với các đối số để thực hiện thao tác: headings.sort((left, right) => left.index - right.index)
    headings.sort((left, right) => left.index - right.index);

    // Khai báo sections nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const sections = [];
    // if chỉ chạy nhánh này khi điều kiện headings.length >= 2 đúng.
    if (headings.length >= 2) {
        // Khai báo first nhận giá trị từ headings[0]. const giữ biến không gán lại; let cho phép cập nhật.
        const first = headings[0];
        // if chỉ chạy nhánh này khi điều kiện first.index > 0 đúng.
        if (first.index > 0) sections.push({ title: `${title} · Mở đầu`, source: source.slice(0, first.index) });
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        for (let index = 0; index < headings.length; index += 1) {
            // Khai báo heading nhận giá trị từ headings[index]. const giữ biến không gán lại; let cho phép cập nhật.
            const heading = headings[index];
            // Khai báo next nhận giá trị từ headings[index + 1]. const giữ biến không gán lại; let cho phép cập nhật.
            const next = headings[index + 1];
            // Gọi/thực thi sections.push với các đối số để thực hiện thao tác: sections.push({ title: heading.title || `${title} · Phần ${index + 1}`, sou
            sections.push({ title: heading.title || `${title} · Phần ${index + 1}`, source: source.slice(heading.end, next?.index ?? source.length) });
        }
    }
    // Khai báo meaningful nhận giá trị từ sections.map((section) => ({ ...section, content: wikis. const giữ biến không gán lại; let cho phép cập nhật.
    let meaningful = sections.map((section) => ({ ...section, content: wikisourceWikitextToText(section.source, { minCharacters: 0 }) }))
        .filter((section) => section.content.length >= 500);
    // if chỉ chạy nhánh này khi điều kiện meaningful.length < 2 đúng.
    if (meaningful.length < 2) {
        // Khai báo fullText nhận giá trị từ wikisourceWikitextToText(source, { minCharacters: 0 }).. const giữ biến không gán lại; let cho phép cập nhật.
        const fullText = wikisourceWikitextToText(source, { minCharacters: 0 }).trim();
        // if chỉ chạy nhánh này khi điều kiện !fullText đúng.
        if (!fullText) return [];
        // Gọi/thực thi biểu thức để thực hiện thao tác: meaningful = [{ title: '', content: fullText }]
        meaningful = [{ title: '', content: fullText }];
    }

    // Keep source chapter titles when present. Split long chapters (or unstructured
    // works) into readable pages without inventing chapter names or content.
    // Khai báo pageSize nhận giá trị từ 14000. const giữ biến không gán lại; let cho phép cập nhật.
    const pageSize = 14000;
    // return kết thúc hàm và trả meaningful.flatMap((section) => { const paragraphs = String(section.content về nơi gọi.
    return meaningful.flatMap((section) => {
        // Khai báo paragraphs nhận giá trị từ String(section.content).split(/\n\s*\n/). const giữ biến không gán lại; let cho phép cập nhật.
        const paragraphs = String(section.content).split(/\n\s*\n/);
        // Khai báo pages nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
        const pages = [];
        // Khai báo page nhận giá trị từ ''. const giữ biến không gán lại; let cho phép cập nhật.
        let page = '';
        // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
        for (const paragraph of paragraphs) {
            // Khai báo remaining nhận giá trị từ paragraph.trim(). const giữ biến không gán lại; let cho phép cập nhật.
            let remaining = paragraph.trim();
            // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
            while (remaining.length > pageSize) {
                // Khai báo cut nhận giá trị từ remaining.lastIndexOf(' ', pageSize). const giữ biến không gán lại; let cho phép cập nhật.
                const cut = remaining.lastIndexOf(' ', pageSize);
                // Khai báo splitAt nhận giá trị từ cut > pageSize * 0.6 ? cut : pageSize. const giữ biến không gán lại; let cho phép cập nhật.
                const splitAt = cut > pageSize * 0.6 ? cut : pageSize;
                // Khai báo part nhận giá trị từ remaining.slice(0, splitAt).trim(). const giữ biến không gán lại; let cho phép cập nhật.
                const part = remaining.slice(0, splitAt).trim();
                // if chỉ chạy nhánh này khi điều kiện page đúng.
                if (page) { pages.push(page); page = ''; }
                // Gọi/thực thi pages.push với các đối số để thực hiện thao tác: pages.push(part)
                pages.push(part);
                // Gọi/thực thi remaining.slice với các đối số để thực hiện thao tác: remaining = remaining.slice(splitAt).trim()
                remaining = remaining.slice(splitAt).trim();
            }
            // if chỉ chạy nhánh này khi điều kiện remaining && page.length + remaining.length + 2 > pageSize đúng.
            if (remaining && page.length + remaining.length + 2 > pageSize) {
                // Gọi/thực thi pages.push với các đối số để thực hiện thao tác: pages.push(page)
                pages.push(page); page = remaining;
            } else if (remaining) page = page ? `${page}\n\n${remaining}` : remaining;
        }
        // if chỉ chạy nhánh này khi điều kiện page đúng.
        if (page) pages.push(page);
        // if chỉ chạy nhánh này khi điều kiện !pages.length đúng.
        if (!pages.length) return [];
        // return kết thúc hàm và trả pages.map((content, index) => ({ title: section.title ? (pages.length === 1 về nơi gọi.
        return pages.map((content, index) => ({
            // Trường title lưu section.title ? (pages.length === 1 ? section.title : ` làm giá trị trong object.
            title: section.title
                ? (pages.length === 1 ? section.title : `${section.title} · Trang ${index + 1}`)
                : `Trang ${index + 1}`,
            // Khóa content nhận biến cùng tên làm giá trị.
            content
        }));
    });
};

// Build readable, numbered chapter rows from the same verified Vietnamese source as its ebook PDF.
/**
 * Hàm ensureWikisourceChapters: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { pageTitle, bookId, genre = 'van_hoc_vi.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: countDocuments, getCandidateDetails, ApiError, chapterSegmentsFromSource, String, slice, updateOne.
 */
export const ensureWikisourceChapters = async ({ pageTitle, bookId, genre = 'van_hoc_viet_nam' }) => {
    // Khai báo existing nhận giá trị từ await Chapter.countDocuments({ book_id: bookId }). const giữ biến không gán lại; let cho phép cập nhật.
    const existing = await Chapter.countDocuments({ book_id: bookId });
    // if chỉ chạy nhánh này khi điều kiện existing >= 1 đúng.
    if (existing >= 1) return { created: 0, total: existing };
    // Khai báo candidate nhận giá trị từ await getCandidateDetails(pageTitle, { minimumCharacter. const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters: genre === 'tho_viet_nam' ? 500 : 5000 });
    // if chỉ chạy nhánh này khi điều kiện !candidate?.eligible || !candidate._wikitext đúng.
    if (!candidate?.eligible || !candidate._wikitext) throw new ApiError(422, 'Không thể xác minh lại nội dung và giấy phép Wikisource');
    // Khai báo sections nhận giá trị từ chapterSegmentsFromSource(candidate._wikitext, candidat. const giữ biến không gán lại; let cho phép cập nhật.
    const sections = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    // if chỉ chạy nhánh này khi điều kiện !sections.length đúng.
    if (!sections.length) throw new ApiError(422, 'Nguồn không có nội dung đủ để tạo trang đọc');
    // Khai báo created nhận giá trị từ 0. const giữ biến không gán lại; let cho phép cập nhật.
    let created = 0;
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (let index = 0; index < sections.length; index += 1) {
        // Khai báo section nhận giá trị từ sections[index]. const giữ biến không gán lại; let cho phép cập nhật.
        const section = sections[index];
        // Khai báo chapterTitle nhận giá trị từ String(section.title || `${candidate.title} · Phần ${in. const giữ biến không gán lại; let cho phép cập nhật.
        const chapterTitle = String(section.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200);
        // Khai báo content nhận giá trị từ String(section.content || '').slice(0, 199000). const giữ biến không gán lại; let cho phép cập nhật.
        const content = String(section.content || '').slice(0, 199000);
        // Khai báo result nhận giá trị từ await Chapter.updateOne( { book_id: bookId, chapter_num. const giữ biến không gán lại; let cho phép cập nhật.
        const result = await Chapter.updateOne(
            { book_id: bookId, chapter_number: index + 1 },
            { $setOnInsert: { book_id: bookId, title: chapterTitle, slug: `vi-ws-${bookId}-${index + 1}`, content, chapter_number: index + 1, access_level: 'free' } },
            { upsert: true }
        );
        // if chỉ chạy nhánh này khi điều kiện result.upsertedCount đúng.
        if (result.upsertedCount) created += 1;
    }
    // return kết thúc hàm và trả { created, total: await Chapter.countDocuments({ book_id: bookId }) } về nơi gọi.
    return { created, total: await Chapter.countDocuments({ book_id: bookId }) };
};

// Rebuild only local reading pages from the same verified Wikisource source when older rows exceed the page-size limit.
/**
 * Hàm rebuildWikisourceChapters: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { pageTitle, bookId, genre = 'van_hoc_vi.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: getCandidateDetails, ApiError, chapterSegmentsFromSource, some, find, select, lean, reduce.
 */
export const rebuildWikisourceChapters = async ({ pageTitle, bookId, genre = 'van_hoc_viet_nam' }) => {
    // Khai báo candidate nhận giá trị từ await getCandidateDetails(pageTitle, { minimumCharacter. const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters: genre === 'tho_viet_nam' ? 500 : 5000 });
    // if chỉ chạy nhánh này khi điều kiện !candidate?.eligible || !candidate._wikitext đúng.
    if (!candidate?.eligible || !candidate._wikitext) throw new ApiError(422, 'Không thể xác minh lại nội dung và giấy phép Wikisource');
    // Khai báo pages nhận giá trị từ chapterSegmentsFromSource(candidate._wikitext, candidat. const giữ biến không gán lại; let cho phép cập nhật.
    const pages = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    // if chỉ chạy nhánh này khi điều kiện !pages.length || pages.some((page) => page.content.length > 14000) đúng.
    if (!pages.length || pages.some((page) => page.content.length > 14000)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, 'Nguồn không tạo được các trang đọc hợp lệ dưới giới hạn 14.000 ký tự');
    }
    // Khai báo existing nhận giá trị từ await Chapter.find({ book_id: bookId }).select('content. const giữ biến không gán lại; let cho phép cập nhật.
    const existing = await Chapter.find({ book_id: bookId }).select('content').lean();
    // Khai báo oldLength nhận giá trị từ existing.reduce((sum, page) => sum + String(page.conten. const giữ biến không gán lại; let cho phép cập nhật.
    const oldLength = existing.reduce((sum, page) => sum + String(page.content || '').length, 0);
    // Khai báo newLength nhận giá trị từ pages.reduce((sum, page) => sum + page.content.length, . const giữ biến không gán lại; let cho phép cập nhật.
    const newLength = pages.reduce((sum, page) => sum + page.content.length, 0);
    // if chỉ chạy nhánh này khi điều kiện oldLength && newLength < oldLength * 0.85 đúng.
    if (oldLength && newLength < oldLength * 0.85) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, `Nguồn đọc lại ngắn hơn dữ liệu hiện tại (${newLength}/${oldLength} ký tự)`);
    }
    // Khai báo session nhận giá trị từ await mongoose.startSession(). const giữ biến không gán lại; let cho phép cập nhật.
    const session = await mongoose.startSession();
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await session.withTransaction(async () => { await Chapter.deleteMany({ book
        await session.withTransaction(async () => {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await Chapter.deleteMany({ book_id: bookId }, { session })
            await Chapter.deleteMany({ book_id: bookId }, { session });
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await Chapter.insertMany(pages.map((page, index) => ({ book_id: bookId, tit
            await Chapter.insertMany(pages.map((page, index) => ({
                // Trường book_id lưu bookId làm giá trị trong object.
                book_id: bookId,
                // Trường title lưu String(page.title || `${candidate.title} · Phần ${index làm giá trị trong object.
                title: String(page.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200),
                // Trường slug lưu `vi-ws-${bookId}-${index + 1}` làm giá trị trong object.
                slug: `vi-ws-${bookId}-${index + 1}`,
                // Trường content lưu String(page.content || '').slice(0, 199000) làm giá trị trong object.
                content: String(page.content || '').slice(0, 199000),
                // Trường chapter_number lưu index + 1 làm giá trị trong object.
                chapter_number: index + 1,
                // Trường access_level lưu 'free' làm giá trị trong object.
                access_level: 'free'
            })), { ordered: true, session });
        });
    } finally { await session.endSession(); }
    // return kết thúc hàm và trả { total: pages.length, oldLength, newLength, maxPageCharacters: Math.max(.. về nơi gọi.
    return { total: pages.length, oldLength, newLength, maxPageCharacters: Math.max(...pages.map((page) => page.content.length)) };
};

/**
 * Hàm saveImportState: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: job, values.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: updateOne, error.
 */
const saveImportState = async (job, values) => {
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await BookImportJob.updateOne({ _id: job.jobId, lock_token: job.lockToken }
        await BookImportJob.updateOne({ _id: job.jobId, lock_token: job.lockToken }, { $set: values });
    } catch (error) {
        // Gọi/thực thi console.error với các đối số để thực hiện thao tác: console.error(`Book import state update failed for ${job.jobId}: ${error.me
        console.error(`Book import state update failed for ${job.jobId}: ${error.message}`);
    }
};

// [IMPORT TÁC PHẨM] Recheck license/content/cover, stream PDF to private storage, then create the Book record.
/**
 * Hàm importWikisourceBook: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { pageTitle, ownerId, confirmLicense, co.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: ApiError, getCandidateDetails, chapterSegmentsFromSource, claimImportJob, findById, select, lean, findExistingBook.
 */
export const importWikisourceBook = async ({ pageTitle, ownerId, confirmLicense, confirmCover, genre = 'van_hoc_viet_nam' }) => {
    // if chỉ chạy nhánh này khi điều kiện typeof pageTitle !== 'string' || pageTitle.length > 255 đúng.
    if (typeof pageTitle !== 'string' || pageTitle.length > 255) throw new ApiError(400, 'Tác phẩm nguồn không hợp lệ');
    // if chỉ chạy nhánh này khi điều kiện confirmLicense !== true đúng.
    if (confirmLicense !== true) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(400, 'Hãy xác nhận license văn bản trước khi import');
    }
    // Khai báo minimumCharacters nhận giá trị từ genre === 'tho_viet_nam' ? 500 : 5000. const giữ biến không gán lại; let cho phép cập nhật.
    const minimumCharacters = genre === 'tho_viet_nam' ? 500 : 5000;
    // Khai báo candidate nhận giá trị từ await getCandidateDetails(pageTitle, { minimumCharacter. const giữ biến không gán lại; let cho phép cập nhật.
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters });
    // if chỉ chạy nhánh này khi điều kiện !candidate?.eligible đúng.
    if (!candidate?.eligible) throw new ApiError(422, 'Tác phẩm không còn đủ điều kiện import', candidate?.reasons || []);
    // if chỉ chạy nhánh này khi điều kiện !candidate._wikitext || candidate.contentCharacters < minimumCharacters đúng.
    if (!candidate._wikitext || candidate.contentCharacters < minimumCharacters) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(422, 'Nguồn không còn đủ nội dung để tạo PDF');
    }
    // Khai báo sourceChapters nhận giá trị từ chapterSegmentsFromSource(candidate._wikitext, candidat. const giữ biến không gán lại; let cho phép cập nhật.
    const sourceChapters = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    // if chỉ chạy nhánh này khi điều kiện !sourceChapters.length đúng.
    if (!sourceChapters.length) throw new ApiError(422, 'Nguồn không có nội dung đủ để tạo trang đọc Harvey');
    // Khai báo job nhận giá trị từ await claimImportJob(candidate). const giữ biến không gán lại; let cho phép cập nhật.
    const job = await claimImportJob(candidate);
    // if chỉ chạy nhánh này khi điều kiện job.completed || job.duplicate đúng.
    if (job.completed || job.duplicate) {
        // Khai báo existing nhận giá trị từ job.bookId ? await Book.findById(job.bookId).select('_i. const giữ biến không gán lại; let cho phép cập nhật.
        const existing = job.bookId ? await Book.findById(job.bookId).select('_id title').lean() : null;
        // if chỉ chạy nhánh này khi điều kiện existing đúng.
        if (existing) return { status: job.duplicate ? 'duplicate' : 'already_imported', book: existing };
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(409, 'Bản ghi import trước đó không còn; cần quản trị viên kiểm tra trước khi thử lại');
    }

    // Khai báo ebookKey nhận giá trị từ null. const giữ biến không gán lại; let cho phép cập nhật.
    let ebookKey = null;
    // Khai báo coverKey nhận giá trị từ null. const giữ biến không gán lại; let cho phép cập nhật.
    let coverKey = null;
    // Khai báo createdBookId nhận giá trị từ null. const giữ biến không gán lại; let cho phép cập nhật.
    let createdBookId = null;
    // Khai báo bookCreated nhận giá trị từ false. const giữ biến không gán lại; let cho phép cập nhật.
    let bookCreated = false;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc giải phóng tài nguyên.
    try {
        // Khai báo duplicate nhận giá trị từ await findExistingBook(candidate). const giữ biến không gán lại; let cho phép cập nhật.
        const duplicate = await findExistingBook(candidate);
        // if chỉ chạy nhánh này khi điều kiện duplicate đúng.
        if (duplicate) {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await saveImportState(job, { status: 'duplicate', book_id: duplicate._id, l
            await saveImportState(job, { status: 'duplicate', book_id: duplicate._id, lock_token: null, lease_expires_at: null });
            // return kết thúc hàm và trả { status: 'duplicate', book: duplicate } về nơi gọi.
            return { status: 'duplicate', book: duplicate };
        }

        // Khai báo generatedPdf nhận giá trị từ createWikisourcePdfStream({ title: candidate.title, aut. const giữ biến không gán lại; let cho phép cập nhật.
        const generatedPdf = createWikisourcePdfStream({
            // Trường title lưu candidate.title làm giá trị trong object.
            title: candidate.title, author: candidate.author, wikitext: candidate._wikitext,
            // Trường sourceUrl lưu candidate.sourceUrl làm giá trị trong object.
            sourceUrl: candidate.sourceUrl, license: candidate._license
        });
        // Khai báo ebook nhận giá trị từ await savePrivateBookStream({ stream: generatedPdf.stre. const giữ biến không gán lại; let cho phép cập nhật.
        const ebook = await savePrivateBookStream({
            // Trường stream lưu generatedPdf.stream làm giá trị trong object.
            stream: generatedPdf.stream, originalname: `${candidate.title}.pdf`,
            // Trường mimetype lưu 'application/pdf' làm giá trị trong object.
            mimetype: 'application/pdf', category: 'ebook', maxBytes: MAX_BOOK_BYTES
        });
        // Gọi/thực thi biểu thức để thực hiện thao tác: ebookKey = ebook.file_key
        ebookKey = ebook.file_key;
        // Khai báo bookId nhận giá trị từ new mongoose.Types.ObjectId(). const giữ biến không gán lại; let cho phép cập nhật.
        const bookId = new mongoose.Types.ObjectId();
        // Gọi/thực thi biểu thức để thực hiện thao tác: createdBookId = bookId
        createdBookId = bookId;
        // Khai báo book nhận giá trị từ await Book.create({ _id: bookId, title: candidate.title. const giữ biến không gán lại; let cho phép cập nhật.
        const book = await Book.create({
            // Trường _id lưu bookId làm giá trị trong object.
            _id: bookId,
            // Trường title lưu candidate.title làm giá trị trong object.
            title: candidate.title,
            // Trường author_name lưu candidate.author làm giá trị trong object.
            author_name: candidate.author,
            // Trường category lưu 'ebook' làm giá trị trong object.
            category: 'ebook',
            // Khóa genre nhận biến cùng tên làm giá trị.
            genre,
            // Trường publication_year lưu candidate.publicationYear làm giá trị trong object.
            publication_year: candidate.publicationYear,
            // Trường description lưu `${candidate.summary}\n\nNguồn: ${candidate.sourceUrl}\ làm giá trị trong object.
            description: `${candidate.summary}\n\nNguồn: ${candidate.sourceUrl}\nGiấy phép: ${candidate._license.name} (${candidate._license.url})`.slice(0, 5000),
            // Trường cover_url lưu '' làm giá trị trong object.
            cover_url: '',
            // Trường cover_file_key lưu null làm giá trị trong object.
            cover_file_key: null,
            // Trường access_level lưu 'free' làm giá trị trong object.
            access_level: 'free',
            // Trường file_key lưu ebookKey làm giá trị trong object.
            file_key: ebookKey,
            // Trường file_original_name lưu `${candidate.title}.pdf`.slice(0, 200) làm giá trị trong object.
            file_original_name: `${candidate.title}.pdf`.slice(0, 200),
            // Trường owner lưu ownerId làm giá trị trong object.
            owner: ownerId,
            // Trường status lưu 'published' làm giá trị trong object.
            status: 'published',
            // Trường import_source lưu 'wikisource' làm giá trị trong object.
            import_source: 'wikisource',
            // Trường source_id lưu candidate.id làm giá trị trong object.
            source_id: candidate.id,
            // Trường source_url lưu candidate.sourceUrl làm giá trị trong object.
            source_url: candidate.sourceUrl,
            // Trường license_name lưu candidate._license.name làm giá trị trong object.
            license_name: candidate._license.name,
            // Trường license_url lưu candidate._license.url làm giá trị trong object.
            license_url: candidate._license.url,
            // Trường cover_source_url lưu null làm giá trị trong object.
            cover_source_url: null,
            // Trường cover_license_name lưu null làm giá trị trong object.
            cover_license_name: null,
            // Trường cover_license_url lưu null làm giá trị trong object.
            cover_license_url: null,
            // Trường cover_attribution lưu null làm giá trị trong object.
            cover_attribution: null,
            // Trường language lưu 'vi' làm giá trị trong object.
            language: 'vi',
            // Trường file_format lưu 'PDF' làm giá trị trong object.
            file_format: 'PDF',
            // Trường file_size lưu ebook.size làm giá trị trong object.
            file_size: ebook.size,
            // Trường verified_at lưu new Date() làm giá trị trong object.
            verified_at: new Date()
        });
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await Chapter.insertMany(sourceChapters.map((section, index) => ({ book_id:
        await Chapter.insertMany(sourceChapters.map((section, index) => ({
            // Trường book_id lưu book._id làm giá trị trong object.
            book_id: book._id,
            // Trường title lưu String(section.title || `${candidate.title} · Phần ${in làm giá trị trong object.
            title: String(section.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200),
            // Trường slug lưu `vi-ws-${book._id}-${index + 1}` làm giá trị trong object.
            slug: `vi-ws-${book._id}-${index + 1}`,
            // Trường content lưu String(section.content || '').slice(0, 199000) làm giá trị trong object.
            content: String(section.content || '').slice(0, 199000),
            // Trường chapter_number lưu index + 1 làm giá trị trong object.
            chapter_number: index + 1,
            // Trường access_level lưu 'free' làm giá trị trong object.
            access_level: 'free'
        })), { ordered: true });
        // Gọi/thực thi biểu thức để thực hiện thao tác: bookCreated = true
        bookCreated = true;
        // await chờ tác vụ bất đồng bộ xong trước bước sau: await saveImportState(job, { status: 'imported', book_id: book._id, lock_to
        await saveImportState(job, { status: 'imported', book_id: book._id, lock_token: null, lease_expires_at: null, last_error: null });
        // return kết thúc hàm và trả { status: 'imported', book: { _id: book.id, title: book.title, sourceUrl: c về nơi gọi.
        return { status: 'imported', book: { _id: book.id, title: book.title, sourceUrl: candidate.sourceUrl, license: candidate._license.name, fileSize: ebook.size } };
    } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện !bookCreated đúng.
        if (!bookCreated) {
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await Promise.allSettled([ removePrivateBookFile(ebookKey), removePrivateBo
            await Promise.allSettled([
                removePrivateBookFile(ebookKey), removePrivateBookFile(coverKey),
                createdBookId ? Book.deleteOne({ _id: createdBookId }) : Promise.resolve()
            ]);
            // Khai báo safeError nhận giá trị từ error instanceof ApiError ? error.message : 'Import thấ. const giữ biến không gán lại; let cho phép cập nhật.
            const safeError = error instanceof ApiError ? error.message : 'Import thất bại trong bước lưu file hoặc dữ liệu';
            // await chờ tác vụ bất đồng bộ xong trước bước sau: await saveImportState(job, { status: 'failed', last_error: safeError, lock_
            await saveImportState(job, { status: 'failed', last_error: safeError, lock_token: null, lease_expires_at: null });
        }
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw error;
    }
};
