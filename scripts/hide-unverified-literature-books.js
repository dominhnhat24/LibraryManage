// Keep incomplete records intact in the admin database, but hide them from readers until a licensed scan is found.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';

await connectDB();
try {
  const result = await Book.updateMany(
    {
      import_source: 'wikisource',
      status: 'published',
      cover_source_url: { $in: [null, ''] },
      cover_license_name: { $in: [null, 'Bìa thay thế do OpenBook thiết kế'] }
    },
    { $set: { status: 'draft', cover_url: '', cover_file_key: null, cover_attribution: null } }
  );
  console.log(`HIDDEN_UNVERIFIED_BOOKS modified=${result.modifiedCount}`);
} finally {
  await mongoose.disconnect();
}
