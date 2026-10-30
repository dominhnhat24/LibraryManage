// Biến sourceMetadata nhận giá trị từ /project gutenberg\s+e?book|metadata\/tác giả đối chiếu. const không gán lại; let có thể cập nhật.
/**
 * Tệp admin-web/src/utils/book-description.ts: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
const sourceMetadata = /project gutenberg\s+e?book|metadata\/tác giả đối chiếu|csv catalog|\brdf\b|toàn văn gốc|complete text and chapter headings imported|public domain in the usa/i;

/**
 * Hàm/thành phần decodeEntities: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: replace, x, parseInt, Number, isFinite, fromCodePoint, toLowerCase.
 */
function decodeEntities(value: string): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: value .replace(/&#(?:x([\da-f]+)|(\d+));?/gi, (_entity, hex: string | undefined,.
  return value
    .replace(/&#(?:x([\da-f]+)|(\d+));?/gi, (_entity, hex: string | undefined, decimal: string | undefined) => {
      // Biến codePoint nhận giá trị từ hex ? Number.parseInt(hex, 16) : Number(decimal). const không gán lại; let có thể cập nhật.
      const codePoint = hex ? Number.parseInt(hex, 16) : Number(decimal);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff ? String.fr.
      return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : ' ';
    })
    .replace(/&(amp|nbsp|quot|apos|lt|gt);/gi, (_entity, name: string) => ({
      amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
    })[name.toLowerCase()] ?? ' ');
}

/**
 * Hàm/thành phần cleanBookDescription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: decodeEntities, replace, split, map, trim, filter, test, join.
 */
export function cleanBookDescription(value?: string | null): string {
  // if chỉ chạy nhánh này khi điều kiện !value đúng.
  if (!value) return '';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: decodeEntities(value) .replace(/<[^>]*>/g, ' ') .split(/\r?\n|(?<=[.!?])\s+|;\s*.
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .split(/\r?\n|(?<=[.!?])\s+|;\s*/)
    .map((part) => part.replace(/^[\s*_`~#>-]+|[\s*_`~#]+$/g, '').replace(/\s+/g, ' ').trim())
    .filter((part) => part && !sourceMetadata.test(part))
    .join(' ')
    .trim();
}
