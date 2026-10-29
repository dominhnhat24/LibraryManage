import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';

const genreForTitle = (title) => {
  if (title === 'Truyện Kiều') return 'tho_viet_nam';
  if (['Lão Hạc', 'Nụ cười (Nam Cao)'].includes(title)) return 'truyen_ngan_viet_nam';
  return 'van_hoc_viet_nam';
};

try {
  await connectDB();
  const books = await Book.find({}, { title: 1, genre: 1 }).lean();
  const operations = books.map((book) => ({
    updateOne: {
      filter: { _id: book._id },
      update: {
        $set: {
          genre: genreForTitle(book.title),
          ...(book.title === 'Chúa tàu Kim Quy' ? {} : { cover_url: '' }),
        },
      },
    },
  }));
  if (operations.length) await Book.bulkWrite(operations, { ordered: false });
  const [total, categories, linkedCovers] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Book.find({ cover_url: { $nin: ['', null] } }, { title: 1 }).lean(),
  ]);
  console.log(JSON.stringify({ database: mongoose.connection.name, total, categories, booksWithCoverLinks: linkedCovers.map(({ title }) => title) }, null, 2));
} finally {
  await mongoose.disconnect();
}
