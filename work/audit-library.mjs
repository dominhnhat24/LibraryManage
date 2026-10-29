import 'dotenv/config';
import mongoose from 'mongoose';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import { connectDB } from '../src/config/database.config.js';
await connectDB();
const [total, cats, covers, sample, chapterTotal] = await Promise.all([
  Book.countDocuments(),
  Book.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  Book.aggregate([{ $group: { _id: { hasCover: { $and: [{ $ne: ['$cover_url', null] }, { $ne: ['$cover_url', ''] }] } }, count: { $sum: 1 } } }]),
  Book.find({}, { title: 1, author_name: 1, category: 1, cover_url: 1, import_source: 1, source_id: 1, source_url: 1, license_name: 1 }).sort({ title: 1 }).lean(),
  Chapter.countDocuments()
]);
const ch = await Chapter.aggregate([{ $group: { _id: '$book_id', count: { $sum: 1 } } }]);
console.log(JSON.stringify({database:mongoose.connection.name,total,chapterTotal,categories:cats,covers,books:sample.map(b=>({...b,_id:String(b._id),cover_url:b.cover_url ? '[set]' : ''})),booksWithChapters:ch.length,chapterCounts:ch.map(c=>({bookId:String(c._id),count:c.count}))},null,2));
await mongoose.disconnect();
