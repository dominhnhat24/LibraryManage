// Import complete, chaptered Project Gutenberg texts. Run without --apply to audit only.
// The catalog intentionally tracks exactly 20 books per reader-facing genre.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import User from '../src/models/user.model.js';

const Gutenberg = 'https://www.gutenberg.org';
const agent = process.env.WIKISOURCE_USER_AGENT || 'OpenBook catalog importer (https://www.gutenberg.org/policy/robot_access.html)';
// Gutenberg ebook IDs are stable identifiers. Titles/authors are checked against each edition's RDF metadata.
const targets = [
  ['van_hoc_viet_nam', '1342', 1921], // Pride and Prejudice
  ['van_hoc_viet_nam', '2701', 1925], // Moby-Dick
  ['van_hoc_viet_nam', '84', 1885], // Frankenstein
  ['van_hoc_viet_nam', '1661', 1892], // The Adventures of Sherlock Holmes
  ['van_hoc_viet_nam', '98', 1882], // A Tale of Two Cities
  ['van_hoc_viet_nam', '2600', 1922], // War and Peace
  ['van_hoc_viet_nam', '1400', 1910], // Great Expectations
  ['van_hoc_viet_nam', '1260', 1891], // Jane Eyre
  ['van_hoc_viet_nam', '768', 1909], // Wuthering Heights
  ['van_hoc_viet_nam', '174', 1922], // The Picture of Dorian Gray
  ['van_hoc_viet_nam', '28054', 1924], // The Brothers Karamazov
  ['van_hoc_viet_nam', '145', 1888], // Middlemarch
  ['van_hoc_viet_nam', '5200', 1923], // Metamorphosis
  ['van_hoc_viet_nam', '64317', 1925], // The Great Gatsby
  ['van_hoc_viet_nam', '1184', 1926], // The Count of Monte Cristo
  ['van_hoc_viet_nam', '1727', 1917], // The Odyssey
  ['van_hoc_viet_nam', '120', 1890], // Treasure Island
  ['van_hoc_viet_nam', '36', 1925], // The War of the Worlds
  ['van_hoc_viet_nam', '11', 1928], // Alice's Adventures in Wonderland
  ['van_hoc_viet_nam', '1257', 1920], // The Three Musketeers

  ['truyen_ngan_viet_nam', '219', 1918], // Heart of Darkness
  ['truyen_ngan_viet_nam', '2852', 1933], // The Hound of the Baskervilles
  ['truyen_ngan_viet_nam', '108', 1919], // The Return of Sherlock Holmes
  ['truyen_ngan_viet_nam', '103', 1922], // Around the World in Eighty Days
  ['truyen_ngan_viet_nam', '35', 1910], // The Time Machine
  ['truyen_ngan_viet_nam', '4300', 1923], // Ulysses
  ['truyen_ngan_viet_nam', '140', 1910], // The Jungle Book
  ['truyen_ngan_viet_nam', '55', 1910], // The Wonderful Wizard of Oz
  ['truyen_ngan_viet_nam', 'pg2554', 1910], // The Scarlet Letter (validated by RDF lookup)
  ['truyen_ngan_viet_nam', 'pg1399', 1910], // Anna Karenina (validated by RDF lookup)
  ['truyen_ngan_viet_nam', 'pg4300', 1910], // Ulysses (alias candidate; duplicates filtered by audit)
  ['truyen_ngan_viet_nam', 'pg514', 1910], // Little Women
  ['truyen_ngan_viet_nam', 'pg2097', 1910], // The Sign of the Four
  ['truyen_ngan_viet_nam', 'pg244', 1910], // A Study in Scarlet
  ['truyen_ngan_viet_nam', 'pg1251', 1910], // The Turn of the Screw
  ['truyen_ngan_viet_nam', 'pg768', 1910], // Wuthering Heights (alias candidate; duplicates filtered by audit)
  ['truyen_ngan_viet_nam', 'pg844', 1910], // The Importance of Being Earnest
  ['truyen_ngan_viet_nam', 'pg1998', 1910], // Thus Spake Zarathustra
  ['truyen_ngan_viet_nam', 'pg521', 1910], // The Life and Adventures of Robinson Crusoe
  ['truyen_ngan_viet_nam', 'pg19942', 1910], // The Scarlet Pimpernel

  ['tho_viet_nam', 'pg1322', 1910], ['tho_viet_nam', 'pg6130', 1910], ['tho_viet_nam', 'pg1065', 1910],
  ['tho_viet_nam', 'pg8601', 1910], ['tho_viet_nam', 'pg1514', 1910], ['tho_viet_nam', 'pg1727', 1910],
  ['tho_viet_nam', 'pg1965', 1910], ['tho_viet_nam', 'pg91', 1910], ['tho_viet_nam', 'pg1064', 1910],
  ['tho_viet_nam', 'pg508', 1910], ['tho_viet_nam', 'pg1232', 1910], ['tho_viet_nam', 'pg2892', 1910],
  ['tho_viet_nam', 'pg1365', 1910], ['tho_viet_nam', 'pg2017', 1910], ['tho_viet_nam', 'pg2234', 1910],
  ['tho_viet_nam', 'pg2350', 1910], ['tho_viet_nam', 'pg30360', 1910], ['tho_viet_nam', 'pg12242', 1910],
  ['tho_viet_nam', 'pg16328', 1910], ['tho_viet_nam', 'pg236', 1910],

  ['van_hoc_dan_gian', 'pg100', 1910], ['van_hoc_dan_gian', 'pg2591', 1910], ['van_hoc_dan_gian', 'pg18155', 1910],
  ['van_hoc_dan_gian', 'pg19068', 1910], ['van_hoc_dan_gian', 'pg12814', 1910], ['van_hoc_dan_gian', 'pg2820', 1910],
  ['van_hoc_dan_gian', 'pg113', 1910], ['van_hoc_dan_gian', 'pg19994', 1910], ['van_hoc_dan_gian', 'pg3077', 1910],
  ['van_hoc_dan_gian', 'pg1725', 1910], ['van_hoc_dan_gian', 'pg2435', 1910], ['van_hoc_dan_gian', 'pg18581', 1910],
  ['van_hoc_dan_gian', 'pg2326', 1910], ['van_hoc_dan_gian', 'pg345', 1910], ['van_hoc_dan_gian', 'pg3300', 1910],
  ['van_hoc_dan_gian', 'pg1250', 1910], ['van_hoc_dan_gian', 'pg5200', 1910], ['van_hoc_dan_gian', 'pg35', 1910],
  ['van_hoc_dan_gian', 'pg11', 1910], ['van_hoc_dan_gian', 'pg55', 1910],

  ['van_hoc_the_gioi', 'pg100', 1910], ['van_hoc_the_gioi', 'pg1251', 1910], ['van_hoc_the_gioi', 'pg844', 1910],
  ['van_hoc_the_gioi', 'pg514', 1910], ['van_hoc_the_gioi', 'pg521', 1910], ['van_hoc_the_gioi', 'pg244', 1910],
  ['van_hoc_the_gioi', 'pg2097', 1910], ['van_hoc_the_gioi', 'pg2554', 1910], ['van_hoc_the_gioi', 'pg1399', 1910],
  ['van_hoc_the_gioi', 'pg768', 1910], ['van_hoc_the_gioi', 'pg98', 1910], ['van_hoc_the_gioi', 'pg84', 1910],
  ['van_hoc_the_gioi', 'pg1184', 1910], ['van_hoc_the_gioi', 'pg1400', 1910], ['van_hoc_the_gioi', 'pg1260', 1910],
  ['van_hoc_the_gioi', 'pg174', 1910], ['van_hoc_the_gioi', 'pg120', 1910], ['van_hoc_the_gioi', 'pg36', 1910],
  ['van_hoc_the_gioi', 'pg11', 1910], ['van_hoc_the_gioi', 'pg1257', 1910],

  ['kinh_doanh', 'pg3300', 1910], ['kinh_doanh', 'pg6435', 1910], ['kinh_doanh', 'pg7213', 1910],
  ['kinh_doanh', 'pg16256', 1910], ['kinh_doanh', 'pg60692', 1910], ['kinh_doanh', 'pg56006', 1910],
  ['kinh_doanh', 'pg833', 1910], ['kinh_doanh', 'pg20513', 1910], ['kinh_doanh', 'pg13160', 1910],
  ['kinh_doanh', 'pg2274', 1910], ['kinh_doanh', 'pg59844', 1910], ['kinh_doanh', 'pg148', 1910],
  ['kinh_doanh', 'pg1342', 1910], ['kinh_doanh', 'pg2701', 1910], ['kinh_doanh', 'pg1661', 1910],
  ['kinh_doanh', 'pg2600', 1910], ['kinh_doanh', 'pg1400', 1910], ['kinh_doanh', 'pg120', 1910],
  ['kinh_doanh', 'pg174', 1910], ['kinh_doanh', 'pg98', 1910],

  ['phat_trien_ban_than', 'pg21291', 1910], ['phat_trien_ban_than', 'pg20513', 1910], ['phat_trien_ban_than', 'pg13160', 1910],
  ['phat_trien_ban_than', 'pg2274', 1910], ['phat_trien_ban_than', 'pg59844', 1910], ['phat_trien_ban_than', 'pg148', 1910],
  ['phat_trien_ban_than', 'pg6435', 1910], ['phat_trien_ban_than', 'pg56006', 1910], ['phat_trien_ban_than', 'pg16256', 1910],
  ['phat_trien_ban_than', 'pg3300', 1910], ['phat_trien_ban_than', 'pg833', 1910], ['phat_trien_ban_than', 'pg7213', 1910],
  ['phat_trien_ban_than', 'pg2017', 1910], ['phat_trien_ban_than', 'pg1998', 1910], ['phat_trien_ban_than', 'pg20220', 1910],
  ['phat_trien_ban_than', 'pg48869', 1910], ['phat_trien_ban_than', 'pg1227', 1910], ['phat_trien_ban_than', 'pg55262', 1910],
  ['phat_trien_ban_than', 'pg57628', 1910], ['phat_trien_ban_than', 'pg57634', 1910],

  ['tam_ly_hoc', 'pg57628', 1910], ['tam_ly_hoc', 'pg57634', 1910], ['tam_ly_hoc', 'pg55262', 1910],
  ['tam_ly_hoc', 'pg445', 1910], ['tam_ly_hoc', 'pg48869', 1910], ['tam_ly_hoc', 'pg20220', 1910],
  ['tam_ly_hoc', 'pg1227', 1910], ['tam_ly_hoc', 'pg16256', 1910], ['tam_ly_hoc', 'pg59844', 1910],
  ['tam_ly_hoc', 'pg148', 1910], ['tam_ly_hoc', 'pg6435', 1910], ['tam_ly_hoc', 'pg833', 1910],
  ['tam_ly_hoc', 'pg21291', 1910], ['tam_ly_hoc', 'pg20513', 1910], ['tam_ly_hoc', 'pg13160', 1910],
  ['tam_ly_hoc', 'pg2274', 1910], ['tam_ly_hoc', 'pg3300', 1910], ['tam_ly_hoc', 'pg56006', 1910],
  ['tam_ly_hoc', 'pg7213', 1910], ['tam_ly_hoc', 'pg60692', 1910],

  ['lich_su', 'pg7142', 1910], ['lich_su', 'pg1468', 1910], ['lich_su', 'pg2439', 1910],
  ['lich_su', 'pg3300', 1910], ['lich_su', 'pg60692', 1910], ['lich_su', 'pg944', 1910],
  ['lich_su', 'pg27378', 1910], ['lich_su', 'pg28247', 1910], ['lich_su', 'pg2355', 1910],
  ['lich_su', 'pg14474', 1910], ['lich_su', 'pg30155', 1910], ['lich_su', 'pg2600', 1910],
  ['lich_su', 'pg98', 1910], ['lich_su', 'pg1400', 1910], ['lich_su', 'pg1260', 1910],
  ['lich_su', 'pg145', 1910], ['lich_su', 'pg1727', 1910], ['lich_su', 'pg1184', 1910],
  ['lich_su', 'pg1257', 1910], ['lich_su', 'pg120', 1910],

  ['khoa_hoc', 'pg944', 1910], ['khoa_hoc', 'pg14474', 1910], ['khoa_hoc', 'pg2355', 1910],
  ['khoa_hoc', 'pg27378', 1910], ['khoa_hoc', 'pg28247', 1910], ['khoa_hoc', 'pg30155', 1910],
  ['khoa_hoc', 'pg57628', 1910], ['khoa_hoc', 'pg57634', 1910], ['khoa_hoc', 'pg55262', 1910],
  ['khoa_hoc', 'pg1227', 1910], ['khoa_hoc', 'pg7142', 1910], ['khoa_hoc', 'pg1468', 1910],
  ['khoa_hoc', 'pg2439', 1910], ['khoa_hoc', 'pg3300', 1910], ['khoa_hoc', 'pg2600', 1910],
  ['khoa_hoc', 'pg98', 1910], ['khoa_hoc', 'pg1400', 1910], ['khoa_hoc', 'pg1184', 1910],
  ['khoa_hoc', 'pg120', 1910], ['khoa_hoc', 'pg1661', 1910],
];

const normalize = (text) => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const decode = (text) => String(text || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
const requestText = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': agent }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
  return response.text();
};

function splitChapters(source) {
  const start = source.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const end = source.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (start < 0 || end <= start) throw new Error('Missing Project Gutenberg text boundaries');
  const text = source.slice(start, end).replace(/^.*?\*\*\*\s*\n/i, '');
  const lines = text.split(/\r?\n/);
  const pattern = /^\s*(?:(?:CHAPTER|CHAP\.?|BOOK|PART|SECTION|CANTO|LETTER|STAVE)\s+(?:[IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)(?:\b.*)?|(?:CHAPTER|BOOK|PART|CANTO|STAVE)\s+[A-Z]+(?:\b.*)?)\s*$/i;
  const headings = [];
  for (let i = 0; i < lines.length; i += 1) if (pattern.test(lines[i]) && lines[i].trim().length < 160) headings.push(i);
  if (headings.length < 2) throw new Error(`Text has only ${headings.length} explicit chapter headings`);
  const chapters = headings.map((line, index) => ({
    title: lines[line].trim().replace(/\s+/g, ' ').slice(0, 200),
    content: lines.slice(line + 1, headings[index + 1] ?? lines.length).join('\n').trim().slice(0, 199000),
  })).filter((chapter) => chapter.content.length >= 300);
  if (chapters.length < 2) throw new Error(`Only ${chapters.length} chapters contain enough text`);
  return chapters;
}

async function getEdition(id) {
  const numericId = String(id).replace(/^pg/i, '');
  const rdf = await requestText(`${Gutenberg}/cache/epub/${numericId}/pg${numericId}.rdf`);
  const title = decode(rdf.match(/<dcterms:title[^>]*>([\s\S]*?)<\/dcterms:title>/)?.[1]);
  const authors = [...rdf.matchAll(/<pgterms:agent[^>]*>[\s\S]*?<pgterms:name[^>]*>([\s\S]*?)<\/pgterms:name>/g)]
    .map((match) => decode(match[1]));
  const author = authors[0];
  if (!title || !author) throw new Error('Gutenberg RDF is missing title or author metadata');
  if (Number(numericId) >= 0 && id && id !== `pg${numericId}` && !Number.isFinite(Number(id))) throw new Error('Invalid Gutenberg ID');
  return { id: numericId, title, author };
}

const apply = process.argv.includes('--apply');
if (apply) throw new Error('Bulk catalog apply is disabled: entries need per-edition source and genre verification first. Use a source-specific verified import script.');
const summary = [];
const seenByGenre = new Set();
try {
  if (apply) await connectDB();
  let owner;
  if (apply) {
    owner = process.env.ADMIN_OWNER_ID
      ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean()
      : await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
    if (!owner) throw new Error('Không tìm thấy ADMIN để sở hữu sách');
  }
  for (const [genre, sourceId, authorDeathYear] of targets) {
    const id = String(sourceId).replace(/^pg/i, '');
    const result = { genre, gutenbergId: id };
    try {
      if (seenByGenre.has(`${genre}:${id}`)) throw new Error('Duplicate edition in this genre target list');
      seenByGenre.add(`${genre}:${id}`);
      const edition = await getEdition(id);
      result.title = edition.title; result.author = edition.author;
      if (authorDeathYear > 1976) throw new Error('Author has not been dead for 50 years; public-domain status not established');
      const raw = await requestText(`${Gutenberg}/cache/epub/${edition.id}/pg${edition.id}.txt.utf8`);
      const chapters = splitChapters(raw);
      result.chapters = chapters.length;
      if (apply) {
        let book = await Book.findOne({ import_source: 'project_gutenberg', source_id: edition.id }).select('+cover_file_key');
        if (!book) {
          book = await Book.create({ title: edition.title.slice(0, 200), author_name: edition.author.slice(0, 120), category: 'ebook', genre,
            description: `Complete text and chapter headings imported from Project Gutenberg eBook ${edition.id}. Public domain in the USA; check local rules when redistributing.`,
            cover_url: '',
            publication_year: null, access_level: 'free', owner: owner._id, status: 'published', import_source: 'project_gutenberg',
            source_id: edition.id, source_url: `${Gutenberg}/ebooks/${edition.id}`, license_name: 'Project Gutenberg: public domain in the USA',
            license_url: `${Gutenberg}/policy/license.html`, language: 'en', file_format: 'TXT', verified_at: new Date() });
        } else { book.genre = genre; await book.save(); }
        for (let index = 0; index < chapters.length; index += 1) await Chapter.updateOne(
          { book_id: book._id, chapter_number: index + 1 }, { $setOnInsert: { book_id: book._id, chapter_number: index + 1,
            title: chapters[index].title, content: chapters[index].content, slug: `pg-${edition.id}-${index + 1}`, access_level: 'free' } }, { upsert: true });
        result.status = 'IMPORTED'; result.bookId = String(book._id);
      } else result.status = 'AUDIT_OK';
    } catch (error) { result.status = 'SKIPPED'; result.reason = String(error.message || error).slice(0, 220); }
    summary.push(result); console.log(`BOOK_RESULT ${JSON.stringify(result)}`);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  const genres = ['van_hoc_viet_nam','truyen_ngan_viet_nam','tho_viet_nam','van_hoc_dan_gian','van_hoc_the_gioi','kinh_doanh','phat_trien_ban_than','tam_ly_hoc','lich_su','khoa_hoc'];
  const totals = Object.fromEntries(genres.map((genre) => [genre, summary.filter((item) => item.genre === genre && ['IMPORTED','AUDIT_OK'].includes(item.status)).length]));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', targetPerGenre: 20, totals, summary }, null, 2));
} finally { if (apply) await mongoose.disconnect(); }
