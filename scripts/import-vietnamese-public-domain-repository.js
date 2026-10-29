// Discover and import complete Vietnamese books from the Vietnamese public-domain repository.
// Dry-run is the default. Use --apply to persist source-verified chapters.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import User from '../src/models/user.model.js';

const ORIGIN = 'https://pd.books.xrvs.net';
const RIGHTS_URL = `${ORIGIN}/vi/`;
const USER_AGENT = process.env.WIKISOURCE_USER_AGENT || 'HarveyLibrary/1.0 (Vietnamese public-domain books import)';
const apply = process.argv.includes('--apply');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decode = (value) => String(value || '').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const plainText = (value) => decode(value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, '\n')
  .replace(/<[^>]*>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
const normalize = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

async function fetchHtml(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(45000) });
      if (response.status === 429 || response.status === 503) {
        const retrySeconds = Number(response.headers.get('retry-after')) || 0;
        await sleep(Math.min(60000, retrySeconds ? retrySeconds * 1000 : 4000 * (2 ** attempt)));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(Math.min(30000, 1500 * (2 ** attempt)));
    }
  }
  throw lastError || new Error(`Could not fetch ${url}`);
}

const links = (html) => [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  .map((match) => ({ href: match[1], label: plainText(match[2]) }));

async function discoverVietnameseBookIndexes() {
  const booksHtml = await fetchHtml(`${ORIGIN}/vi/books/`);
  const collectionHrefs = [...new Set(links(booksHtml).map((item) => item.href)
    .filter((href) => /^\/vi\/books\/vi\//.test(href) || /^https:\/\/pd\.books\.xrvs\.net\/vi\/books\/vi\//.test(href)))];
  const candidates = [];
  for (const href of collectionHrefs) {
    const collectionUrl = new URL(href, ORIGIN).toString();
    const collectionHtml = await fetchHtml(collectionUrl);
    for (const item of links(collectionHtml)) {
      const url = new URL(item.href, ORIGIN);
      if (url.hostname === 'pd.books.xrvs.net' && /^\/vi\/books\/vi\/[a-z0-9-]+\/$/i.test(url.pathname)) {
        candidates.push({ url: url.toString(), titleFromList: item.label });
      }
    }
  }
  return [...new Map(candidates.map((item) => [item.url, item])).values()];
}

function getBookMetadata(html) {
  const main = html.match(/<section\b[^>]*class=["'][^"']*index-content[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] || '';
  const title = plainText(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const authorSource = plainText(main.match(/<li>\s*(?:Tác giả|Author):\s*([\s\S]*?)<\/li>/i)?.[1] || '');
  const deathYear = Number(authorSource.match(/[（(][^）)]*?(\d{4})\s*[）)]?$/)?.[1]) ||
    Number(authorSource.match(/[—–-]\s*(\d{4})\s*\)?$/)?.[1]) || null;
  const author = authorSource.replace(/\s*[（(][^）)]*?[）)]\s*$/, '').trim();
  const publication = plainText(main.match(/<li>\s*(?:Xuất bản|Published):\s*([\s\S]*?)<\/li>/i)?.[1] || '');
  const publicationYears = [...publication.matchAll(/\b(\d{4})\b/g)].map((item) => Number(item[1]));
  const toc = html.match(/<section\b[^>]*class=["'][^"']*toc[^"']*["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] || '';
  const chapters = links(toc).filter((item) => /^\/vi\/books\/vi\//.test(item.href) || /^https:\/\/pd\.books\.xrvs\.net\/vi\/books\/vi\//.test(item.href))
    .map((item) => ({ title: item.label, url: new URL(item.href, ORIGIN).toString() }));
  return { title, author, authorSource, deathYear, publication, publicationYears, chapters };
}

function parseChapter(html, expectedTitle) {
  const article = html.match(/<article\b[^>]*id=["']main["'][^>]*>([\s\S]*?)<\/article>/i)?.[1] || '';
  const title = plainText(article.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || expectedTitle);
  const body = article.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, '');
  const content = plainText(body).replace(/\n{3,}/g, '\n\n');
  return { title, content };
}

async function inspectBook(index) {
  const indexHtml = await fetchHtml(index.url);
  const metadata = getBookMetadata(indexHtml);
  if (!metadata.title || !metadata.author || /^(unknown|various|anonymous)$/i.test(metadata.author)) throw new Error('Thiếu tên sách hoặc tác giả xác nhận trong trang sách');
  const hasExpiredAuthorTerm = metadata.deathYear && metadata.deathYear <= 1975;
  const hasExpiredPosthumousTerm = !metadata.deathYear && metadata.publicationYears.length > 0 && Math.max(...metadata.publicationYears) <= 1975;
  if (!hasExpiredAuthorTerm && !hasExpiredPosthumousTerm) throw new Error(`Không đủ căn cứ thời hạn quyền Việt Nam: ${metadata.author}; ${metadata.publication}`);
  if (!metadata.chapters.length) throw new Error('Danh mục không có chương nguồn');
  const chapters = [];
  for (const chapter of metadata.chapters) {
    const html = await fetchHtml(chapter.url);
    const parsed = parseChapter(html, chapter.title);
    if (!parsed.content || parsed.content.length < 300) throw new Error(`Chương nguồn quá ngắn hoặc rỗng: ${chapter.title}`);
    if (parsed.content.length > 199000) throw new Error(`Chương vượt giới hạn lưu Harvey: ${chapter.title}`);
    chapters.push(parsed);
    await sleep(150);
  }
  const totalCharacters = chapters.reduce((sum, chapter) => sum + chapter.content.length, 0);
  if (totalCharacters < 10000 || chapters.length < 5) throw new Error(`Toàn văn chưa đạt ngưỡng kiểm tra (${chapters.length} chương, ${totalCharacters} ký tự)`);
  return { ...metadata, chapters, totalCharacters, sourceUrl: index.url };
}

const summary = [];
try {
  await connectDB();
  const indexes = await discoverVietnameseBookIndexes();
  const countsBefore = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const configuredOwner = process.env.ADMIN_OWNER_ID
    ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean() : null;
  const owner = configuredOwner || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
  if (apply && !owner) throw new Error('Không tìm thấy tài khoản ADMIN sở hữu sách');
  console.log(JSON.stringify({ event: 'repository-start', mode: apply ? 'apply' : 'dry-run', database: mongoose.connection.name,
    booksDiscovered: indexes.length, countsBefore }));
  for (const index of indexes) {
    try {
      const book = await inspectBook(index);
      const genre = 'van_hoc_viet_nam';
      const existing = await Book.findOne({ $or: [
        { import_source: 'vietnamese_public_domain_repository', source_id: new URL(book.sourceUrl).pathname },
        { title: new RegExp(`^${book.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), author_name: new RegExp(book.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ] }).select('_id').lean();
      const item = { title: book.title, author: book.author, source: book.sourceUrl, chapters: book.chapters.length,
        characters: book.totalCharacters, license: 'Phạm vi công cộng theo luật Việt Nam', authorRightsRecord: book.authorSource,
        authorDeathYear: book.deathYear, publication: book.publication,
        status: existing ? 'EXISTS' : apply ? 'IMPORTED' : 'READY' };
      if (existing) item.bookId = String(existing._id);
      if (apply && !existing) {
        const record = await Book.create({ title: book.title.slice(0, 200), author_name: book.author.slice(0, 120), category: 'ebook', genre,
          description: `Toàn văn chia chương theo nguồn. Xuất bản: ${book.publication}. Nguồn: ${book.sourceUrl}. Thông tin quyền: ${RIGHTS_URL}`,
          cover_url: '',
          access_level: 'free', owner: owner._id, status: 'published', import_source: 'vietnamese_public_domain_repository',
          source_id: new URL(book.sourceUrl).pathname, source_url: book.sourceUrl, license_name: item.license,
          license_url: RIGHTS_URL, language: 'vi', file_format: 'HTML', verified_at: new Date() });
        for (let i = 0; i < book.chapters.length; i += 1) await Chapter.updateOne({ book_id: record._id, chapter_number: i + 1 },
          { $setOnInsert: { book_id: record._id, chapter_number: i + 1, title: book.chapters[i].title.slice(0, 200), content: book.chapters[i].content,
            slug: `pd-vn-${new URL(book.sourceUrl).pathname.split('/').filter(Boolean).at(-1)}-${i + 1}`, access_level: 'free' } }, { upsert: true });
        item.bookId = String(record._id);
      }
      summary.push(item);
      console.log(JSON.stringify({ event: 'book', ...item }));
    } catch (error) {
      const item = { url: index.url, status: 'SKIPPED', reason: String(error.message || error).slice(0, 250) };
      summary.push(item);
      console.log(JSON.stringify({ event: 'book', ...item }));
    }
  }
  const countsAfter = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  console.log(JSON.stringify({ event: 'repository-end', database: mongoose.connection.name, added: summary.filter((item) => item.status === 'IMPORTED').length,
    summary, countsBefore, countsAfter }));
} finally { await mongoose.disconnect(); }
