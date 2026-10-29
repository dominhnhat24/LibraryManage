const SUPPORTED_READER_FORMATS = new Set(['PDF', 'EPUB']);

// Choose the reader from actual available content plus its stored file metadata.
// EPUB is recognized as a source format but the current web app has no EPUB reader.
export const resolveBookReaderMode = ({ file_format, file_key, hasReadableChapters }) => {
    if (hasReadableChapters) return 'chapters';
    if (!file_key) return 'unavailable';

    const format = String(file_format || '').trim().toUpperCase();
    if (format === 'PDF') return 'pdf';
    if (format === 'EPUB') return 'unsupported';
    if (SUPPORTED_READER_FORMATS.has(format)) return 'unsupported';
    return 'unavailable';
};
