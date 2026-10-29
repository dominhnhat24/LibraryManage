const sourceMetadata = /project gutenberg\s+e?book|metadata\/tác giả đối chiếu|csv catalog|\brdf\b|toàn văn gốc|complete text and chapter headings imported|public domain in the usa/i;

function decodeEntities(value: string): string {
  return value
    .replace(/&#(?:x([\da-f]+)|(\d+));?/gi, (_entity, hex: string | undefined, decimal: string | undefined) => {
      const codePoint = hex ? Number.parseInt(hex, 16) : Number(decimal);
      return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : ' ';
    })
    .replace(/&(amp|nbsp|quot|apos|lt|gt);/gi, (_entity, name: string) => ({
      amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
    })[name.toLowerCase()] ?? ' ');
}

export function cleanBookDescription(value?: string | null): string {
  if (!value) return '';
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .split(/\r?\n|(?<=[.!?])\s+|;\s*/)
    .map((part) => part.replace(/^[\s*_`~#>-]+|[\s*_`~#]+$/g, '').replace(/\s+/g, ' ').trim())
    .filter((part) => part && !sourceMetadata.test(part))
    .join(' ')
    .trim();
}
