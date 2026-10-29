// Find exact, reusable Wikimedia Commons scans and save them in Harvey's private book store.
// Dry-run by default. Run with --apply to update covers; never changes Book/Chapter content.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import { removePrivateBookFile, resolvePrivateBookFile, savePrivateBookCover, inspectPrivateBookCover } from '../src/utils/private-book-storage.js';
import { readFile } from 'node:fs/promises';

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((value) => value.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1]) || 1) : Infinity;
const API = 'https://commons.wikimedia.org/w/api.php';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let nextRequestAt = 0;
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const decode = (metadata, name) => String(metadata?.[name]?.value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, ' ').replace(/\s+/g, ' ').trim();
const acceptedLicense = (value) => /^(?:public domain(?: mark 1\.0)?|cc0(?: 1\.0)?|cc by(?:-sa)?(?: 2\.[05]| 3\.0| 4\.0)?|creative commons attribution(?:-sharealike)?(?: 2\.[05]| 3\.0| 4\.0)?)$/i.test(String(value || '').trim())
  && !/noncommercial|no derivatives|nc|nd/i.test(value);
const publicApiBase = (process.env.PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api/v1`).replace(/\/+$/, '');
const request = async (url) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await wait(delay);
    const response = await fetch(url, { headers: { 'User-Agent': process.env.WIKISOURCE_USER_AGENT || 'HarveyLibrary/1.0 (https://localhost; book cover rights review)' }, signal: AbortSignal.timeout(30000) });
    nextRequestAt = Date.now() + 1200;
    if (response.ok) return response;
    if (response.status !== 429 && response.status !== 503) throw new Error(`HTTP ${response.status}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    const delayMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 3000 * (2 ** attempt));
    console.log(JSON.stringify({ event: 'commons-throttled', status: response.status, retryMs: delayMs }));
    await wait(delayMs);
  }
  throw new Error('Commons rate limit persisted after five retries');
};
const commonsCandidates = async (book) => {
  const query = `"${book.title}" ${book.author_name}`.slice(0, 240);
  const url = new URL(API);
  url.search = new URLSearchParams({ action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '10', gsrsearch: query,
    prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '900', format: 'json' }).toString();
  const data = await (await request(url)).json();
  const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl || !/^image\/(?:jpeg|png)$/i.test(info.thumbmime || '')) continue;
    const meta = info.extmetadata || {};
    const evidence = normalize([page.title, decode(meta, 'ObjectName'), decode(meta, 'ImageDescription'), decode(meta, 'Title'), decode(meta, 'Artist')].join(' '));
    const titleWords = normalize(book.title).split(' ').filter((word) => word.length > 2);
    const titleCoverage = titleWords.length ? titleWords.filter((word) => evidence.includes(word)).length / titleWords.length : 0;
    const authorWords = normalize(book.author_name).split(' ').filter((word) => word.length > 2);
    const authorKey = authorWords.at(-1);
    if (titleCoverage < 0.8 || !authorKey || !evidence.includes(authorKey)) continue;
    const licenseName = decode(meta, 'LicenseShortName') || decode(meta, 'UsageTerms');
    if (!acceptedLicense(licenseName)) continue;
    const licenseUrl = decode(meta, 'LicenseUrl') || decode(meta, 'UsageTerms');
    const attribution = decode(meta, 'Attribution') || decode(meta, 'Artist') || decode(meta, 'Credit');
    if (!attribution) continue;
    const sourceUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%3A/g, ':').replace(/%20/g, '_')}`;
    const imageResponse = await request(info.thumburl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const mimetype = String(imageResponse.headers.get('content-type') || info.thumbmime).split(';')[0].toLowerCase();
    inspectPrivateBookCover({ buffer, mimetype });
    return { buffer, mimetype, sourceUrl, licenseName, licenseUrl, attribution, fileTitle: page.title };
  }
  return null;
};

await connectDB();
let saved = 0;
let missing = 0;
let alreadyVerified = 0;
try {
  const books = (await Book.find({ status: 'published' }).select('+cover_file_key').sort({ title: 1 }).lean()).slice(0, limit);
  console.log(JSON.stringify({ event: 'cover-backfill-start', database: mongoose.connection.name, apply, books: books.length }));
  for (const book of books) {
    let verifiedKey = false;
    if (book.cover_file_key && !/\.svg$/i.test(book.cover_file_key) && book.cover_source_url && book.cover_license_name && book.cover_attribution) {
      try {
        const path = await resolvePrivateBookFile(book.cover_file_key);
        const buffer = await readFile(path);
        const mimetype = /\.png$/i.test(path) ? 'image/png' : 'image/jpeg';
        inspectPrivateBookCover({ buffer, mimetype });
        verifiedKey = true;
      } catch { verifiedKey = false; }
    }
    if (verifiedKey) {
      alreadyVerified += 1;
      if (apply && book.cover_url !== `${publicApiBase}/books/${book._id}/cover`) {
        await Book.updateOne({ _id: book._id }, { $set: { cover_url: `${publicApiBase}/books/${book._id}/cover` } });
      }
      console.log(JSON.stringify({ event: 'cover-already-verified', title: book.title, source: book.cover_source_url }));
      continue;
    }
    try {
      const candidate = await commonsCandidates(book);
      if (!candidate) {
        missing += 1;
        if (apply) {
          await Book.updateOne({ _id: book._id }, { $set: { cover_url: '', cover_file_key: null, cover_source_url: null, cover_license_name: null, cover_license_url: null, cover_attribution: null } });
          if (book.cover_file_key) await removePrivateBookFile(book.cover_file_key).catch(() => {});
        }
        console.log(JSON.stringify({ event: 'cover-not-found', title: book.title, author: book.author_name }));
        await wait(300);
        continue;
      }
      if (apply) {
        const stored = await savePrivateBookCover({ buffer: candidate.buffer, mimetype: candidate.mimetype });
        const previousKey = book.cover_file_key;
        try {
          await Book.updateOne({ _id: book._id }, { $set: {
            cover_file_key: stored.file_key, cover_url: `${publicApiBase}/books/${book._id}/cover`,
            cover_source_url: candidate.sourceUrl, cover_license_name: candidate.licenseName,
            cover_license_url: candidate.licenseUrl, cover_attribution: candidate.attribution
          } });
          await resolvePrivateBookFile(stored.file_key);
          if (previousKey && previousKey !== stored.file_key) await removePrivateBookFile(previousKey).catch(() => {});
        } catch (error) { await removePrivateBookFile(stored.file_key).catch(() => {}); throw error; }
        saved += 1;
      }
      console.log(JSON.stringify({ event: apply ? 'cover-saved' : 'cover-ready', title: book.title, source: candidate.sourceUrl, license: candidate.licenseName, commonsFile: candidate.fileTitle }));
    } catch (error) {
      missing += 1;
      console.log(JSON.stringify({ event: 'cover-search-error', title: book.title, error: String(error.message || error).slice(0, 180) }));
    }
    await wait(300);
  }
  console.log(JSON.stringify({ event: 'cover-backfill-end', saved, missing, alreadyVerified, total: books.length }));
} finally { await mongoose.disconnect(); }
