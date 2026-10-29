import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';

await connectDB();
const result = await Book.updateOne({ source_id: 'commons-viet-nam-su-luoc-volume-2',
  title: 'Việt Nam sử lược – Quyển II', author_name: 'Trần Trọng Kim' }, { $set: { import_source: 'wikimedia_commons' } });
console.log(JSON.stringify({ database: mongoose.connection.name, matched: result.matchedCount,
  modified: result.modifiedCount, source: 'wikimedia_commons' }));
await mongoose.disconnect();
