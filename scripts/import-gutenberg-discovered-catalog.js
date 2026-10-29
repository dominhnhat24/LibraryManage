// Discovers candidates from Project Gutenberg's official daily catalog feed, then verifies live RDF + full text.
// Dry-run is the default. Import with --apply after reviewing the candidate log.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { gunzipSync } from 'node:zlib';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import User from '../src/models/user.model.js';

const PG = 'https://www.gutenberg.org';
const catalogUrl = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz';
const pgLimitYear = 1945; // Conservative Vietnam term screen; still retain PG's own territorial notice.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decode = (value = '') => String(value).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const normalize = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const headers = { 'User-Agent': process.env.WIKISOURCE_USER_AGENT || 'HarveyLibrary/1.0 (Project Gutenberg public catalog import)' };
const get = async (url) => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  return response;
};
function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(field); field = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((value) => value)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows;
  return data.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] || ''])));
}
async function catalogRows() {
  const response = await get(catalogUrl);
  const compressed = Buffer.from(await response.arrayBuffer());
  return parseCsv(gunzipSync(compressed).toString('utf8'));
}
const isFictionShelf = (r) => /Category: (?:Novels|Fiction|Romance|Adventure|Short Stories|Crime, Thrillers and Mystery|Science-Fiction & Fantasy)|(?:^|;\s*)(?:Children's Fiction|Historical Fiction|Mystery Fiction)(?:;|$)/i.test(r.Bookshelves);
const catalogCategories = [
  { genre: 'kinh_doanh', match: (r) => /Category: Business\/Management/i.test(r.Bookshelves) && !isFictionShelf(r) && !/fiction/i.test(r.Subjects) },
  { genre: 'phat_trien_ban_than', match: (r) => /self[- ]help|acres of diamonds|university of hard knocks|mastery of self|message to garcia|as a man thinketh|science of getting rich|power of concentration|personal improvement|human efficiency in|architects of fate|how to get on in the world|mental efficiency|ambition and success|love, life\s*&\s*work|golden steps to respectability|aims and aids for girls|happiness: essays on the meaning of life|levels of living|character building|^character$/i.test(r.Title) && !/mechanical drawing/i.test(r.Title) && !isFictionShelf(r) && !/fiction|agriculture|horticulture|fruits|religion|missionary|literature/i.test(`${r.Subjects};${r.Bookshelves}`) && !/Category: Plays\/Films\/Dramas/i.test(r.Bookshelves) },
  { genre: 'tam_ly_hoc', match: (r) => (/Category: Psychiatry\/Psychology|(?:^|;\s*)Psychology(?:;|$)/i.test(r.Bookshelves) || /Psychology(?:,|;|$)|psychology --/i.test(r.Subjects)) && !isFictionShelf(r) },
  { genre: 'lich_su', match: (r) => /Category: History -/i.test(r.Bookshelves) && !isFictionShelf(r) && !/Category: Essays, Letters & Speeches|Category: (?:Philosophy & Ethics|Science -|Poetry|Literature)/i.test(r.Bookshelves) },
  { genre: 'khoa_hoc', match: (r) => /Category: Science - (?:Biology|Earth\/Agricultural\/Farming|Physics|Chemistry\/Biochemistry|Mathematics|Medicine|Technology)/i.test(r.Bookshelves) && !isFictionShelf(r) },
  { genre: 'van_hoc_dan_gian', match: (r) => (/Category: Mythology, Legends & Folklore|(?:^|;\s*)Folklore(?:;|$)/i.test(r.Bookshelves) || /Folklore|Mythology|Fairy tales|Legends|Fables/i.test(r.Subjects)) && /myth|legend|fairy|folklore|arabian nights|indian/i.test(r.Title) && !/Category: Novels|Category: Science-Fiction & Fantasy/i.test(r.Bookshelves) && !/^Flower Fables$/i.test(r.Title) },
  { genre: 'van_hoc_the_gioi', match: (r) => /Category: (?:Novels|Fiction|Plays\/Films\/Dramas)|(?:^|;\s*)(?:Novels|Fiction)(?:;|$)/i.test(r.Bookshelves) },
];
function parseDeathYears(authorText) {
  const authors = String(authorText).split(/;\s*/).filter(Boolean);
  if (!authors.length) return null;
  const years = authors.map((person) => [...person.matchAll(/(?:-|–)(\d{3,4})(?!\d)/g)].map((m) => Number(m[1])).pop());
  if (years.some((year) => !year || year > pgLimitYear)) return null;
  return years;
}
function primaryAuthorFromCatalog(value) {
  const contributors = String(value).split(/;\s*/).filter(Boolean);
  const primary = contributors.filter((person) => !/\[(?:Translator|Editor|Contributor|Illustrator|Photographer|Arranger|Compiler)\]/i.test(person));
  if (!primary.length) throw new Error('Catalog chỉ ghi dịch giả/biên tập viên, không xác nhận tác giả tác phẩm');
  const person = primary[0].replace(/,\s*\d{3,4}[^,]*$/, '').trim();
  if (!person || /^(?:Various|Unknown)$/i.test(person)) throw new Error('Tác giả không được định danh rõ trong catalog');
  return person;
}
function parseEdition(rdf, row) {
  const title = decode(rdf.match(/<dcterms:title[^>]*>([\s\S]*?)<\/dcterms:title>/)?.[1]);
  const people = [...rdf.matchAll(/<pgterms:agent\b[^>]*>([\s\S]*?)<\/pgterms:agent>/g)].map((match) => ({
    name: decode(match[1].match(/<pgterms:name[^>]*>([\s\S]*?)<\/pgterms:name>/)?.[1]),
    death: Number(match[1].match(/<pgterms:deathdate[^>]*>(\d{4})<\/pgterms:deathdate>/)?.[1]) || null,
  })).filter((person) => person.name);
  if (!title || !people.length) throw new Error('RDF thiếu tiêu đề hoặc tác giả');
  const years = parseDeathYears(row.Authors);
  if (!years || people.some((person) => !person.death || person.death > pgLimitYear)) {
    throw new Error(`Không xác nhận được toàn bộ tác giả/người dịch mất trước ${pgLimitYear + 1}`);
  }
  const catalogAuthor = primaryAuthorFromCatalog(row.Authors);
  if (!normalize(people[0].name).includes(normalize(catalogAuthor).split(' ').slice(-1)[0])) {
    if (!people.some((person) => normalize(person.name).includes(normalize(catalogAuthor).split(' ').slice(-1)[0])))
      throw new Error('Tác giả trong CSV không khớp tác giả trong RDF');
  }
  return { title, author: catalogAuthor, death: Math.max(...people.map((person) => person.death)) };
}
function splitText(raw) {
  const start = raw.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const end = raw.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (start < 0 || end <= start) throw new Error('Thiếu dấu đầu/cuối toàn văn Project Gutenberg');
  const text = raw.slice(start, end).replace(/^.*?\*\*\*\s*\n/i, '').trim();
  if (text.length < 3000) throw new Error(`Toàn văn quá ngắn (${text.length} ký tự)`);
  const lines = text.split(/\r?\n/);
  const heading = /^\s*(?:CHAPTER|CHAP\.?|BOOK|PART|SECTION|CANTO|LETTER|STAVE)\s+(?:[IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)(?:\b.*)?\s*$/i;
  const marks = [];
  for (let i = 0; i < lines.length; i += 1) if (heading.test(lines[i]) && lines[i].trim().length < 160) marks.push(i);
  let sections = marks.length >= 2 ? marks.map((line, index) => ({
    title: lines[line].trim(), body: lines.slice(line + 1, marks[index + 1] ?? lines.length).join('\n').trim(),
  })).filter((section) => section.body.length > 300) : [];
  if (sections.length < 2) sections = [{ title: '', body: text }];
  const pages = []; let pageNumber = 1;
  for (const section of sections) {
    const chunks = []; let body = '';
    const flush = () => { if (body) { chunks.push(body); body = ''; } };
    for (const paragraph of section.body.split(/\n\s*\n/)) {
      let part = paragraph.trim(); if (!part) continue;
      if (body && body.length + part.length + 2 > 12000) flush();
      while (part.length > 12000) { flush(); let cut = part.lastIndexOf(' ', 12000); if (cut < 7000) cut = 12000; chunks.push(part.slice(0, cut).trim()); part = part.slice(cut).trim(); }
      body = body ? `${body}\n\n${part}` : part;
    }
    flush();
    chunks.forEach((content, index) => pages.push({ title: section.title
      ? (chunks.length === 1 ? section.title : `${section.title} · Trang ${index + 1}`)
      : `Trang ${pageNumber++}`, content }));
  }
  return pages.filter((page) => page.content.trim());
}

const apply = process.argv.includes('--apply');
const maxPerGenreArg = process.argv.find((arg) => arg.startsWith('--max-per-genre='));
const maxPerGenre = maxPerGenreArg ? Math.max(1, Number.parseInt(maxPerGenreArg.split('=')[1], 10) || 1) : 20;
let imported = 0;
const results = [];
try {
  await connectDB();
  const [books, counts, rows] = await Promise.all([
    Book.find({}, 'title author_name genre import_source source_id').lean(),
    Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }]),
    catalogRows(),
  ]);
  const owner = (process.env.ADMIN_OWNER_ID && await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean())
    || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
  if (apply && !owner) throw new Error('Không tìm thấy tài khoản ADMIN');
  const countByGenre = Object.fromEntries(counts.map((item) => [item._id, item.count]));
  const knownIds = new Set(books.filter((book) => book.import_source === 'project_gutenberg').map((book) => String(book.source_id)));
  const knownNames = new Set(books.map((book) => `${normalize(book.title)}::${normalize(book.author_name)}`));
  console.log(JSON.stringify({ event: 'catalog-start', mode: apply ? 'apply' : 'dry-run', database: mongoose.connection.name,
    catalogRows: rows.length, currentBooks: books.length, counts: countByGenre }));

  const usedIds = new Set(knownIds); const usedNames = new Set(knownNames);
  for (const category of catalogCategories) {
    let deficit = Math.min(maxPerGenre, Math.max(0, 20 - (countByGenre[category.genre] || 0)));
    if (!deficit) continue;
    const candidates = rows.filter((row) => row.Type === 'Text' && String(row.Language).split(/;\s*/).includes('en')
      && category.match(row) && parseDeathYears(row.Authors));
    let tried = 0;
    for (const row of candidates) {
      if (!deficit) break;
      const id = String(row['Text#']);
      if (!/^\d+$/.test(id) || usedIds.has(id)) continue;
      const catalogTitle = decode(row.Title);
      let catalogAuthor;
      try { catalogAuthor = decode(primaryAuthorFromCatalog(row.Authors)); }
      catch (error) { results.push({ genre: category.genre, id, status: 'SKIPPED', reason: String(error.message).slice(0, 180) }); usedIds.add(id); continue; }
      const titleKey = `${normalize(catalogTitle)}::${normalize(catalogAuthor)}`;
      if (usedNames.has(titleKey)) continue;
      tried += 1;
      try {
        const rdf = await (await get(`${PG}/cache/epub/${id}/pg${id}.rdf`)).text();
        const meta = parseEdition(rdf, row);
        if (usedNames.has(`${normalize(meta.title)}::${normalize(meta.author)}`)) { usedIds.add(id); continue; }
        let textResponse;
        try { textResponse = await get(`${PG}/cache/epub/${id}/pg${id}.txt.utf8`); }
        catch { textResponse = await get(`${PG}/cache/epub/${id}/pg${id}.txt`); }
        const pages = splitText(await textResponse.text());
        const item = { genre: category.genre, id, title: meta.title, author: meta.author, latestContributorDeath: meta.death,
          pages: pages.length, characters: pages.reduce((sum, page) => sum + page.content.length, 0), status: apply ? 'PENDING_IMPORT' : 'READY' };
        if (apply) {
          const book = await Book.create({ title: meta.title.slice(0, 200), author_name: meta.author.slice(0, 120), category: 'ebook', genre: category.genre,
            description: `Toàn văn gốc Project Gutenberg eBook ${id}; metadata/tác giả đối chiếu CSV catalog và RDF.`, cover_url: '',
            access_level: 'free', owner: owner._id, status: 'published', import_source: 'project_gutenberg', source_id: id,
            source_url: `${PG}/ebooks/${id}`, license_name: `Project Gutenberg: public domain in the USA; all credited author/translator death years verified ≤ ${pgLimitYear}; local redistribution status not asserted`,
            license_url: `${PG}/policy/permission.html`, language: 'en', file_format: 'TXT', verified_at: new Date() });
          try {
            await Chapter.insertMany(pages.map((page, index) => ({ book_id: book._id, title: page.title.slice(0, 200), content: page.content.slice(0, 199000),
              chapter_number: index + 1, slug: `pg-${id}-${index + 1}`, access_level: 'free' })));
          } catch (error) { await Book.deleteOne({ _id: book._id }); throw error; }
          item.status = 'IMPORTED'; item.bookId = String(book._id); imported += 1;
        }
        results.push(item); console.log(JSON.stringify({ event: 'candidate', ...item }));
        usedIds.add(id); usedNames.add(`${normalize(meta.title)}::${normalize(meta.author)}`); deficit -= 1;
      } catch (error) {
        results.push({ genre: category.genre, id, status: 'SKIPPED', reason: String(error.message || error).slice(0, 180) });
      }
      await sleep(1800);
    }
    console.log(JSON.stringify({ event: 'genre-finished', genre: category.genre, target: 20,
      before: countByGenre[category.genre] || 0, selected: results.filter((item) => item.genre === category.genre && ['READY', 'IMPORTED'].includes(item.status)).length,
      candidatesChecked: tried, stillMissingAfterBatch: deficit }));
  }
  const after = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  console.log(JSON.stringify({ event: 'catalog-end', database: mongoose.connection.name, mode: apply ? 'apply' : 'dry-run', imported,
    countsAfter: after, results }));
} finally { await mongoose.disconnect(); }
