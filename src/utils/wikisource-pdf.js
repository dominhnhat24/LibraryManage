// [TẠO PDF TỪ WIKISOURCE] Dàn trang văn bản nguồn bằng PDFKit để không phụ thuộc WS Export bên ngoài.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import ApiError from './api-error.js';

const FONT_CANDIDATES = process.platform === 'win32'
    ? ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/times.ttf']
    : ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'];
const HARVEYBOOK_LOGO_PATH = fileURLToPath(new URL('../../admin-web/public/HarveyBook-email.png', import.meta.url));

export const findWikisourcePdfFont = () => {
    const configuredPath = String(process.env.BOOK_PDF_FONT_PATH || '').trim();
    const fontPath = configuredPath || FONT_CANDIDATES.find((candidate) => existsSync(candidate));
    if (!fontPath || !existsSync(fontPath)) {
        throw new ApiError(503, 'Configure BOOK_PDF_FONT_PATH with a Unicode TTF font to generate Vietnamese PDFs');
    }
    return fontPath;
};

const stripTemplates = (source) => {
    const value = String(source || '');
    let output = '';
    for (let index = 0; index < value.length;) {
        if (value.slice(index, index + 2) !== '{{') {
            output += value[index++];
            continue;
        }
        let depth = 1;
        let end = index + 2;
        while (end < value.length && depth > 0) {
            if (value.slice(end, end + 2) === '{{') { depth += 1; end += 2; }
            else if (value.slice(end, end + 2) === '}}') { depth -= 1; end += 2; }
            else end += 1;
        }
        if (depth !== 0) { index += 2; continue; }
        const inner = value.slice(index + 2, end - 2);
        const separator = inner.indexOf('|');
        const name = (separator < 0 ? inner : inner.slice(0, separator)).trim().toLocaleLowerCase('vi');
        if (separator >= 0 && ['văn', 'poem'].includes(name)) output += stripTemplates(inner.slice(separator + 1));
        index = end;
    }
    return output;
};

export const wikisourceWikitextToText = (wikitext, { minCharacters = 5000 } = {}) => {
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
    if (text.length < minCharacters) throw new ApiError(422, 'Wikisource text is too short to generate a complete ebook PDF');
    return text;
};

// PDFDocument itself is a Readable stream; the caller applies the configured byte limit while storing it.
export const createWikisourcePdfStream = ({ title, author, wikitext, sourceUrl, license, coverBuffer, coverMime }) => {
    const fontPath = findWikisourcePdfFont();
    const body = wikisourceWikitextToText(wikitext);
    const document = new PDFDocument({ size: 'A4', margins: { top: 58, bottom: 58, left: 64, right: 64 }, info: { Title: title, Author: author, Subject: 'Tác phẩm tiếng Việt từ Wikisource' } });
    document.registerFont('OpenBookVietnamese', fontPath);
    document.font('OpenBookVietnamese');

    if (coverBuffer && ['image/jpeg', 'image/png'].includes(coverMime)) {
        document.image(coverBuffer, 100, 65, { fit: [395, 600], align: 'center', valign: 'center' });
        document.addPage();
    } else if (coverMime === 'image/svg+xml') {
        document.save().rect(0, 0, 595, 842).fill('#183c34').restore();
        document.save().roundedRect(38, 38, 519, 766, 12).fillAndStroke('#f1e7cf', '#c6a96c').restore();
        document.save().roundedRect(52, 52, 491, 738, 10).lineWidth(1.5).stroke('#8e7040').restore();
        document.save().strokeColor('#b99b62').lineWidth(2).moveTo(105, 235).quadraticCurveTo(297, 92, 490, 235).stroke().restore();
        document.save().strokeColor('#d7c59a').lineWidth(1.5).moveTo(105, 535).quadraticCurveTo(297, 675, 490, 535).stroke().restore();
        document.save().fillColor('#c87555').ellipse(270, 320, 23, 58).fill().restore();
        document.save().fillColor('#d28a65').ellipse(297, 302, 24, 65).fill().restore();
        document.save().fillColor('#c87555').ellipse(324, 320, 23, 58).fill().restore();
        document.save().fillColor('#d7b55c').circle(297, 353, 12).fill().restore();
        if (existsSync(HARVEYBOOK_LOGO_PATH)) document.image(HARVEYBOOK_LOGO_PATH, 247, 82, { fit: [100, 68], align: 'center', valign: 'center' });
        document.fillColor('#76613d').fontSize(16).text('TÁC PHẨM VĂN HỌC VIỆT NAM', 80, 170, { width: 435, align: 'center' });
        document.fillColor('#244b3d').fontSize(34).text(title, 75, 570, { width: 445, align: 'center', lineGap: 8 });
        document.save().strokeColor('#b99b62').lineWidth(2).moveTo(155, 660).lineTo(440, 660).stroke().restore();
        document.fillColor('#76523b').fontSize(20).text(author, 80, 685, { width: 435, align: 'center' });
        document.fillColor('#8e493b').fontSize(14).text('BÌA THAY THẾ · THIẾT KẾ HARVEYBOOK', 80, 750, { width: 435, align: 'center' });
        document.addPage();
    }
    document.moveDown(5).fontSize(24).text(title, { align: 'center' });
    document.moveDown(1).fontSize(14).text(author, { align: 'center' });
    document.moveDown(2).fontSize(10).text(`Nguồn: ${sourceUrl}\nGiấy phép: ${license.name} — ${license.url}`, { align: 'center', lineGap: 4 });
    document.addPage();

    for (const line of body.split('\n')) {
        if (!line) {
            document.moveDown(0.45);
            continue;
        }
        const heading = line.length < 120 && !/[.!?]$/.test(line) && /^\S.{0,118}$/.test(line);
        if (heading && /^\d+[.)\s]/.test(line)) {
            document.moveDown(0.5).fontSize(14).text(line, { paragraphGap: 6, keepTogether: true });
            document.fontSize(11);
        } else {
            document.fontSize(11).text(line, { lineGap: 3, paragraphGap: 2, align: 'left' });
        }
    }
    document.end();
    return { stream: document, characters: body.length, fontPath };
};
