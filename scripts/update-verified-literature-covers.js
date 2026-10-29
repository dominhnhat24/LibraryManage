// Replace generated covers only with verified public-domain scans of the same edition/work.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import { removePrivateBookFile, resolvePrivateBookFile, savePrivateBookCover } from '../src/utils/private-book-storage.js';

const assetDirectory = process.env.LITERATURE_COVER_ASSET_DIR;
if (!assetDirectory) throw new Error('Set LITERATURE_COVER_ASSET_DIR to the downloaded, verified Commons scans folder.');

const covers = [
  {
    title: 'Truyện Kiều', file: 'truyen-kieu-cover.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Kim_V%C3%A2n_Ki%E1%BB%81u_t%C3%A2n_truy%E1%BB%87n.jpg',
    license: 'Public Domain Mark 1.0',
    attribution: 'Ảnh trang tên sách từ bản quét Kim Vân Kiều tân truyện; Nôm Foundation via Wikimedia Commons. Đây là trang tên sách bản quét, không phải bìa rời.'
  },
  {
    title: 'Nụ cười (Nam Cao)', file: 'nu-cuoi-cover.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Nu_cuoi.pdf',
    license: 'Public domain (Vietnam)',
    attribution: 'Bản quét bìa ấn bản Nụ cười của Nam Cao, NXB Cộng Lực (1941); Gallica/BnF via Wikimedia Commons.'
  },
  {
    title: 'Con nhà nghèo', file: 'con-nha-ngheo.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Con_nha_ngheo.pdf',
    license: 'Public domain (Vietnam)',
    attribution: 'Bản quét bìa ấn bản Con nhà nghèo, NXB Đức Lưu Phương (1930); Gallica/Bibliothèque nationale de France via Wikimedia Commons.'
  },
  {
    title: 'Từ hôn', file: 'tu-hon-cover.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Tu_hon.pdf',
    license: 'Public domain (Vietnam)',
    attribution: 'Bản quét bìa ấn bản Từ hôn của Hồ Biểu Chánh (1937); Gallica/BnF via Wikimedia Commons.'
  },
  {
    title: 'Kẻ làm người chịu', file: 'ke-lam-nguoi-chiu-1-cover.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Ke_lam_nguoi_chiu_1.pdf',
    license: 'Public domain (Vietnam)',
    attribution: 'Bản quét bìa Kẻ làm người chịu, quyển 1 của Hồ Biểu Chánh (1929); Gallica/BnF via Wikimedia Commons.'
  },
  {
    title: 'Chút phận linh đinh', file: 'chut-phan-linh-dinh-cover.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Chut_phan_linh_dinh_1.pdf',
    license: 'Public domain (Vietnam)',
    attribution: 'Bản quét bìa ấn bản Chút phận linh đinh, quyển 1 của Hồ Biểu Chánh (1928); Gallica/BnF via Wikimedia Commons.'
  }
];

await connectDB();
let updated = 0;
try {
  const publicApiBase = (process.env.PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api/v1`).replace(/\/+$/, '');
  for (const asset of covers) {
    const book = await Book.findOne({ import_source: 'wikisource', title: asset.title }).select('+cover_file_key');
    if (!book) { console.log(`SKIP_NOT_FOUND title=${JSON.stringify(asset.title)}`); continue; }
    const existingIsVerifiedLocal = book.cover_file_key && !/\.svg$/i.test(book.cover_file_key)
      && book.cover_source_url && book.cover_license_name && book.cover_attribution;
    if (existingIsVerifiedLocal) {
      await resolvePrivateBookFile(book.cover_file_key);
      const expectedUrl = `${publicApiBase}/books/${book._id}/cover`;
      if (book.cover_url !== expectedUrl) { book.cover_url = expectedUrl; await book.save(); }
      console.log(`KEEP_VERIFIED_LOCAL title=${JSON.stringify(asset.title)} key=${book.cover_file_key}`);
      continue;
    }
    const oldKey = book.cover_file_key;
    const buffer = await readFile(`${assetDirectory.replace(/[\\/]$/, '')}/${asset.file}`);
    const saved = await savePrivateBookCover({ buffer, mimetype: 'image/jpeg' });
    book.cover_file_key = saved.file_key;
    book.cover_url = `${publicApiBase}/books/${book._id}/cover`;
    book.cover_source_url = asset.source;
    book.cover_license_name = asset.license;
    book.cover_license_url = asset.source;
    book.cover_attribution = asset.attribution;
    try {
      await book.save();
      await resolvePrivateBookFile(saved.file_key);
    } catch (error) {
      await removePrivateBookFile(saved.file_key).catch(() => {});
      throw error;
    }
    if (oldKey && oldKey !== saved.file_key) await removePrivateBookFile(oldKey).catch(() => {});
    updated += 1;
    console.log(`UPDATED title=${JSON.stringify(asset.title)} source=${asset.source}`);
  }
  console.log(`COVER_UPDATE_DONE updated=${updated}`);
} finally {
  await mongoose.disconnect();
}
