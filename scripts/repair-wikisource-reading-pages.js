import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import { rebuildWikisourceChapters } from '../src/services/book-import.service.js';

const apply = process.argv.includes('--apply');
const targetSize = 14000;
try {
  await connectDB();
  const books = await Book.find({ import_source: 'wikisource' }).select('_id title source_id genre').sort({ title: 1 }).lean();
  const results = [];
  for (const book of books) {
    const existing = await Chapter.find({ book_id: book._id }).select('chapter_number content').lean();
    const maxCharacters = Math.max(0, ...existing.map((item) => String(item.content || '').length));
    if (maxCharacters <= targetSize) continue;
    const item = { title: book.title, sourceId: book.source_id, previousPages: existing.length, previousMaxCharacters: maxCharacters };
    if (!apply) { item.status = 'WOULD_REBUILD'; results.push(item); console.log(JSON.stringify(item)); continue; }
    try {
      const rebuilt = await rebuildWikisourceChapters({ pageTitle: book.source_id, bookId: book._id, genre: book.genre });
      item.status = 'REBUILT'; Object.assign(item, rebuilt); results.push(item); console.log(JSON.stringify(item));
    } catch (error) {
      item.status = 'PRESERVED_SOURCE_REBUILD_FAILED'; item.reason = String(error.message || error).slice(0, 220);
      results.push(item); console.log(JSON.stringify(item));
    }
  }
  const finalMax = await Chapter.aggregate([{ $group: { _id: '$book_id', maxCharacters: { $max: { $strLenCP: '$content' } } } }, { $match: { maxCharacters: { $gt: targetSize } } }, { $count: 'books' }]);
  console.log(JSON.stringify({ event: 'reading-page-repair-summary', database: mongoose.connection.name,
    mode: apply ? 'apply' : 'dry-run', examinedWikisourceBooks: books.length, affected: results.length,
    rebuilt: results.filter((item) => item.status === 'REBUILT').length, failed: results.filter((item) => item.status === 'PRESERVED_SOURCE_REBUILD_FAILED').length,
    booksStillOver14k: finalMax[0]?.books || 0, results }));
} finally { await mongoose.disconnect(); }
