
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js'
import Book from '../src/models/book.model.js';
import {
  savePrivateBookFile,
  removePrivateBookFile,
} from '../src/utils/private-book-storage.js';

const TARGET_BOOKS = 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80 MB

const SEARCH_URL =
  'https://archive.org/advancedsearch.php';

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(value, maxLength = 5000) {
  const text = Array.isArray(value)
    ? value.join(', ')
    : String(value ?? '');

  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalize(value) {
  return cleanText(value, 5000)
    .normalize('NFKC')
    .toLocaleLowerCase('en');
}

function getFirst(value) {
  return Array.isArray(value) ? value[0] : value;
}

// Chỉ nhận quyền Public Domain hoặc CC0 được khai báo rõ ràng.
// Không xem việc có file PDF là bằng chứng về quyền phân phối.
function hasAllowedRights(metadata) {
  const values = [
    metadata?.rights,
    metadata?.licenseurl,
    metadata?.license,
  ]
    .flat()
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return values.some((value) =>
    /public domain|creativecommons\.org\/publicdomain\/zero|creativecommons\.org\/publicdomain\/0/i.test(
      value,
    ),
  );
}

function getBookInfo(metadata) {
  const title = cleanText(metadata?.title, 200);
  const author = cleanText(
    metadata?.creator ?? metadata?.author,
    120,
  );

  if (!title || !author) return null;

  const rawYear = String(
    getFirst(metadata?.year ?? metadata?.date) ?? '',
  ).match(/\b(?:1\d{3}|2\d{3})\b/)?.[0];

  const year = rawYear ? Number(rawYear) : null;

  return {
    title,
    author_name: author,
    category: 'ebook',
    publication_year:
      year && year >= 1 && year <= 3000 ? year : null,
    description: cleanText(metadata?.description, 5000),
    cover_url: '',
    access_level: 'premium',
    status: 'published',
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      'User-Agent': 'OpenBook-LibraryImporter/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

async function searchArchive(page) {
  const params = new URLSearchParams();

  params.set(
    'q',
    'mediatype:texts AND rights:"Public Domain"',
  );
  params.append('fl[]', 'identifier');
  params.append('fl[]', 'title');
  params.append('fl[]', 'creator');
  params.append('fl[]', 'year');
  params.append('fl[]', 'description');
  params.append('fl[]', 'rights');
  params.set('rows', String(PAGE_SIZE));
  params.set('page', String(page));
  params.set('output', 'json');

  const data = await fetchJson(
    `${SEARCH_URL}?${params.toString()}`,
  );

  return data?.response?.docs ?? [];
}

async function fetchMetadata(identifier) {
  return fetchJson(
    `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
  );
}

function findPdfFile(files) {
  if (!Array.isArray(files)) return null;

  const candidates = files
    .filter((file) => {
      const name = String(file?.name ?? '');

      if (!/\.pdf$/i.test(name)) return false;

      const size = Number(file?.size ?? 0);

      return !size || size <= MAX_FILE_SIZE;
    })
    .sort((a, b) => {
      // Ưu tiên PDF nhỏ hơn để giảm thời gian tải.
      return Number(a.size || 0) - Number(b.size || 0);
    });

  return candidates[0] ?? null;
}

async function downloadPdf(identifier, fileInfo) {
  const url =
    `https://archive.org/download/` +
    `${encodeURIComponent(identifier)}/` +
    `${encodeURIComponent(fileInfo.name)}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(120000),
    headers: {
      'User-Agent': 'OpenBook-LibraryImporter/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Không tải được PDF: HTTP ${response.status}`);
  }

  const declaredLength = Number(
    response.headers.get('content-length') ?? 0,
  );

  if (declaredLength > MAX_FILE_SIZE) {
    throw new Error('PDF vượt quá giới hạn 80 MB');
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('PDF tải về vượt quá giới hạn 80 MB');
  }

  // Kiểm tra chữ ký PDF, không chỉ dựa vào phần mở rộng.
  if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Nội dung tải về không phải PDF hợp lệ');
  }

  return buffer;
}

async function importBooks() {
  const ownerId = process.env.ADMIN_OWNER_ID;

  if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
    throw new Error(
      'Cần đặt ADMIN_OWNER_ID bằng MongoDB ObjectId của tài khoản Admin.',
    );
  }

  await connectDB();

  // Tạo bộ chỉ mục trong bộ nhớ để phát hiện trùng theo tên sách
  // và tác giả, không phân biệt chữ hoa/thường.
  const existingBooks = await Book.find({})
    .select('title author_name')
    .lean();

  const knownBooks = new Set(
    existingBooks.map(
      (book) =>
        `${normalize(book.title)}::${normalize(book.author_name)}`,
    ),
  );

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Bắt đầu nhập sách. Mục tiêu: ${TARGET_BOOKS}`);

  try {
    for (
      let page = 1;
      page <= MAX_PAGES && imported < TARGET_BOOKS;
      page++
    ) {
      let results;

      try {
        results = await searchArchive(page);
      } catch (error) {
        console.error(
          `Không tìm được dữ liệu ở trang ${page}:`,
          error.message,
        );
        failed++;
        break;
      }

      if (results.length === 0) break;

      for (const result of results) {
        if (imported >= TARGET_BOOKS) break;

        const identifier = result.identifier;

        if (!identifier) {
          skipped++;
          continue;
        }

        let savedFileKey = null;

        try {
          await delay(500);

          const archive = await fetchMetadata(identifier);
          const metadata = archive?.metadata;

          // Kiểm tra quyền ở metadata chi tiết thay vì tin
          // riêng kết quả tìm kiếm.
          if (!hasAllowedRights(metadata)) {
            skipped++;
            continue;
          }

          const bookInfo = getBookInfo(metadata);

          if (!bookInfo) {
            skipped++;
            continue;
          }

          const duplicateKey =
            `${normalize(bookInfo.title)}::` +
            `${normalize(bookInfo.author_name)}`;

          if (knownBooks.has(duplicateKey)) {
            skipped++;
            continue;
          }

          const pdfFile = findPdfFile(archive?.files);

          if (!pdfFile) {
            skipped++;
            continue;
          }

          const buffer = await downloadPdf(identifier, pdfFile);

          const originalName =
            String(pdfFile.name).split('/').pop() ||
            `${identifier}.pdf`;

          const privateFile = await savePrivateBookFile(
            {
              buffer,
              originalname: originalName.slice(0, 200),
              mimetype: 'application/pdf',
            },
            'ebook',
          );

          savedFileKey = privateFile.file_key;

          try {
            await Book.create({
              ...bookInfo,
              owner: new mongoose.Types.ObjectId(ownerId),
              file_key: privateFile.file_key,
              file_original_name: privateFile.original_name,
            });
          } catch (error) {
            // Xóa file nếu tạo bản ghi thất bại để tránh file rác.
            await removePrivateBookFile(savedFileKey);
            savedFileKey = null;
            throw error;
          }

          knownBooks.add(duplicateKey);
          imported++;

          console.log(
            `[${imported}/${TARGET_BOOKS}] Đã nhập: ${bookInfo.title}`,
          );
        } catch (error) {
          failed++;
          console.error(
            `Bỏ qua ${identifier}: ${error.message}`,
          );
        }
      }

      console.log(
        `Tiến độ: ${imported} thành công, ` +
          `${skipped} bỏ qua, ${failed} lỗi.`,
      );
    }
  } finally {
    console.log('\n===== KẾT QUẢ =====');
    console.log(`Nhập thành công: ${imported}`);
    console.log(`Bỏ qua: ${skipped}`);
    console.log(`Lỗi: ${failed}`);
    console.log(`Mục tiêu: ${TARGET_BOOKS}`);
    console.log(
      imported < TARGET_BOOKS
        ? 'Chưa đủ 1.000 sách; nguồn tìm kiếm có thể không còn kết quả phù hợp.'
        : 'Đã đạt mục tiêu nhập sách.',
    );

    await mongoose.disconnect();
  }
}

importBooks().catch((error) => {
  console.error('Import thất bại:', error);
  process.exitCode = 1;
});
