// [IMPORT WIKISOURCE] Tìm tác phẩm tiếng Việt có license rõ ràng, bìa hợp lệ và xuất PDF từ WS Export.
import { createHash, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import Book from '../models/book.model.js';
import Chapter from '../models/chapter.model.js';
import BookImportJob from '../models/book-import-job.model.js';
import ApiError from '../utils/api-error.js';
import { createWikisourcePdfStream, findWikisourcePdfFont, wikisourceWikitextToText } from '../utils/wikisource-pdf.js';
import { removePrivateBookFile, savePrivateBookStream } from '../utils/private-book-storage.js';

const WIKI_API = 'https://vi.wikisource.org/w/api.php';
const WIKI_ORIGIN = 'https://vi.wikisource.org';
const MAX_BOOK_BYTES = Math.min(100, Math.max(1, Number(process.env.BOOK_IMPORT_MAX_MB) || 80)) * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const getUserAgent = () => {
    const configuredUserAgent = String(process.env.WIKISOURCE_USER_AGENT || '').trim();
    const contactEmail = String(process.env.WIKISOURCE_CONTACT_EMAIL || process.env.ADMIN_EMAIL
        || process.env.SMTP_USER || process.env.MAIL_USER || '').trim();
    const userAgent = configuredUserAgent || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
        ? `HarveyBookImport/1.0 (mailto:${contactEmail})` : '');
    if (!userAgent || !/\((?:https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/i.test(userAgent)) {
        throw new ApiError(503, 'Configure WIKISOURCE_USER_AGENT with a project contact URL or email before searching Wikisource');
    }
    return userAgent;
};
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let apiRequestQueue = Promise.resolve();
let apiNextAllowedAt = 0;
let apiCooldownUntil = 0;
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

const normalizeText = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code, code[0].toLowerCase() === 'x' ? 16 : 10)))
    .replace(/&#39;|&apos;/gi, "'").replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\[https?:\/\/[^ ]+ ([^\]]+)\]/g, '$1')
    .replace(/'''?([^']+)'''?/g, '$1').replace(/\s+/g, ' ').trim();

const unwrapTextTemplates = (source) => {
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
        if (separator >= 0 && ['văn', 'poem'].includes(name)) output += unwrapTextTemplates(inner.slice(separator + 1));
        index = end;
    }
    return output;
};

const compactWikitext = (wikitext) => {
    let value = String(wikitext || '').replace(/<!--([\s\S]*?)-->/g, ' ')
        .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, ' ')
        .replace(/<ref\b[^/]*\/\s*>/gi, ' ');
    value = unwrapTextTemplates(value);
    return normalizeText(value.replace(/\{\|[\s\S]*?\|\}/g, ' ')
        .replace(/^\s*[=;:*#|].*$/gm, ' '));
};

const isVietnameseText = (value) => {
    const text = String(value || '').toLocaleLowerCase('vi');
    const letters = text.match(/[\p{L}]/gu) || [];
    const accented = text.match(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gu) || [];
    return letters.length >= 1500 && accented.length >= 45 && accented.length / letters.length >= 0.015;
};

export const resolveWikisourceLicense = (wikitext, categories = []) => {
    const templates = [...String(wikitext || '').matchAll(/\{\{\s*([^|}\n]+?)\s*(?:\||\}\})/g)]
        .map((match) => match[1].trim().toLocaleLowerCase('vi'));
    const categoryNames = categories.map((category) => String(category?.title || category || '')
        .replace(/^Thể loại:/i, '').trim().toLocaleLowerCase('vi'));
    for (const [template, license] of LICENSES) {
        if (templates.includes(template) || categoryNames.includes(template)) {
            return { ...license, template, evidence: templates.includes(template) ? 'template' : 'category' };
        }
    }
    return null;
};

const assertAllowedUrl = (value, allowedHosts) => {
    let url;
    try { url = new URL(value); } catch { throw new ApiError(502, 'A source returned an invalid URL'); }
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) {
        throw new ApiError(502, 'A source URL did not match the allowed Wikisource hosts');
    }
    return url;
};

const fetchAllowed = async (value, allowedHosts, options = {}) => {
    let url = assertAllowedUrl(value, allowedHosts);
    const userAgent = getUserAgent();
    for (let redirect = 0; redirect <= 4; redirect += 1) {
        let response;
        try {
            response = await fetch(url, {
                ...options,
                redirect: 'manual',
                signal: options.signal || AbortSignal.timeout(30000),
                headers: { 'User-Agent': userAgent, ...(options.headers || {}) }
            });
        } catch (error) {
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
                throw new ApiError(504, 'Wikisource did not respond before the request timed out');
            }
            throw new ApiError(502, 'Could not connect to the Wikisource export service');
        }
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            await response.body?.cancel().catch(() => {});
            if (!location || redirect === 4) throw new ApiError(502, 'The Wikisource service returned an invalid redirect');
            url = assertAllowedUrl(new URL(location, url).toString(), allowedHosts);
            continue;
        }
        if (response.status === 429) return response;
        if (response.status >= 500) {
            await response.body?.cancel().catch(() => {});
            throw new ApiError(503, 'The Wikisource service is temporarily unavailable; try again shortly');
        }
        return response;
    }
    throw new ApiError(502, 'Too many redirects from the Wikisource service');
};

const fetchJson = async (url) => {
    const request = apiRequestQueue.then(async () => {
        const waitUntil = Math.max(apiNextAllowedAt, apiCooldownUntil);
        if (waitUntil > Date.now()) await sleep(waitUntil - Date.now());
        apiNextAllowedAt = Date.now() + 1100;
        const response = await fetchAllowed(url, [new URL(WIKI_ORIGIN).hostname], {
            headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000)
        });
        if (response.status === 429) {
            const retryAfterSeconds = Number(response.headers.get('retry-after')) || 5;
            const retryAfterMs = Math.max(5000, Math.min(10 * 60 * 1000, retryAfterSeconds * 1000));
            apiCooldownUntil = Date.now() + retryAfterMs;
            await response.body?.cancel().catch(() => {});
            throw new ApiError(503, `Wikisource rate-limited this client; retry in about ${Math.ceil(retryAfterMs / 1000)} seconds`);
        }
        if (!response.ok) throw new ApiError(502, `Wikisource API returned HTTP ${response.status}`);
        if (!response.headers.get('content-type')?.toLowerCase().includes('json')) {
            throw new ApiError(502, 'Wikisource API returned a non-JSON response');
        }
        return response.json();
    });
    apiRequestQueue = request.catch(() => {});
    return request;
};

const readResponseLimited = async (response, maxBytes) => {
    if (!response.body) throw new ApiError(422, 'The source response has no body');
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.byteLength;
            if (totalBytes > maxBytes) {
                await reader.cancel().catch(() => {});
                throw new ApiError(413, 'The source image exceeds the 5 MB limit');
            }
            chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks, totalBytes);
    } finally {
        reader.releaseLock();
    }
};

const getCandidateDetails = async (pageTitle, { minimumCharacters = 5000 } = {}) => {
    const params = new URLSearchParams({
        action: 'query', prop: 'info|categories|pageimages|revisions|links', inprop: 'url',
        cllimit: 'max', plnamespace: '0', pllimit: 'max', piprop: 'name|thumbnail', pithumbsize: '600',
        rvprop: 'content', rvslots: 'main', titles: pageTitle, format: 'json', formatversion: '2'
    });
    const payload = await fetchJson(`${WIKI_API}?${params}`);
    const page = payload?.query?.pages?.[0];
    if (!page || page.missing || page.invalid || page.ns !== 0) return null;
    const wikitext = page.revisions?.[0]?.slots?.main?.content || '';
    let license = resolveWikisourceLicense(wikitext, page.categories);
    let readableContent = wikitext;
    let bodyText = compactWikitext(wikitext);
    const authorParameter = wikitext.match(/(?:ghi đè tác giả|Tác giả|Author)[ \t]*=[ \t]*([^\r\n]*)/i)?.[1] || '';
    const author = normalizeText(authorParameter
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\{\{[^{}]*\}\}/g, ' ')
        .replace(/^\s*\|?\s*ghi đè tác giả\s*=\s*/i, '')
        .replace(/^\s*của\s+/i, '')
        .replace(/\s*\}\}\s*$/, '').trim());
    const translator = normalizeText(wikitext.match(/(?:dịch giả|translator)[ \t]*=[ \t]*([^\r\n]*)/i)?.[1]
        ?.replace(/\s*\}\}\s*$/, '').trim() || '');
    // Some Wikisource volumes carry only a US term template on the work page.
    // Accept a Vietnam-PD author-page record only when the named author page itself
    // is tagged PVCC-Việt Nam, gives a death year whose 50-year term has expired,
    // and explicitly lists this exact title outside its translated-works section.
    if (!license && author && !translator && !author.includes(',')) {
        try {
            const authorParams = new URLSearchParams({
                action: 'query', prop: 'categories|revisions', cllimit: 'max',
                rvprop: 'content', rvslots: 'main', titles: `Tác gia:${author}`,
                format: 'json', formatversion: '2'
            });
            const authorPayload = await fetchJson(`${WIKI_API}?${authorParams}`);
            const authorPage = authorPayload?.query?.pages?.[0];
            const authorWikitext = authorPage?.revisions?.[0]?.slots?.main?.content || '';
            const authorLicense = resolveWikisourceLicense('', authorPage?.categories || []);
            const deathYear = (authorPage?.categories || []).map((item) =>
                String(item.title || '').match(/^Thể loại:Mất\s+(\d{4})$/i)?.[1])
                .filter(Boolean).map(Number).sort((a, b) => b - a)[0];
            const translatedSectionAt = authorWikitext.search(/^==+\s*Tác phẩm dịch\s*==+\s*$/im);
            const ownWorksText = translatedSectionAt < 0 ? authorWikitext : authorWikitext.slice(0, translatedSectionAt);
            const normalizePageTitle = (value) => normalizeText(String(value || '').replace(/_/g, ' '))
                .toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
            const listedWorks = [...ownWorksText.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]
                .map((match) => match[1].split('#')[0].replace(/^(?:vi:)?/i, '').trim());
            const titleListedByAuthor = listedWorks.some((listedTitle) =>
                normalizePageTitle(listedTitle) === normalizePageTitle(page.title));
            if (authorLicense?.template === 'pvcc-việt nam' && deathYear && deathYear <= 1975 && titleListedByAuthor) {
                license = {
                    ...authorLicense,
                    evidence: `author-page:${authorPage.title};death-year:${deathYear};title-listed:true`
                };
            }
        } catch (error) {
            console.warn(`Wikisource author-rights check failed for ${page.title}: ${error.message}`);
        }
    }
    const reasons = [];
    const title = normalizeText(page.title.replace(/_/g, ' '));

    // Root pages often contain transclusion templates. Use MediaWiki's rendered page when raw wikitext is only a short index.
    // Some Wikisource scans store hundreds of pages in <pages> transclusion tags.
    // Raw wikitext can look non-empty but contain only title/TOC text; render these
    // pages before deciding the source is complete.
    if (bodyText.length < 50000 && page.pageid) {
        try {
            const parseParams = new URLSearchParams({
                action: 'parse', pageid: String(page.pageid), prop: 'text', format: 'json', formatversion: '2'
            });
            const parsed = await fetchJson(`${WIKI_API}?${parseParams}`);
            const html = parsed?.parse?.text || '';
            const renderedText = normalizeText(html
                .replace(/<br\s*\/?\s*>/gi, '\n')
                .replace(/<\/(?:p|div|li|h[1-6]|poem)\s*>/gi, '\n')
                .replace(/<[^>]*>/g, ' '));
            if (renderedText.length > bodyText.length) {
                bodyText = renderedText;
                readableContent = html;
            }
        } catch (error) {
            console.warn(`Wikisource rendered-text check failed for ${page.title}: ${error.message}`);
        }
    }

    // Wikisource book landing pages often contain only a table of contents; fetch their linked chapter subpages.
    if (bodyText.length < 5000) {
        const prefix = `${page.title}/`;
        const linkedTitles = [...new Set((page.links || []).map((link) => link.title)
            .filter((linkedTitle) => typeof linkedTitle === 'string' && linkedTitle.startsWith(prefix)))].slice(0, 40);
        if (linkedTitles.length) {
            const chapterParams = new URLSearchParams({
                action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main',
                titles: linkedTitles.join('|'), format: 'json', formatversion: '2'
            });
            const chapterPayload = await fetchJson(`${WIKI_API}?${chapterParams}`);
            const chapterPages = (chapterPayload?.query?.pages || []).filter((chapterPage) => !chapterPage.missing)
                .map((chapterPage) => ({
                    title: chapterPage.title,
                    content: chapterPage.revisions?.[0]?.slots?.main?.content || ''
                })).filter((chapterPage) => chapterPage.content.trim());
            if (chapterPages.length) {
                readableContent = chapterPages.map((chapterPage) => {
                    const chapterTitle = normalizeText(chapterPage.title.slice(prefix.length).replace(/_/g, ' '));
                    return `== ${chapterTitle} ==\n${chapterPage.content}`;
                }).join('\n\n');
                bodyText = compactWikitext(readableContent);
            }
        }
    }

    if (!license) reasons.push('Trang nguồn không có license thuộc danh sách được hỗ trợ');
    if (!author || author.length > 120) reasons.push('Không xác định được tác giả từ trang nguồn');
    if (!isVietnameseText(bodyText)) reasons.push('Nội dung trích xuất chưa đủ bằng chứng là tiếng Việt đầy đủ');
    if (bodyText.length < minimumCharacters) reasons.push('Văn bản quá ngắn để coi là một cuốn sách đầy đủ');
    if (/vi phạm bản quyền|vpbq|thiếu giấy phép/i.test(wikitext)) reasons.push('Trang có cảnh báo quyền hoặc thiếu giấy phép');

    const translatorIsContested = /dịch giả\s*=\s*[^|}\n]+/i.test(wikitext)
        && /hiện nay có ý kiến cho là|vẫn còn tranh luận|chưa thống nhất về (?:tác giả|người dịch)/i.test(wikitext);
    if (translatorIsContested) reasons.push('Nguồn ghi nhận attribution người dịch còn tranh luận; không đủ điều kiện xác minh bản dịch');

    if (!title || title.length > 200) reasons.push('Tiêu đề không hợp lệ hoặc vượt giới hạn lưu trữ');
    if (!page.fullurl || !page.fullurl.startsWith(`${WIKI_ORIGIN}/wiki/`)) reasons.push('Không xác minh được URL nguồn Wikisource');
    const publicationYear = Number(wikitext.match(/(?:Năm|Năm xuất bản|Năm sáng tác)\s*=\s*(\d{4})/i)?.[1]) || null;
    const summary = bodyText.slice(0, 700);
    return {
        id: page.title,
        title,
        author,
        translator,
        summary,
        source: 'Wikisource tiếng Việt',
        sourceUrl: page.fullurl,
        language: 'vi',
        format: 'PDF',
        license: license?.name || '',
        licenseUrl: license?.url || '',
        coverUrl: '',
        coverVerified: false,
        coverLicense: '',
        coverLicenseUrl: '',
        coverSourceUrl: '',
        coverAttribution: '',
        coverWidth: null,
        coverHeight: null,
        contentCharacters: bodyText.length,
        publicationYear: publicationYear && publicationYear >= 1000 && publicationYear <= new Date().getFullYear() ? publicationYear : null,
        eligible: reasons.length === 0,
        reasons,
        _license: license,
        _wikitext: readableContent,
        _cover: null
    };
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
    const results = new Array(items.length);
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index], index);
        }
    }));
    return results;
};

// [TÌM KIẾM NGUỒN] API MediaWiki chính thức; chỉ trả ứng viên có metadata, nội dung, quyền và bìa đạt yêu cầu.
export const searchWikisourceBooks = async (query, { minimumCharacters = 5000 } = {}) => {
    const normalizedQuery = String(query || '').trim().slice(0, 120);
    if (normalizedQuery.length < 2) throw new ApiError(400, 'Nhập ít nhất 2 ký tự để tìm sách');
    const params = new URLSearchParams({
        action: 'query', list: 'search', srnamespace: '0', srlimit: '8',
        srsearch: normalizedQuery, format: 'json', formatversion: '2'
    });
    const response = await fetchJson(`${WIKI_API}?${params}`);
    const results = response?.query?.search || [];
    // MediaWiki rate-limits anonymous clients; keep source metadata requests gentle and predictable.
    const examined = await mapWithConcurrency(results, 2, async (result) => {
        try {
            const candidate = await getCandidateDetails(result.title, { minimumCharacters });
            if (!candidate) return null;
            if (candidate.eligible) {
                try {
                    findWikisourcePdfFont();
                    candidate.exportAvailable = true;
                } catch (error) {
                    candidate.eligible = false;
                    candidate.exportAvailable = false;
                    candidate.reasons.push(error.message);
                }
            }
            return candidate;
        } catch (error) {
            return {
                id: result.title,
                title: result.title,
                eligible: false,
                reasons: [error instanceof ApiError ? error.message : 'Không thể xác minh đầy đủ trang nguồn lúc này']
            };
        }
    });
    const candidates = examined.filter(Boolean);
    const eligible = candidates.filter((item) => item.eligible).map(({ _license, _wikitext, _cover, ...item }) => item);
    const reasonCounts = {};
    for (const candidate of candidates) {
        for (const reason of candidate.reasons || []) reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
    return {
        query: normalizedQuery,
        found: results.length,
        checked: candidates.length,
        eligible: eligible.length,
        excluded: Math.max(0, results.length - eligible.length),
        exclusions: Object.entries(reasonCounts).map(([reason, count]) => ({ reason, count })),
        excludedCandidates: candidates.filter((item) => !item.eligible)
            .map(({ id, title, reasons }) => ({ id, title, reasons })),
        candidates: eligible
    };
};

const titleKey = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

const claimImportJob = async (candidate) => {
    const canonicalId = `vi:${titleKey(candidate.title)}::${titleKey(candidate.author)}`;
    const jobId = `wikisource:${createHash('sha256').update(canonicalId).digest('hex')}`;
    const now = new Date();
    const existing = await BookImportJob.findById(jobId).select('+lock_token').lean();
    if (existing?.status === 'imported') {
        return { completed: true, jobId, bookId: existing.book_id };
    }
    if (existing?.status === 'duplicate') {
        return { duplicate: true, jobId, bookId: existing.book_id };
    }
    if (existing?.status === 'importing' && existing.lease_expires_at > now) {
        throw new ApiError(409, 'Tác phẩm này đang được một tác vụ khác import');
    }
    const lockToken = randomUUID();
    const leaseExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    if (!existing) {
        try {
            await BookImportJob.create({ _id: jobId, source: 'wikisource', source_id: candidate.id,
                status: 'importing', lock_token: lockToken, lease_expires_at: leaseExpiresAt, attempts: 1 });
            return { jobId, lockToken };
        } catch (error) {
            if (error.code === 11000) throw new ApiError(409, 'Tác phẩm này vừa được một tác vụ khác bắt đầu import');
            throw error;
        }
    }
    const updated = await BookImportJob.updateOne({
        _id: jobId,
        $or: [{ status: 'failed' }, { status: 'importing', lease_expires_at: { $lte: now } }]
    }, { $set: { status: 'importing', lock_token: lockToken, lease_expires_at: leaseExpiresAt,
        last_error: null, source_id: candidate.id }, $inc: { attempts: 1 } });
    if (updated.modifiedCount !== 1) throw new ApiError(409, 'Tác phẩm này vừa được một tác vụ khác bắt đầu import');
    return { jobId, lockToken };
};

const findExistingBook = async (candidate) => {
    const existingBySource = await Book.findOne({ import_source: 'wikisource', source_id: candidate.id }).select('_id title').lean();
    if (existingBySource) return existingBySource;
    const titlePattern = new RegExp(`^${candidate.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const authorPattern = new RegExp(`^${candidate.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    return Book.findOne({ title: titlePattern, author_name: authorPattern }).select('_id title').lean();
};

const chapterSegmentsFromSource = (source, title) => {
    const headings = [];
    const headingPattern = /^={2,}\s*(.+?)\s*={2,}\s*$/gm;
    for (const match of source.matchAll(headingPattern)) headings.push({ index: match.index, end: match.index + match[0].length, title: normalizeText(match[1]) });
    const htmlHeadingPattern = /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
    for (const match of source.matchAll(htmlHeadingPattern)) headings.push({ index: match.index, end: match.index + match[0].length, title: normalizeText(match[1].replace(/<[^>]*>/g, ' ')) });
    headings.sort((left, right) => left.index - right.index);

    const sections = [];
    if (headings.length >= 2) {
        const first = headings[0];
        if (first.index > 0) sections.push({ title: `${title} · Mở đầu`, source: source.slice(0, first.index) });
        for (let index = 0; index < headings.length; index += 1) {
            const heading = headings[index];
            const next = headings[index + 1];
            sections.push({ title: heading.title || `${title} · Phần ${index + 1}`, source: source.slice(heading.end, next?.index ?? source.length) });
        }
    }
    let meaningful = sections.map((section) => ({ ...section, content: wikisourceWikitextToText(section.source, { minCharacters: 0 }) }))
        .filter((section) => section.content.length >= 500);
    if (meaningful.length < 2) {
        const fullText = wikisourceWikitextToText(source, { minCharacters: 0 }).trim();
        if (!fullText) return [];
        meaningful = [{ title: '', content: fullText }];
    }

    // Keep source chapter titles when present. Split long chapters (or unstructured
    // works) into readable pages without inventing chapter names or content.
    const pageSize = 14000;
    return meaningful.flatMap((section) => {
        const paragraphs = String(section.content).split(/\n\s*\n/);
        const pages = [];
        let page = '';
        for (const paragraph of paragraphs) {
            let remaining = paragraph.trim();
            while (remaining.length > pageSize) {
                const cut = remaining.lastIndexOf(' ', pageSize);
                const splitAt = cut > pageSize * 0.6 ? cut : pageSize;
                const part = remaining.slice(0, splitAt).trim();
                if (page) { pages.push(page); page = ''; }
                pages.push(part);
                remaining = remaining.slice(splitAt).trim();
            }
            if (remaining && page.length + remaining.length + 2 > pageSize) {
                pages.push(page); page = remaining;
            } else if (remaining) page = page ? `${page}\n\n${remaining}` : remaining;
        }
        if (page) pages.push(page);
        if (!pages.length) return [];
        return pages.map((content, index) => ({
            title: section.title
                ? (pages.length === 1 ? section.title : `${section.title} · Trang ${index + 1}`)
                : `Trang ${index + 1}`,
            content
        }));
    });
};

// Build readable, numbered chapter rows from the same verified Vietnamese source as its ebook PDF.
export const ensureWikisourceChapters = async ({ pageTitle, bookId, genre = 'van_hoc_viet_nam' }) => {
    const existing = await Chapter.countDocuments({ book_id: bookId });
    if (existing >= 1) return { created: 0, total: existing };
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters: genre === 'tho_viet_nam' ? 500 : 5000 });
    if (!candidate?.eligible || !candidate._wikitext) throw new ApiError(422, 'Không thể xác minh lại nội dung và giấy phép Wikisource');
    const sections = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    if (!sections.length) throw new ApiError(422, 'Nguồn không có nội dung đủ để tạo trang đọc');
    let created = 0;
    for (let index = 0; index < sections.length; index += 1) {
        const section = sections[index];
        const chapterTitle = String(section.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200);
        const content = String(section.content || '').slice(0, 199000);
        const result = await Chapter.updateOne(
            { book_id: bookId, chapter_number: index + 1 },
            { $setOnInsert: { book_id: bookId, title: chapterTitle, slug: `vi-ws-${bookId}-${index + 1}`, content, chapter_number: index + 1, access_level: 'free' } },
            { upsert: true }
        );
        if (result.upsertedCount) created += 1;
    }
    return { created, total: await Chapter.countDocuments({ book_id: bookId }) };
};

// Rebuild only local reading pages from the same verified Wikisource source when older rows exceed the page-size limit.
export const rebuildWikisourceChapters = async ({ pageTitle, bookId, genre = 'van_hoc_viet_nam' }) => {
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters: genre === 'tho_viet_nam' ? 500 : 5000 });
    if (!candidate?.eligible || !candidate._wikitext) throw new ApiError(422, 'Không thể xác minh lại nội dung và giấy phép Wikisource');
    const pages = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    if (!pages.length || pages.some((page) => page.content.length > 14000)) {
        throw new ApiError(422, 'Nguồn không tạo được các trang đọc hợp lệ dưới giới hạn 14.000 ký tự');
    }
    const existing = await Chapter.find({ book_id: bookId }).select('content').lean();
    const oldLength = existing.reduce((sum, page) => sum + String(page.content || '').length, 0);
    const newLength = pages.reduce((sum, page) => sum + page.content.length, 0);
    if (oldLength && newLength < oldLength * 0.85) {
        throw new ApiError(422, `Nguồn đọc lại ngắn hơn dữ liệu hiện tại (${newLength}/${oldLength} ký tự)`);
    }
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await Chapter.deleteMany({ book_id: bookId }, { session });
            await Chapter.insertMany(pages.map((page, index) => ({
                book_id: bookId,
                title: String(page.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200),
                slug: `vi-ws-${bookId}-${index + 1}`,
                content: String(page.content || '').slice(0, 199000),
                chapter_number: index + 1,
                access_level: 'free'
            })), { ordered: true, session });
        });
    } finally { await session.endSession(); }
    return { total: pages.length, oldLength, newLength, maxPageCharacters: Math.max(...pages.map((page) => page.content.length)) };
};

const saveImportState = async (job, values) => {
    try {
        await BookImportJob.updateOne({ _id: job.jobId, lock_token: job.lockToken }, { $set: values });
    } catch (error) {
        console.error(`Book import state update failed for ${job.jobId}: ${error.message}`);
    }
};

// [IMPORT TÁC PHẨM] Recheck license/content/cover, stream PDF to private storage, then create the Book record.
export const importWikisourceBook = async ({ pageTitle, ownerId, confirmLicense, confirmCover, genre = 'van_hoc_viet_nam' }) => {
    if (typeof pageTitle !== 'string' || pageTitle.length > 255) throw new ApiError(400, 'Tác phẩm nguồn không hợp lệ');
    if (confirmLicense !== true) {
        throw new ApiError(400, 'Hãy xác nhận license văn bản trước khi import');
    }
    const minimumCharacters = genre === 'tho_viet_nam' ? 500 : 5000;
    const candidate = await getCandidateDetails(pageTitle, { minimumCharacters });
    if (!candidate?.eligible) throw new ApiError(422, 'Tác phẩm không còn đủ điều kiện import', candidate?.reasons || []);
    if (!candidate._wikitext || candidate.contentCharacters < minimumCharacters) {
        throw new ApiError(422, 'Nguồn không còn đủ nội dung để tạo PDF');
    }
    const sourceChapters = chapterSegmentsFromSource(candidate._wikitext, candidate.title);
    if (!sourceChapters.length) throw new ApiError(422, 'Nguồn không có nội dung đủ để tạo trang đọc Harvey');
    const job = await claimImportJob(candidate);
    if (job.completed || job.duplicate) {
        const existing = job.bookId ? await Book.findById(job.bookId).select('_id title').lean() : null;
        if (existing) return { status: job.duplicate ? 'duplicate' : 'already_imported', book: existing };
        throw new ApiError(409, 'Bản ghi import trước đó không còn; cần quản trị viên kiểm tra trước khi thử lại');
    }

    let ebookKey = null;
    let coverKey = null;
    let createdBookId = null;
    let bookCreated = false;
    try {
        const duplicate = await findExistingBook(candidate);
        if (duplicate) {
            await saveImportState(job, { status: 'duplicate', book_id: duplicate._id, lock_token: null, lease_expires_at: null });
            return { status: 'duplicate', book: duplicate };
        }

        const generatedPdf = createWikisourcePdfStream({
            title: candidate.title, author: candidate.author, wikitext: candidate._wikitext,
            sourceUrl: candidate.sourceUrl, license: candidate._license
        });
        const ebook = await savePrivateBookStream({
            stream: generatedPdf.stream, originalname: `${candidate.title}.pdf`,
            mimetype: 'application/pdf', category: 'ebook', maxBytes: MAX_BOOK_BYTES
        });
        ebookKey = ebook.file_key;
        const bookId = new mongoose.Types.ObjectId();
        createdBookId = bookId;
        const book = await Book.create({
            _id: bookId,
            title: candidate.title,
            author_name: candidate.author,
            category: 'ebook',
            genre,
            publication_year: candidate.publicationYear,
            description: `${candidate.summary}\n\nNguồn: ${candidate.sourceUrl}\nGiấy phép: ${candidate._license.name} (${candidate._license.url})`.slice(0, 5000),
            cover_url: '',
            cover_file_key: null,
            access_level: 'free',
            file_key: ebookKey,
            file_original_name: `${candidate.title}.pdf`.slice(0, 200),
            owner: ownerId,
            status: 'published',
            import_source: 'wikisource',
            source_id: candidate.id,
            source_url: candidate.sourceUrl,
            license_name: candidate._license.name,
            license_url: candidate._license.url,
            cover_source_url: null,
            cover_license_name: null,
            cover_license_url: null,
            cover_attribution: null,
            language: 'vi',
            file_format: 'PDF',
            file_size: ebook.size,
            verified_at: new Date()
        });
        await Chapter.insertMany(sourceChapters.map((section, index) => ({
            book_id: book._id,
            title: String(section.title || `${candidate.title} · Phần ${index + 1}`).slice(0, 200),
            slug: `vi-ws-${book._id}-${index + 1}`,
            content: String(section.content || '').slice(0, 199000),
            chapter_number: index + 1,
            access_level: 'free'
        })), { ordered: true });
        bookCreated = true;
        await saveImportState(job, { status: 'imported', book_id: book._id, lock_token: null, lease_expires_at: null, last_error: null });
        return { status: 'imported', book: { _id: book.id, title: book.title, sourceUrl: candidate.sourceUrl, license: candidate._license.name, fileSize: ebook.size } };
    } catch (error) {
        if (!bookCreated) {
            await Promise.allSettled([
                removePrivateBookFile(ebookKey), removePrivateBookFile(coverKey),
                createdBookId ? Book.deleteOne({ _id: createdBookId }) : Promise.resolve()
            ]);
            const safeError = error instanceof ApiError ? error.message : 'Import thất bại trong bước lưu file hoặc dữ liệu';
            await saveImportState(job, { status: 'failed', last_error: safeError, lock_token: null, lease_expires_at: null });
        }
        throw error;
    }
};
