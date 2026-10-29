// [MIGRATION CHỈ MỤC SÁCH] Tránh dùng trường metadata `language=vi` làm text-index override của MongoDB.
import mongoose from 'mongoose';
mongoose.set('autoIndex', false);
await import('../src/config/load-env.js');
const [{ connectDB }, { default: Book }] = await Promise.all([
  import('../src/config/database.config.js'),
  import('../src/models/book.model.js')
]);

try {
  await connectDB();
  const indexes = await Book.collection.indexes();
  const textIndex = indexes.find((index) => index.key?._fts === 'text');
  if (textIndex && textIndex.language_override !== 'search_language') {
    await Book.collection.dropIndex(textIndex.name);
    console.log(`Dropped obsolete book text index: ${textIndex.name}`);
  }
  const current = (await Book.collection.indexes()).find((index) => index.key?._fts === 'text');
  if (!current) {
    await Book.collection.createIndex(
      { title: 'text', author_name: 'text', description: 'text' },
      { name: 'title_text_author_name_text_description_text', weights: { title: 1, author_name: 1, description: 1 }, default_language: 'none', language_override: 'search_language' }
    );
    console.log('Created book text index with language_override=search_language');
  } else {
    console.log(`Book text index is already current: ${current.name}`);
  }
} catch (error) {
  console.error(`Book text index migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
