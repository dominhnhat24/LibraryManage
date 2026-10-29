// [BÌA THAY THẾ] Tạo SVG nội bộ an toàn khi tác phẩm không có bìa nguồn phù hợp.
const xmlEscape = (value) => String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const splitTitle = (value) => {
    const words = String(value || '').trim().split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
        if (line && `${line} ${word}`.length > 18) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);
    return lines.slice(0, 3);
};

export const createReplacementBookCover = ({ title, author }) => {
    const lines = splitTitle(title);
    const titleText = lines.map((line, index) =>
        `<tspan x="450" dy="${index === 0 ? 0 : 92}">${xmlEscape(line)}</tspan>`).join('');
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

export const isSafeReplacementCover = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length > 100 * 1024) return false;
    const svg = buffer.toString('utf8');
    if (!/^<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"\s+width="900"\s+height="1350"\s+viewBox="0 0 900 1350">[\s\S]*<\/svg>$/.test(svg)) return false;
    if (/<!DOCTYPE|<!ENTITY|<script|<style|foreignObject|\bon[a-z]+\s*=|href\s*=|url\s*\(/i.test(svg)) return false;
    const allowedElements = new Set(['svg', 'rect', 'path', 'g', 'ellipse', 'circle', 'text', 'tspan', 'line']);
    for (const match of svg.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
        if (!allowedElements.has(match[1].toLowerCase())) return false;
    }
    return !/(?:&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;))/i.test(svg);
};
