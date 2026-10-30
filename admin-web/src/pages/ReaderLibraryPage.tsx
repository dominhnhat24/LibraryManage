// Import { useEffect, useMemo, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderLibraryPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useState } from 'react';
// Import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Grid2X2, List, Search } từ lucide-react để dùng trong giao diện.
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Grid2X2, List, Search } from 'lucide-react';
// Import { Link, useSearchParams } từ react-router-dom để dùng trong giao diện.
import { Link, useSearchParams } from 'react-router-dom';
// Import { errorMessage, fetchPublicBooks } từ ../api/client để dùng trong giao diện.
import { errorMessage, fetchPublicBooks } from '../api/client';
// Import type { Book } từ ../types để dùng trong giao diện.
import type { Book } from '../types';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import module từ ./reader-library.css để dùng trong giao diện.
import './reader-library.css';

// Biến PAGE_SIZE nhận giá trị từ 10. const không gán lại; let có thể cập nhật.
const PAGE_SIZE = 10;
// Biến API_PAGE_SIZE nhận giá trị từ 50. const không gán lại; let có thể cập nhật.
const API_PAGE_SIZE = 50;
// Biến categories nhận giá trị từ [ { key: 'van_hoc_viet_nam', label: 'Văn học Việt Nam' . const không gán lại; let có thể cập nhật.
const categories: Array<{ key: NonNullable<Book['genre']>; label: string }> = [
  { key: 'van_hoc_viet_nam', label: 'Văn học Việt Nam' },
  { key: 'truyen_ngan_viet_nam', label: 'Truyện ngắn' },
  { key: 'tho_viet_nam', label: 'Thơ Việt Nam' },
  { key: 'van_hoc_dan_gian', label: 'Văn học dân gian' },
  { key: 'van_hoc_the_gioi', label: 'Văn học thế giới' },
  { key: 'kinh_doanh', label: 'Kinh doanh' },
  { key: 'phat_trien_ban_than', label: 'Phát triển bản thân' },
  { key: 'tam_ly_hoc', label: 'Tâm lý học' },
  { key: 'lich_su', label: 'Lịch sử' },
  { key: 'khoa_hoc', label: 'Khoa học' },
];

/**
 * Hàm/thành phần ReaderLibraryPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useSearchParams, useState, get, useEffect, async, setLoading, setError, fetchPublicBooks.
 */
export function ReaderLibraryPage() {
  // Biến [searchParams] nhận giá trị từ useSearchParams(). const không gán lại; let có thể cập nhật.
  const [searchParams] = useSearchParams();
  // Biến [books, setBooks] nhận giá trị từ useState<Book[]>([]). const không gán lại; let có thể cập nhật.
  const [books, setBooks] = useState<Book[]>([]);
  // Biến [query, setQuery] nhận giá trị từ useState(() => searchParams.get('search') || ''). const không gán lại; let có thể cập nhật.
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  // Biến [genreFilter, setGenreFilter] nhận giá trị từ useState('all'). const không gán lại; let có thể cập nhật.
  const [genreFilter, setGenreFilter] = useState('all');
  // Biến [pages, setPages] nhận giá trị từ useState<Record<string, number>>({}). const không gán lại; let có thể cập nhật.
  const [pages, setPages] = useState<Record<string, number>>({});
  // Biến [sort, setSort] nhận giá trị từ useState('title'). const không gán lại; let có thể cập nhật.
  const [sort, setSort] = useState('title');
  // Biến [view, setView] nhận giá trị từ useState<'grid' | 'list'>('grid'). const không gán lại; let có thể cập nhật.
  const [view, setView] = useState<'grid' | 'list'>('grid');
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; const loadAllBooks = async () => { setLoadi
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    /**
     * Hàm/thành phần loadAllBooks: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: setLoading, setError, fetchPublicBooks, push, setBooks, errorMessage.
     */
    const loadAllBooks = async () => {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
      setLoading(true); setError('');
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến first nhận giá trị từ await fetchPublicBooks('', undefined, 1, API_PAGE_SIZE). const không gán lại; let có thể cập nhật.
        const first = await fetchPublicBooks('', undefined, 1, API_PAGE_SIZE);
        // Biến allBooks nhận giá trị từ [...first.books]. const không gán lại; let có thể cập nhật.
        const allBooks = [...first.books];
        // Vòng lặp duyệt dữ liệu hoặc lặp theo điều kiện để tạo/cập nhật kết quả.
        for (let page = 2; page <= first.pagination.totalPages; page += 1) {
          // Biến result nhận giá trị từ await fetchPublicBooks('', undefined, page, API_PAGE_SI. const không gán lại; let có thể cập nhật.
          const result = await fetchPublicBooks('', undefined, page, API_PAGE_SIZE);
          // Gọi/thực thi allBooks.push với đối số để cập nhật logic/giao diện: allBooks.push(...result.books)
          allBooks.push(...result.books);
        }
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setBooks(allBooks);
      } catch (loadError) { if (active) setError(errorMessage(loadError)); }
      finally { if (active) setLoading(false); }
    };
    // Gọi/thực thi loadAllBooks với đối số để cập nhật logic/giao diện: void loadAllBooks()
    void loadAllBooks();
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, []);

  // Biến normalizedQuery nhận giá trị từ query.trim().toLocaleLowerCase('vi'). const không gán lại; let có thể cập nhật.
  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  // Biến visibleBooks nhận giá trị từ useMemo(() => books.filter((book) => { if (genreFilter . const không gán lại; let có thể cập nhật.
  const visibleBooks = useMemo(() => books.filter((book) => {
    // if chỉ chạy nhánh này khi điều kiện genreFilter !== 'all' && (book.genre || 'van_hoc_viet_nam') !== genreFilter đúng.
    if (genreFilter !== 'all' && (book.genre || 'van_hoc_viet_nam') !== genreFilter) return false;
    // if chỉ chạy nhánh này khi điều kiện !normalizedQuery đúng.
    if (!normalizedQuery) return true;
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: `${book.title} ${book.author_name}`.toLocaleLowerCase('vi').includes(normalizedQ.
    return `${book.title} ${book.author_name}`.toLocaleLowerCase('vi').includes(normalizedQuery);
  }).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'vi') : (b.createdAt || '').localeCompare(a.createdAt || '')),
  [books, genreFilter, normalizedQuery, sort]);

  // Biến sections nhận giá trị từ categories .filter((category) => genreFilter === 'all' . const không gán lại; let có thể cập nhật.
  const sections = categories
    .filter((category) => genreFilter === 'all' || genreFilter === category.key)
    .map((category) => ({ ...category, books: visibleBooks.filter((book) => (book.genre || 'van_hoc_viet_nam') === category.key) }))
    .filter((category) => category.books.length > 0);
  /**
   * Hàm/thành phần changePage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: category, page.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setPages.
   */
  function changePage(category: string, page: number) { setPages((current) => ({ ...current, [category]: page })); }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderShell hideSearch> <div className="harvey-library"> <section className="ha.
  return <ReaderShell hideSearch>
    <div className="harvey-library">
      <section className="harvey-library-hero">
        <div><p className="harvey-eyebrow">HARVEYBOOK · TỦ SÁCH</p><h1>Tủ sách</h1><p>Khám phá những tác phẩm hay, từ văn học Việt Nam đến các câu chuyện vượt thời gian.</p></div>
        <div className="harvey-library-quote" aria-hidden="true"><div className="harvey-book-illustration"><BookOpen size={70} strokeWidth={1} /><span><i /><i /><i /></span></div><blockquote>“Mỗi cuốn sách là một cánh cửa mở ra một thế giới mới.”<small>— HarveyBook</small></blockquote></div>
      </section>

      <div className="harvey-library-toolbar">
        <section className="harvey-category-filter" aria-label="Lọc theo danh mục sách">
          <div className="harvey-genre-pills">
            <button className={genreFilter === 'all' ? 'is-active' : ''} onClick={() => { setGenreFilter('all'); setPages({}); }} type="button">Tất cả</button>
            {categories.map((category) => <button className={genreFilter === category.key ? 'is-active' : ''} key={category.key} onClick={() => { setGenreFilter(category.key); setPages({}); }} type="button">{category.label}</button>)}
          </div>
        </section>
        <div className="harvey-search-area">
          <section className="harvey-search-controls" aria-label="Tìm kiếm và sắp xếp sách">
            <label className="harvey-library-search"><Search size={16} /><input aria-label="Tìm sách hoặc tác giả" onChange={(event) => { setQuery(event.target.value); setPages({}); }} placeholder="Tìm tên sách, tác giả..." value={query} /></label>
            <label className="harvey-sort"><select aria-label="Sắp xếp sách" onChange={(event) => setSort(event.target.value)} value={sort}><option value="title">Tên sách</option><option value="newest">Mới thêm</option></select></label>
            <div className="harvey-view-toggle"><button aria-label="Xem dạng lưới" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} type="button"><Grid2X2 size={16} /></button><button aria-label="Xem dạng danh sách" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} type="button"><List size={16} /></button></div>
          </section>
        </div>
      </div>

      <p className="harvey-library-count">{visibleBooks.length.toLocaleString('vi-VN')} cuốn sách</p>
      {error && <div className="shelf-message is-error">{error}</div>}
      {loading ? <div className="shelf-message">Đang tải sách…</div> : sections.length ? sections.map((section) => {
        // Biến totalPages nhận giá trị từ Math.ceil(section.books.length / PAGE_SIZE). const không gán lại; let có thể cập nhật.
        const totalPages = Math.ceil(section.books.length / PAGE_SIZE);
        // Biến page nhận giá trị từ Math.min(pages[section.key] || 1, totalPages). const không gán lại; let có thể cập nhật.
        const page = Math.min(pages[section.key] || 1, totalPages);
        // Biến pageBooks nhận giá trị từ section.books.slice((page - 1) * PAGE_SIZE, page * PAGE. const không gán lại; let có thể cập nhật.
        const pageBooks = section.books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <section className={`harvey-shelf-section ${view === 'list' ? 'is-list' : ''}`} .
        return <section className={`harvey-shelf-section ${view === 'list' ? 'is-list' : ''}`} key={section.key}>
          <header><div><BookOpen size={18} /><h2>{section.label}</h2><span>{section.books.length} cuốn</span></div><span className="harvey-shelf-page">{totalPages > 1 ? `${page} / ${totalPages}` : ''}</span></header>
          <div className="harvey-shelf-grid">{pageBooks.map((book) => <Link className="harvey-book-card" key={book._id} to={`/books/${encodeURIComponent(book._id)}`}>
            <img alt={`Bìa sách ${book.title}`} onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }} src={book.cover_url || '/book-cover-placeholder.svg'} />
            <span><strong>{book.title}</strong><small>{book.author_name}</small></span>
          </Link>)}</div>
          {totalPages > 1 && <nav className="harvey-pagination" aria-label={`Phân trang ${section.label}`}><button disabled={page <= 1} onClick={() => changePage(section.key, page - 1)} type="button"><ChevronLeft size={15} /> Trước</button><span>Trang {page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => changePage(section.key, page + 1)} type="button">Tiếp <ChevronRight size={15} /></button></nav>}
        </section>;
      }) : <div className="shelf-message"><GraduationCap size={23} /><span>Chưa có sách trong thể loại này.</span></div>}
    </div>
  </ReaderShell>;
}
