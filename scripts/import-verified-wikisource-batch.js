// Search and import only Wikisource editions whose current license, attribution, and full text pass live checks.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import User from '../src/models/user.model.js';
import { ensureWikisourceChapters, importWikisourceBook, searchWikisourceBooks } from '../src/services/book-import.service.js';

const targets = [
  { query: 'lịch sử nước ta', title: 'Lịch sử nước ta', author: 'Hồ Chí Minh', genre: 'lich_su' },
  { query: 'Đại nghĩa diệt thân', title: 'Đại nghĩa diệt thân', author: 'Hồ Biểu Chánh', genre: 'van_hoc_viet_nam' },
  { query: 'Hạnh phúc lối nào', title: 'Hạnh phúc lối nào', author: 'Hồ Biểu Chánh', genre: 'van_hoc_viet_nam' },
  { query: 'Lão Hạc', title: 'Lão Hạc', author: 'Nam Cao', genre: 'truyen_ngan_viet_nam' },
  { query: 'Trần Trọng Kim', title: 'Hịch tướng sĩ (Trần Trọng Kim dịch)', author: 'Trần Hưng Đạo', genre: 'lich_su' },
  { query: 'Ca dao Việt Nam', title: 'Đại Nam Quốc sử Diễn ca', author: 'Lê Ngô Cát', genre: 'lich_su' },
  { query: 'Khối tình con', title: 'Khối tình con/Quyển thứ hai', author: 'Tản Đà', genre: 'tho_viet_nam' },
  { query: 'truyện ngắn Thạch Lam', title: 'Sợi tóc (truyện ngắn)', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'truyện ngắn Thạch Lam', title: 'Tối ba mươi', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'truyện ngắn Thạch Lam', title: 'Đứa con đầu lòng', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'truyện ngắn Thạch Lam', title: 'Tiếng chim kêu', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'truyện ngắn Thạch Lam', title: 'Người lính cũ', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Phạm Duy Tốn', title: 'Sống chết mặc bay', author: 'Phạm Duy Tốn', genre: 'truyen_ngan_viet_nam' },
  { query: 'Vũ Trọng Phụng', title: 'Làm đĩ', author: 'Vũ Trọng Phụng', genre: 'van_hoc_viet_nam' },
  { query: 'Vũ Trọng Phụng', title: 'Lục sì', author: 'Vũ Trọng Phụng', genre: 'van_hoc_viet_nam' },
  { query: 'Gió lạnh đầu mùa', title: 'Gió lạnh đầu mùa', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Nắng trong vườn', title: 'Nắng trong vườn', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Nắng trong vườn', title: 'Dưới bóng hoàng lan', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Hai đứa trẻ', title: 'Hai đứa trẻ', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Cô hàng xén', title: 'Cô hàng xén', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Hai đứa trẻ', title: 'Cánh tay đứa trẻ', author: 'Lê Văn Trương', genre: 'truyen_ngan_viet_nam' },
  { query: 'Nhà mẹ Lê', title: 'Nhà mẹ Lê', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Đêm sáng trăng', title: 'Đêm sáng trăng', author: 'Thạch Lam', genre: 'truyen_ngan_viet_nam' },
  { query: 'Đêm sáng trăng', title: 'Trăng sáng', author: 'Nam Cao', genre: 'truyen_ngan_viet_nam' },
  { query: 'Hà Nội băm sáu phố phường', title: 'Hà Nội băm sáu phố phường', author: 'Thạch Lam', genre: 'van_hoc_viet_nam' },
];
const normalize = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('vi').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const outcomes = [];
const searchCache = new Map();

try {
  await connectDB();
  const before = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const configuredOwner = process.env.ADMIN_OWNER_ID
    ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean() : null;
  const owner = configuredOwner || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
  if (!owner) throw new Error('Không tìm thấy tài khoản ADMIN');
  console.log(JSON.stringify({ event: 'batch-start', database: mongoose.connection.name, counts: before }));
  for (const target of targets) {
    try {
      const escapedTargetTitle = target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedTargetAuthor = target.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const alreadyImported = await Book.findOne({ title: new RegExp(`^${escapedTargetTitle}$`, 'i'), author_name: new RegExp(escapedTargetAuthor, 'i') }).select('_id title').lean();
      if (alreadyImported) {
        outcomes.push({ title: target.title, status: 'EXISTS', bookId: String(alreadyImported._id) });
        console.log(JSON.stringify({ event: 'book', title: target.title, status: 'EXISTS', bookId: String(alreadyImported._id) }));
        continue;
      }
      let result = searchCache.get(target.query);
      if (!result) {
        result = await searchWikisourceBooks(target.query, { minimumCharacters: 5000 });
        searchCache.set(target.query, result);
      }
      let candidate = result.candidates.find((item) => normalize(item.title) === normalize(target.title)
        && normalize(item.author).includes(normalize(target.author)));
      if (!candidate) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        result = searchCache.get(target.title);
        if (!result) {
          result = await searchWikisourceBooks(target.title, { minimumCharacters: 5000 });
          searchCache.set(target.title, result);
        }
        candidate = result.candidates.find((item) => normalize(item.title) === normalize(target.title)
          && normalize(item.author).includes(normalize(target.author)));
      }
      if (!candidate) throw new Error(`Không tìm thấy bản khớp tác giả + license + toàn văn: ${result.excludedCandidates.find((x) => normalize(x.title) === normalize(target.title))?.reasons?.join('; ') || 'không có ứng viên hợp lệ'}`);
      const existing = await Book.findOne({ $or: [
        { import_source: 'wikisource', source_id: candidate.id },
        { title: new RegExp(`^${candidate.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), author_name: new RegExp(`^${candidate.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ] }).select('_id title').lean();
      if (existing) {
        outcomes.push({ title: target.title, status: 'EXISTS', bookId: String(existing._id), source: candidate.sourceUrl });
        console.log(JSON.stringify({ event: 'book', title: target.title, status: 'EXISTS', bookId: String(existing._id) }));
        continue;
      }
      const imported = await importWikisourceBook({ pageTitle: candidate.id, ownerId: owner._id,
        genre: target.genre, confirmLicense: true, confirmCover: true });
      const chapters = await ensureWikisourceChapters({ pageTitle: candidate.id, bookId: imported.book._id, genre: target.genre });
      outcomes.push({ title: target.title, author: candidate.author, status: imported.status, bookId: String(imported.book._id), chapters: chapters.total, characters: candidate.contentCharacters, source: candidate.sourceUrl, license: candidate.license });
      console.log(JSON.stringify({ event: 'book', title: target.title, author: candidate.author, status: imported.status, bookId: String(imported.book._id), chapters: chapters.total, characters: candidate.contentCharacters, source: candidate.sourceUrl, license: candidate.license }));
    } catch (error) {
      const item = { title: target.title, status: 'SKIPPED', reason: String(error.message || error).slice(0, 260) };
      outcomes.push(item); console.log(JSON.stringify({ event: 'book', ...item }));
    }
  }
  const after = await Book.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  console.log(JSON.stringify({ event: 'batch-end', database: mongoose.connection.name,
    imported: outcomes.filter((item) => ['imported', 'already_imported'].includes(item.status)).length,
    outcomes, countsBefore: before, countsAfter: after }));
} finally { await mongoose.disconnect(); }
