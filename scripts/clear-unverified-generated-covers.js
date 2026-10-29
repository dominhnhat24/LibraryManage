// Removes only generated replacement-cover files and metadata; book/content records are retained.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import { removePrivateBookFile } from '../src/utils/private-book-storage.js';

const apply = process.argv.includes('--apply');
await connectDB();
try {
  const books = await Book.find({}).select('+cover_file_key').lean();
  const invalid = books.filter((book) => /\.svg$/i.test(book.cover_file_key || '')
    || /generated replacement|bìa thay thế do openbook/i.test(book.cover_license_name || ''));
  console.log(JSON.stringify({ event: 'generated-cover-audit', database: mongoose.connection.name,
    apply, count: invalid.length, titles: invalid.map((book) => ({ title: book.title, cover_file_key: book.cover_file_key })) }));
  if (!apply) process.exitCode = 2;
  else for (const book of invalid) {
    await Book.updateOne({ _id: book._id }, { $set: {
      cover_url: '', cover_file_key: null, cover_source_url: null,
      cover_license_name: null, cover_license_url: null, cover_attribution: null
    } });
    if (book.cover_file_key) await removePrivateBookFile(book.cover_file_key);
    console.log(JSON.stringify({ event: 'cleared-generated-cover', title: book.title, bookId: String(book._id) }));
  }
  console.log(JSON.stringify({ event: 'generated-cover-cleanup-done', cleared: apply ? invalid.length : 0 }));
} finally { await mongoose.disconnect(); }
