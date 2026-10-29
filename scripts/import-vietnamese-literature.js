// [IMPORT VĂN HỌC VIỆT NAM] Chỉ import tác phẩm Wikisource đã qua kiểm chứng license, văn bản và bìa.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import User from '../src/models/user.model.js';
import { ensureWikisourceChapters, importWikisourceBook, searchWikisourceBooks } from '../src/services/book-import.service.js';

const targets = [
  { title: 'Truyện Kiều', author: ['Nguyễn Du'], genre: 'tho_viet_nam' },
  { title: 'Cha con nghĩa nặng', author: ['Hồ Biểu Chánh'] },
  { title: 'Chúa tàu Kim Quy', author: ['Hồ Biểu Chánh'] },
  { title: 'Con nhà nghèo', author: ['Hồ Biểu Chánh'] },
  { title: 'Con nhà giàu', author: ['Hồ Biểu Chánh'] },
  { title: 'Lão Hạc', author: ['Nam Cao'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Nụ cười', matchTitle: 'Nụ cười (Nam Cao)', author: ['Nam Cao'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Từ hôn', author: ['Hồ Biểu Chánh'] },
  { title: 'Kẻ làm người chịu', author: ['Hồ Biểu Chánh'] },
  { title: 'Chút phận linh đinh', author: ['Hồ Biểu Chánh'] },
  { title: 'Tắt đèn', author: ['Ngô Tất Tố'] },
  { title: 'Lều chõng', author: ['Ngô Tất Tố'] },
  { title: 'Ba ngày luân lạc', author: ['Lê Văn Trương'] },
  { title: 'Nửa chừng xuân', author: ['Khái Hưng'] },
  { title: 'Đêm sáng trăng', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Cái xó bếp', author: ['Lê Văn Trương'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Dưới bóng hoàng lan', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Cô hàng xén', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Hai đứa trẻ', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Gió lạnh đầu mùa', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Ba người bạn', author: ['Nam Cao'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Bóng người xưa', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' },
  { title: 'Đứa con đầu lòng', author: ['Thạch Lam'], genre: 'truyen_ngan_viet_nam' }
];

const key = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase('vi').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const baseTitle = (value) => key(value).replace(/\s*\([^)]*\)\s*$/g, '').trim();
const results = [];

try {
  await connectDB();
  const configuredOwner = process.env.ADMIN_OWNER_ID
    ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean()
    : null;
  const owner = configuredOwner || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
  if (!owner) throw new Error('Không tìm thấy tài khoản ADMIN để gán quyền sở hữu sách');

  const beforeCount = await Book.countDocuments();
  console.log(`IMPORT_START database=${mongoose.connection.name} books_before=${beforeCount}`);
  for (const target of targets) {
    try {
      const escapedTitle = target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingBook = await Book.findOne({ import_source: 'wikisource', title: new RegExp(`^${escapedTitle}$`, 'i') })
        .select('+file_key +cover_file_key').lean();
      if (existingBook) {
        const existingUpdate = { genre: target.genre || 'van_hoc_viet_nam' };
        if (target.title !== 'Chúa tàu Kim Quy') existingUpdate.cover_url = '';
        await Book.updateOne({ _id: existingBook._id }, { $set: existingUpdate });
        const chapters = await ensureWikisourceChapters({ pageTitle: existingBook.source_id || target.title, bookId: existingBook._id, genre: target.genre });
        results.push({ title: target.title, substitutedFor: target.substitutedFor, id: String(existingBook._id), status: 'SUCCESS_EXISTING', chapters: chapters.total });
        console.log(`BOOK_RESULT title=${JSON.stringify(target.title)} status=SUCCESS_EXISTING chapters=${chapters.total} id=${existingBook._id}`);
        continue;
      }
      const minCharacters = target.genre === 'tho_viet_nam' ? 500 : 5000;
      let search = await searchWikisourceBooks(target.title, { minimumCharacters: minCharacters });
      const expectedTitle = target.matchTitle || target.title;
      let eligible = search.candidates.find((candidate) => baseTitle(candidate.title) === key(expectedTitle)
        && target.author.some((name) => key(candidate.author).includes(key(name)))
        && (!target.translator || key(candidate.translator).includes(key(target.translator))));
      // Search results can be temporarily incomplete/ranked around individual chapter pages.
      // Retry the exact title once before classifying a known work as missing.
      if (!eligible) {
        search = await searchWikisourceBooks(target.title, { minimumCharacters: minCharacters });
        eligible = search.candidates.find((candidate) => baseTitle(candidate.title) === key(expectedTitle)
          && target.author.some((name) => key(candidate.author).includes(key(name)))
          && (!target.translator || key(candidate.translator).includes(key(target.translator))));
      }
      if (!eligible) {
        const rejected = search.excludedCandidates.find((candidate) => baseTitle(candidate.title) === key(expectedTitle));
        const reasons = rejected?.reasons || (target.translator
          ? ['Không tìm thấy bản dịch nguồn có tên người dịch khớp chính xác']
          : ['Không tìm thấy trang nguồn có tiêu đề/tác giả khớp chính xác']);
        const licenseRejected = reasons.some((reason) => /license|bản quyền|giấy phép/i.test(reason));
        const status = licenseRejected ? 'SKIPPED_LICENSE' : 'FAILED';
        results.push({ title: target.title, substitutedFor: target.substitutedFor, status, reasons });
        console.log(`BOOK_RESULT title=${JSON.stringify(target.title)} status=${status} reasons=${JSON.stringify(reasons)}`);
        continue;
      }
      const imported = await importWikisourceBook({
        pageTitle: eligible.id,
        ownerId: owner._id,
        genre: target.genre || 'van_hoc_viet_nam',
        confirmLicense: true,
        confirmCover: true
      });
      const book = await Book.findById(imported.book._id).select('+cover_file_key +file_key').lean();
      if (!book) throw new Error('Imported book record was not found');
      const importedUpdate = { genre: target.genre || 'van_hoc_viet_nam' };
      if (target.title !== 'Chúa tàu Kim Quy') importedUpdate.cover_url = '';
      await Book.updateOne({ _id: book._id }, { $set: importedUpdate });
      const chapters = await ensureWikisourceChapters({ pageTitle: book.source_id || eligible.id, bookId: book._id, genre: target.genre });
      const status = imported.status === 'duplicate' || imported.status === 'already_imported' ? 'SUCCESS_EXISTING' : 'SUCCESS';
      results.push({ title: target.title, substitutedFor: target.substitutedFor, id: String(book._id), status, chapters: chapters.total, source: eligible.sourceUrl, license: eligible.license });
      console.log(`BOOK_RESULT title=${JSON.stringify(target.title)} status=${status} chapters=${chapters.total} id=${book._id} source=${eligible.sourceUrl}`);
    } catch (error) {
      const reason = String(error.message || 'Import failed').slice(0, 300);
      results.push({ title: target.title, substitutedFor: target.substitutedFor, status: 'FAILED', reasons: [reason] });
      console.error(`BOOK_RESULT title=${JSON.stringify(target.title)} status=FAILED reason=${JSON.stringify(reason)}`);
    }
  }
  const afterCount = await Book.countDocuments();
  console.log(JSON.stringify({ summary: { target: targets.length, succeeded: results.filter((item) => item.status.startsWith('SUCCESS')).length,
    failed: results.filter((item) => item.status === 'FAILED').length, skippedLicense: results.filter((item) => item.status === 'SKIPPED_LICENSE').length,
    booksBefore: beforeCount, booksAfter: afterCount, newBooks: afterCount - beforeCount }, results }, null, 2));
} catch (error) {
  console.error(`IMPORT_ABORTED ${error.name}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
