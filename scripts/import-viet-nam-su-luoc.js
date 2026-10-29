// Imports the verified public-domain scan of the complete work as a paginated PDF.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import User from '../src/models/user.model.js';
import { savePrivateBookStream } from '../src/utils/private-book-storage.js';

const sourceId = 'commons-viet-nam-su-luoc-volume-2';
const sourceUrl = 'https://commons.wikimedia.org/wiki/File:Viet_Nam_Su_Luoc_2.pdf';
const downloadUrl = 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Viet_Nam_Su_Luoc_2.pdf';
const licenseUrl = 'https://creativecommons.org/publicdomain/';

try {
  await connectDB();
  const existing = await Book.findOne({ import_source: 'internet_archive', source_id: sourceId });
  if (existing) {
    console.log(JSON.stringify({ status: 'EXISTS', title: existing.title, bookId: String(existing._id) }));
  } else {
    const configuredOwner = process.env.ADMIN_OWNER_ID
      ? await User.findOne({ _id: process.env.ADMIN_OWNER_ID, role: 'ADMIN' }).select('_id').lean() : null;
    const owner = configuredOwner || await User.findOne({ role: 'ADMIN' }).select('_id').sort({ createdAt: 1 }).lean();
    if (!owner) throw new Error('Không tìm thấy tài khoản ADMIN để gán sách');
    const response = await fetch(downloadUrl, {
      headers: { 'User-Agent': process.env.WIKISOURCE_USER_AGENT || 'HarveyLibrary/1.0 (book import)' },
      signal: AbortSignal.timeout(120000)
    });
    if (!response.ok || !response.body) throw new Error(`Không tải được PDF nguồn (HTTP ${response.status})`);
    const file = await savePrivateBookStream({ stream: Readable.fromWeb(response.body), originalname: 'Viet-Nam-Su-Luoc.pdf',
      mimetype: 'application/pdf', category: 'ebook', maxBytes: 100 * 1024 * 1024 });
    try {
      const book = await Book.create({ title: 'Việt Nam sử lược – Quyển II', author_name: 'Trần Trọng Kim', category: 'ebook', genre: 'lich_su',
        publication_year: 1919, description: 'Bản số hóa toàn văn tiếng Việt, 408 trang. Tệp PDF được chia trang sẵn; Harvey mở trực tiếp theo từng trang.\n\nNguồn và thông tin bản số hóa: Wikimedia Commons. Tác phẩm được ghi nhận thuộc phạm vi công cộng.',
        cover_url: '',
    import_source: 'wikimedia_commons', source_id: sourceId, source_url: sourceUrl, license_name: 'Public domain', license_url: licenseUrl,
        language: 'vi', file_format: 'PDF', file_size: file.size, file_key: file.file_key, file_original_name: file.original_name,
        access_level: 'free', owner: owner._id, status: 'published', verified_at: new Date() });
      console.log(JSON.stringify({ status: 'IMPORTED', title: book.title, author: book.author_name, bookId: String(book._id),
        bytes: file.size, source: sourceUrl, license: 'Public domain' }));
    } catch (error) {
      const { removePrivateBookFile } = await import('../src/utils/private-book-storage.js');
      await Promise.allSettled([removePrivateBookFile(file.file_key)]);
      throw error;
    }
  }
} finally { await mongoose.disconnect(); }
