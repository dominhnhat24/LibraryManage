import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Grid2X2, List, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { errorMessage, fetchPublicBooks } from '../api/client';
import type { Book } from '../types';
import { ReaderShell } from '../components/ReaderShell';
import './reader-library.css';

const PAGE_SIZE = 10;
const API_PAGE_SIZE = 50;
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

export function ReaderLibraryPage() {
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  const [genreFilter, setGenreFilter] = useState('all');
  const [pages, setPages] = useState<Record<string, number>>({});
  const [sort, setSort] = useState('title');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadAllBooks = async () => {
      setLoading(true); setError('');
      try {
        const first = await fetchPublicBooks('', undefined, 1, API_PAGE_SIZE);
        const allBooks = [...first.books];
        for (let page = 2; page <= first.pagination.totalPages; page += 1) {
          const result = await fetchPublicBooks('', undefined, page, API_PAGE_SIZE);
          allBooks.push(...result.books);
        }
        if (active) setBooks(allBooks);
      } catch (loadError) { if (active) setError(errorMessage(loadError)); }
      finally { if (active) setLoading(false); }
    };
    void loadAllBooks();
    return () => { active = false; };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const visibleBooks = useMemo(() => books.filter((book) => {
    if (genreFilter !== 'all' && (book.genre || 'van_hoc_viet_nam') !== genreFilter) return false;
    if (!normalizedQuery) return true;
    return `${book.title} ${book.author_name}`.toLocaleLowerCase('vi').includes(normalizedQuery);
  }).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'vi') : (b.createdAt || '').localeCompare(a.createdAt || '')),
  [books, genreFilter, normalizedQuery, sort]);

  const sections = categories
    .filter((category) => genreFilter === 'all' || genreFilter === category.key)
    .map((category) => ({ ...category, books: visibleBooks.filter((book) => (book.genre || 'van_hoc_viet_nam') === category.key) }))
    .filter((category) => category.books.length > 0);
  function changePage(category: string, page: number) { setPages((current) => ({ ...current, [category]: page })); }

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
        const totalPages = Math.ceil(section.books.length / PAGE_SIZE);
        const page = Math.min(pages[section.key] || 1, totalPages);
        const pageBooks = section.books.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
