// [BÌA THAY THẾ] Tạo SVG nội bộ an toàn khi tác phẩm không có bìa nguồn phù hợp.
/**
 * Hàm xmlEscape: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, replace.
 */
/**
 * Tệp src/utils/replacement-book-cover.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
const xmlEscape = (value) => String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * Hàm splitTitle: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: value.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, split, push, slice.
 */
const splitTitle = (value) => {
    // Khai báo words nhận giá trị từ String(value || '').trim().split(/\s+/). const giữ biến không gán lại; let cho phép cập nhật.
    const words = String(value || '').trim().split(/\s+/);
    // Khai báo lines nhận giá trị từ []. const giữ biến không gán lại; let cho phép cập nhật.
    const lines = [];
    // Khai báo line nhận giá trị từ ''. const giữ biến không gán lại; let cho phép cập nhật.
    let line = '';
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const word of words) {
        // if chỉ chạy nhánh này khi điều kiện line && `${line} ${word}`.length > 18 đúng.
        if (line && `${line} ${word}`.length > 18) {
            // Gọi/thực thi lines.push với các đối số để thực hiện thao tác: lines.push(line)
            lines.push(line);
            // Gọi/thực thi biểu thức để thực hiện thao tác: line = word
            line = word;
        } else {
            // Gọi/thực thi biểu thức để thực hiện thao tác: line = line ? `${line} ${word}` : word
            line = line ? `${line} ${word}` : word;
        }
    }
    // if chỉ chạy nhánh này khi điều kiện line đúng.
    if (line) lines.push(line);
    // return kết thúc hàm và trả lines.slice(0, 3) về nơi gọi.
    return lines.slice(0, 3);
};

/**
 * Hàm createReplacementBookCover: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { title, author }.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: splitTitle, map, xmlEscape, join, from, rotate.
 */
export const createReplacementBookCover = ({ title, author }) => {
    // Khai báo lines nhận giá trị từ splitTitle(title). const giữ biến không gán lại; let cho phép cập nhật.
    const lines = splitTitle(title);
    // Khai báo titleText nhận giá trị từ lines.map((line, index) => `<tspan x="450" dy="${index . const giữ biến không gán lại; let cho phép cập nhật.
    const titleText = lines.map((line, index) =>
        `<tspan x="450" dy="${index === 0 ? 0 : 92}">${xmlEscape(line)}</tspan>`).join('');
    // return kết thúc hàm và trả Buffer.from(`<svg xmlns="http: về nơi gọi.
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
<rect width="900" height="1350" fill="#183c34"/>
<rect x="54" y="54" width="792" height="1242" rx="18" fill="#f1e7cf" stroke="#c6a96c" stroke-width="5"/>
<rect x="76" y="76" width="748" height="1198" rx="12" fill="none" stroke="#8e7040" stroke-width="2"/>
<path d="M145 340 Q450 115 755 340 M145 610 Q450 835 755 610" fill="none" stroke="#b99b62" stroke-width="4"/>
<path d="M175 345 Q450 160 725 345 M175 605 Q450 790 725 605" fill="none" stroke="#d7c59a" stroke-width="2"/>
<g stroke="#8e493e" stroke-width="3">
<ellipse cx="360" cy="440" rx="44" ry="75" fill="#b75a43" transform="rotate(-30 360 440)"/>
<ellipse cx="405" cy="395" rx="42" ry="80" fill="#c87555" transform="rotate(-14 405 395)"/>
<ellipse cx="450" cy="375" rx="44" ry="88" fill="#d28a65"/>
<ellipse cx="495" cy="395" rx="42" ry="80" fill="#c87555" transform="rotate(14 495 395)"/>
<ellipse cx="540" cy="440" rx="44" ry="75" fill="#b75a43" transform="rotate(30 540 440)"/>
</g>
<circle cx="450" cy="475" r="24" fill="#d7b55c" stroke="#8e7040" stroke-width="3"/>
<text x="450" y="220" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" letter-spacing="2" fill="#76613d">TÁC PHẨM VĂN HỌC VIỆT NAM</text>
<text x="450" y="930" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#244b3d">${titleText}</text>
<line x1="220" y1="990" x2="680" y2="990" stroke="#b99b62" stroke-width="3"/>
<text x="450" y="1060" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" fill="#76523b">${xmlEscape(author)}</text>
<text x="450" y="1160" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="2" fill="#8e493b">BÌA THAY THẾ</text>
<text x="450" y="1205" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" fill="#76613d">Thiết kế HarveyBook · Nội dung từ Wikisource</text>
</svg>`, 'utf8');
};

/**
 * Hàm isSafeReplacementCover: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: buffer.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: isBuffer, toString, test, Set, matchAll, has, toLowerCase.
 */
export const isSafeReplacementCover = (buffer) => {
    // if chỉ chạy nhánh này khi điều kiện !Buffer.isBuffer(buffer) || buffer.length > 100 * 1024 đúng.
    if (!Buffer.isBuffer(buffer) || buffer.length > 100 * 1024) return false;
    // Khai báo svg nhận giá trị từ buffer.toString('utf8'). const giữ biến không gán lại; let cho phép cập nhật.
    const svg = buffer.toString('utf8');
    // if chỉ chạy nhánh này khi điều kiện !/^<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+width="900"\s+height=" đúng.
    if (!/^<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+width="900"\s+height="1350"\s+viewBox="0 0 900 1350">[\s\S]*<\/svg>$/.test(svg)) return false;
    // if chỉ chạy nhánh này khi điều kiện /<!DOCTYPE|<!ENTITY|<script|<style|foreignObject|\bon[a-z]+\s*=|href\s*=|ur đúng.
    if (/<!DOCTYPE|<!ENTITY|<script|<style|foreignObject|\bon[a-z]+\s*=|href\s*=|url\s*\(/i.test(svg)) return false;
    // Khai báo allowedElements nhận giá trị từ new Set(['svg', 'rect', 'path', 'g', 'ellipse', 'circle. const giữ biến không gán lại; let cho phép cập nhật.
    const allowedElements = new Set(['svg', 'rect', 'path', 'g', 'ellipse', 'circle', 'text', 'tspan', 'line']);
    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const match of svg.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
        // if chỉ chạy nhánh này khi điều kiện !allowedElements.has(match[1].toLowerCase()) đúng.
        if (!allowedElements.has(match[1].toLowerCase())) return false;
    }
    // return kết thúc hàm và trả !/(?:&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;))/i.test(svg) về nơi gọi.
    return !/(?:&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;))/i.test(svg);
};
