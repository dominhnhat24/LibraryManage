import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import User from '../src/models/user.model.js';
import { importWikisourceBook, searchWikisourceBooks } from '../src/services/book-import.service.js';

const targets = [
  { query: 'Việt Nam sử lược/Quyển I', title: 'Việt Nam sử lược/Quyển I', author: 'Trần Trọng Kim' },
  { query: 'Việt Nam sử lược/Quyển II/1971', title: 'Việt Nam sử lược/Quyển II/1971', author: 'Trần Trọng Kim' },
];
const key = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('vi').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

try {
  await connectDB();
  const configuredOwner = process.env.ADMIN_OWNER_ID
    ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean()
    : null;
  const owner = configuredOwner || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
  if (!owner) throw new Error('Không tìm thấy ADMIN để gán quyền sở hữu sách');

  for (const target of targets) {
    try {
      const result = await searchWikisourceBooks(target.query);
      const candidate = result.candidates.find((item) => key(item.title) === key(target.title)
        && key(item.author).includes(key(target.author)));
      if (!candidate) throw new Error('Không tìm thấy đúng bản có tác giả và giấy phép nguồn được xác minh');
      const imported = await importWikisourceBook({
        pageTitle: candidate.id, ownerId: owner._id, genre: 'lich_su', confirmLicense: true, confirmCover: true
      });
      console.log(JSON.stringify({ title: target.title, author: candidate.author, status: imported.status,
        bookId: String(imported.book._id), source: candidate.sourceUrl, license: candidate.license,
        sourceCharacters: candidate.contentCharacters }));
    } catch (error) {
      console.error(JSON.stringify({ title: target.title, status: 'SKIPPED', reason: String(error.message || error).slice(0, 300) }));
    }
  }
} finally { await mongoose.disconnect(); }
