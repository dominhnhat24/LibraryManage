// [TẠO PDF TỪ WIKISOURCE] Dàn trang văn bản nguồn bằng PDFKit để không phụ thuộc WS Export bên ngoài.
// Import { existsSync } từ node:fs để dùng trong module.
/**
 * Tệp src/utils/wikisource-pdf.js: cung cấp tiện ích tái sử dụng. Chú thích hàm nêu đầu vào, kết quả và lời gọi tiếp để theo dõi luồng.
 */
import { existsSync } from 'node:fs';
// Import { fileURLToPath } từ node:url để dùng trong module.
import { fileURLToPath } from 'node:url';
// Import PDFDocument từ pdfkit để dùng trong module.
import PDFDocument from 'pdfkit';
// Import ApiError từ ./api-error.js để dùng trong module.
import ApiError from './api-error.js';

// Khai báo FONT_CANDIDATES nhận giá trị từ process.platform === 'win32' ? ['C:/Windows/Fonts/arial. const giữ biến không gán lại; let cho phép cập nhật.
const FONT_CANDIDATES = process.platform === 'win32'
    ? ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/times.ttf']
    : ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'];
// Khai báo HARVEYBOOK_LOGO_PATH nhận giá trị từ fileURLToPath(new URL('../../admin-web/public/HarveyBoo. const giữ biến không gán lại; let cho phép cập nhật.
const HARVEYBOOK_LOGO_PATH = fileURLToPath(new URL('../../admin-web/public/HarveyBook-email.png', import.meta.url));

/**
 * Hàm findWikisourcePdfFont: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: không có tham số.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, trim, find, existsSync, ApiError.
 */
export const findWikisourcePdfFont = () => {
    // Khai báo configuredPath nhận giá trị từ String(process.env.BOOK_PDF_FONT_PATH || '').trim(). const giữ biến không gán lại; let cho phép cập nhật.
    const configuredPath = String(process.env.BOOK_PDF_FONT_PATH || '').trim();
    // Khai báo fontPath nhận giá trị từ configuredPath || FONT_CANDIDATES.find((candidate) => e. const giữ biến không gán lại; let cho phép cập nhật.
    const fontPath = configuredPath || FONT_CANDIDATES.find((candidate) => existsSync(candidate));
    // if chỉ chạy nhánh này khi điều kiện !fontPath || !existsSync(fontPath) đúng.
    if (!fontPath || !existsSync(fontPath)) {
        // throw phát sinh lỗi để middleware tầng trên chuẩn hóa phản hồi.
        throw new ApiError(503, 'Configure BOOK_PDF_FONT_PATH with a Unicode TTF font to generate Vietnamese PDFs');
    }
    // return kết thúc hàm và trả fontPath về nơi gọi.
    return fontPath;
};

/**
 * Hàm stripTemplates: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: source.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, slice, indexOf, trim, toLocaleLowerCase, includes.
 */
const stripTemplates = (source) => {
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
        if (separator >= 0 && ['văn', 'poem'].includes(name)) output += stripTemplates(inner.slice(separator + 1));
        // Gọi/thực thi biểu thức để thực hiện thao tác: index = end
        index = end;
    }
    // return kết thúc hàm và trả output về nơi gọi.
    return output;
};

/**
 * Hàm wikisourceWikitextToText: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: wikitext, { minCharacters = 5000 } mặc định {}.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: String, replace, stripTemplates, fromCodePoint, parseInt, toLowerCase, slice, split.
 */
export const wikisourceWikitextToText = (wikitext, { minCharacters = 5000 } = {}) => {
    // Khai báo text nhận giá trị từ String(wikitext || '') .replace(/<!--[\s\S]*?-->/g, ' '. const giữ biến không gán lại; let cho phép cập nhật.
    let text = String(wikitext || '')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, ' ')
        .replace(/<ref\b[^/]*\/\s*>/gi, ' ')
        .replace(/\{\|[\s\S]*?\|\}/g, ' ')
        .replace(/\[\[(?:Tập tin|File|Image):[^\]]*\]\]/gi, ' ')
        .replace(/\[\[Thể loại:[^\]]*\]\]/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|li|h[1-6]|poem)\s*>/gi, '\n')
        .replace(/<(?:p|div|li|h[1-6]|poem)\b[^>]*>/gi, '\n');
    // Gọi/thực thi stripTemplates với các đối số để thực hiện thao tác: text = stripTemplates(text) .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1
    text = stripTemplates(text)
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
        .replace(/\[(?:https?:)?\/\/[^\s\]]+\s+([^\]]+)\]/g, '$1')
        .replace(/\[\[(?:w|s|commons|vi):([^\]|]+)\|([^\]]+)\]\]/gi, '$2')
        .replace(/\[\[(?:w|s|commons|vi):([^\]]+)\]\]/gi, '$1')
        .replace(/'''?([^']+)'''?/g, '$1')
        .replace(/''([^']+)''/g, '$1')
        .replace(/<[^>]*>/g, ' ')
        .replace(/^\s*={2,}\s*(.*?)\s*={2,}\s*$/gm, '\n$1\n')
        .replace(/^\s*[*#;:]\s?/gm, '')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code, code[0].toLowerCase() === 'x' ? 16 : 10)))
        .replace(/\r/g, '')
        .split('\n').map((line) => line.replace(/[\t ]+/g, ' ').trim()).join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    // if chỉ chạy nhánh này khi điều kiện text.length < minCharacters đúng.
    if (text.length < minCharacters) throw new ApiError(422, 'Wikisource text is too short to generate a complete ebook PDF');
    // return kết thúc hàm và trả text về nơi gọi.
    return text;
};

// PDFDocument itself is a Readable stream; the caller applies the configured byte limit while storing it.
/**
 * Hàm createWikisourcePdfStream: thực hiện phần xử lý theo tên và quy tắc nghiệp vụ tương ứng.
 * Tham số: { title, author, wikitext, sourceUrl, li.
 * Kết quả: trả dữ liệu cho nơi gọi; middleware/controller gửi qua res hoặc chuyển lỗi bằng next.
 * Gọi tiếp: findWikisourcePdfFont, wikisourceWikitextToText, PDFDocument, registerFont, font, includes, image, addPage.
 */
export const createWikisourcePdfStream = ({ title, author, wikitext, sourceUrl, license, coverBuffer, coverMime }) => {
    // Khai báo fontPath nhận giá trị từ findWikisourcePdfFont(). const giữ biến không gán lại; let cho phép cập nhật.
    const fontPath = findWikisourcePdfFont();
    // Khai báo body nhận giá trị từ wikisourceWikitextToText(wikitext). const giữ biến không gán lại; let cho phép cập nhật.
    const body = wikisourceWikitextToText(wikitext);
    // Khai báo document nhận giá trị từ new PDFDocument({ size: 'A4', margins: { top: 58, botto. const giữ biến không gán lại; let cho phép cập nhật.
    const document = new PDFDocument({ size: 'A4', margins: { top: 58, bottom: 58, left: 64, right: 64 }, info: { Title: title, Author: author, Subject: 'Tác phẩm tiếng Việt từ Wikisource' } });
    // Gọi/thực thi document.registerFont với các đối số để thực hiện thao tác: document.registerFont('OpenBookVietnamese', fontPath)
    document.registerFont('OpenBookVietnamese', fontPath);
    // Gọi/thực thi document.font với các đối số để thực hiện thao tác: document.font('OpenBookVietnamese')
    document.font('OpenBookVietnamese');

    // if chỉ chạy nhánh này khi điều kiện coverBuffer && ['image/jpeg', 'image/png'].includes(coverMime) đúng.
    if (coverBuffer && ['image/jpeg', 'image/png'].includes(coverMime)) {
        // Gọi/thực thi document.image với các đối số để thực hiện thao tác: document.image(coverBuffer, 100, 65, { fit: [395, 600], align: 'center', va
        document.image(coverBuffer, 100, 65, { fit: [395, 600], align: 'center', valign: 'center' });
        // Gọi/thực thi document.addPage với các đối số để thực hiện thao tác: document.addPage()
        document.addPage();
    } else if (coverMime === 'image/svg+xml') {
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().rect(0, 0, 595, 842).fill('#183c34').restore()
        document.save().rect(0, 0, 595, 842).fill('#183c34').restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().roundedRect(38, 38, 519, 766, 12).fillAndStroke('#f1e7cf',
        document.save().roundedRect(38, 38, 519, 766, 12).fillAndStroke('#f1e7cf', '#c6a96c').restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().roundedRect(52, 52, 491, 738, 10).lineWidth(1.5).stroke('#8
        document.save().roundedRect(52, 52, 491, 738, 10).lineWidth(1.5).stroke('#8e7040').restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().strokeColor('#b99b62').lineWidth(2).moveTo(105, 235).quadra
        document.save().strokeColor('#b99b62').lineWidth(2).moveTo(105, 235).quadraticCurveTo(297, 92, 490, 235).stroke().restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().strokeColor('#d7c59a').lineWidth(1.5).moveTo(105, 535).quad
        document.save().strokeColor('#d7c59a').lineWidth(1.5).moveTo(105, 535).quadraticCurveTo(297, 675, 490, 535).stroke().restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().fillColor('#c87555').ellipse(270, 320, 23, 58).fill().resto
        document.save().fillColor('#c87555').ellipse(270, 320, 23, 58).fill().restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().fillColor('#d28a65').ellipse(297, 302, 24, 65).fill().resto
        document.save().fillColor('#d28a65').ellipse(297, 302, 24, 65).fill().restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().fillColor('#c87555').ellipse(324, 320, 23, 58).fill().resto
        document.save().fillColor('#c87555').ellipse(324, 320, 23, 58).fill().restore();
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().fillColor('#d7b55c').circle(297, 353, 12).fill().restore()
        document.save().fillColor('#d7b55c').circle(297, 353, 12).fill().restore();
        // if chỉ chạy nhánh này khi điều kiện existsSync(HARVEYBOOK_LOGO_PATH) đúng.
        if (existsSync(HARVEYBOOK_LOGO_PATH)) document.image(HARVEYBOOK_LOGO_PATH, 247, 82, { fit: [100, 68], align: 'center', valign: 'center' });
        // Gọi/thực thi document.fillColor với các đối số để thực hiện thao tác: document.fillColor('#76613d').fontSize(16).text('TÁC PHẨM VĂN HỌC VIỆT NAM'
        document.fillColor('#76613d').fontSize(16).text('TÁC PHẨM VĂN HỌC VIỆT NAM', 80, 170, { width: 435, align: 'center' });
        // Gọi/thực thi document.fillColor với các đối số để thực hiện thao tác: document.fillColor('#244b3d').fontSize(34).text(title, 75, 570, { width: 44
        document.fillColor('#244b3d').fontSize(34).text(title, 75, 570, { width: 445, align: 'center', lineGap: 8 });
        // Gọi/thực thi document.save với các đối số để thực hiện thao tác: document.save().strokeColor('#b99b62').lineWidth(2).moveTo(155, 660).lineTo
        document.save().strokeColor('#b99b62').lineWidth(2).moveTo(155, 660).lineTo(440, 660).stroke().restore();
        // Gọi/thực thi document.fillColor với các đối số để thực hiện thao tác: document.fillColor('#76523b').fontSize(20).text(author, 80, 685, { width: 4
        document.fillColor('#76523b').fontSize(20).text(author, 80, 685, { width: 435, align: 'center' });
        // Gọi/thực thi document.fillColor với các đối số để thực hiện thao tác: document.fillColor('#8e493b').fontSize(14).text('BÌA THAY THẾ · THIẾT KẾ HA
        document.fillColor('#8e493b').fontSize(14).text('BÌA THAY THẾ · THIẾT KẾ HARVEYBOOK', 80, 750, { width: 435, align: 'center' });
        // Gọi/thực thi document.addPage với các đối số để thực hiện thao tác: document.addPage()
        document.addPage();
    }
    // Gọi/thực thi document.moveDown với các đối số để thực hiện thao tác: document.moveDown(5).fontSize(24).text(title, { align: 'center' })
    document.moveDown(5).fontSize(24).text(title, { align: 'center' });
    // Gọi/thực thi document.moveDown với các đối số để thực hiện thao tác: document.moveDown(1).fontSize(14).text(author, { align: 'center' })
    document.moveDown(1).fontSize(14).text(author, { align: 'center' });
    // Gọi/thực thi document.moveDown với các đối số để thực hiện thao tác: document.moveDown(2).fontSize(10).text(`Nguồn: ${sourceUrl}\nGiấy phép: ${l
    document.moveDown(2).fontSize(10).text(`Nguồn: ${sourceUrl}\nGiấy phép: ${license.name} — ${license.url}`, { align: 'center', lineGap: 4 });
    // Gọi/thực thi document.addPage với các đối số để thực hiện thao tác: document.addPage()
    document.addPage();

    // Vòng lặp duyệt dữ liệu hoặc tiếp tục theo điều kiện để xử lý các phần tử.
    for (const line of body.split('\n')) {
        // if chỉ chạy nhánh này khi điều kiện !line đúng.
        if (!line) {
            // Gọi/thực thi document.moveDown với các đối số để thực hiện thao tác: document.moveDown(0.45)
            document.moveDown(0.45);

            continue;
        }
        // Khai báo heading nhận giá trị từ line.length < 120 && !/[.!?]$/.test(line) && /^\S.{0,11. const giữ biến không gán lại; let cho phép cập nhật.
        const heading = line.length < 120 && !/[.!?]$/.test(line) && /^\S.{0,118}$/.test(line);
        // if chỉ chạy nhánh này khi điều kiện heading && /^\d+[.)\s]/.test(line) đúng.
        if (heading && /^\d+[.)\s]/.test(line)) {
            // Gọi/thực thi document.moveDown với các đối số để thực hiện thao tác: document.moveDown(0.5).fontSize(14).text(line, { paragraphGap: 6, keepToget
            document.moveDown(0.5).fontSize(14).text(line, { paragraphGap: 6, keepTogether: true });
            // Gọi/thực thi document.fontSize với các đối số để thực hiện thao tác: document.fontSize(11)
            document.fontSize(11);
        } else {
            // Gọi/thực thi document.fontSize với các đối số để thực hiện thao tác: document.fontSize(11).text(line, { lineGap: 3, paragraphGap: 2, align: 'lef
            document.fontSize(11).text(line, { lineGap: 3, paragraphGap: 2, align: 'left' });
        }
    }
    // Gọi/thực thi document.end với các đối số để thực hiện thao tác: document.end()
    document.end();
    // return kết thúc hàm và trả { stream: document, characters: body.length, fontPath } về nơi gọi.
    return { stream: document, characters: body.length, fontPath };
};
