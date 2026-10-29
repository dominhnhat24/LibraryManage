import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
await connectDB();
const result = await Book.updateOne({ import_source: 'project_gutenberg', source_id: '163', title: 'Flower Fables', author_name: 'Alcott, Louisa May' }, { $set: { genre: 'van_hoc_the_gioi' } });
console.log(JSON.stringify({ database: mongoose.connection.name, matched: result.matchedCount, modified: result.modifiedCount }));
await mongoose.disconnect();
