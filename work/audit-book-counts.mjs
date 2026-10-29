import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';

await connectDB();
const books = await Book.find({}, 'title author_name genre import_source source_id source_url license_name').lean();
const counts = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
const chapters = await Chapter.aggregate([{ $group: { _id: '$book_id', count: { $sum: 1 } } }]);
console.log(JSON.stringify({
  database: mongoose.connection.name,
  total: books.length,
  counts,
  booksWithChapters: chapters.length,
  chapterTotal: await Chapter.countDocuments(),
  bySource: books.reduce((acc, book) => (acc[book.import_source || 'legacy'] = (acc[book.import_source || 'legacy'] || 0) + 1, acc), {}),
  missingSource: books.filter((book) => !book.import_source || !book.source_url).length,
}, null, 2));
await mongoose.disconnect();
