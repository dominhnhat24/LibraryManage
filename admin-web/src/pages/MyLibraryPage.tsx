// Import { useEffect, useMemo, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/MyLibraryPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useState } from 'react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { ReaderLayout } từ ../components/ReaderLayout để dùng trong giao diện.
import { ReaderLayout } from '../components/ReaderLayout';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { errorMessage, fetchPublicBook, fetchReaderBookmarks, fetchReadingProgress } từ ../api/client để dùng trong giao diện.
import { errorMessage, fetchPublicBook, fetchReaderBookmarks, fetchReadingProgress } from '../api/client';
// Import type { Bookmark, Book, ReadingProgress } từ ../types để dùng trong giao diện.
import type { Bookmark, Book, ReadingProgress } from '../types';

// Kiểu ShelfItem mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type ShelfItem = { id: string; book: Book; bookmark?: Bookmark; progress?: ReadingProgress };
/**
 * Hàm/thành phần idOf: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: ref.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
const idOf = (ref: Bookmark['book'] | ReadingProgress['book']) => typeof ref === 'string' ? ref : ref?._id || ref?.id || '';

/**
 * Hàm/thành phần MyLibraryPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, useEffect, navigate, setLoading, setError, all.
 */
export function MyLibraryPage() {
  // Biến { user, loading: authLoading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [items, setItems] nhận giá trị từ useState<ShelfItem[]>([]). const không gán lại; let có thể cập nhật.
  const [items, setItems] = useState<ShelfItem[]>([]);
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [status, setStatus] nhận giá trị từ useState<'all' | 'reading' | 'finished' | 'unread'>('al. const không gán lại; let có thể cập nhật.
  const [status, setStatus] = useState<'all' | 'reading' | 'finished' | 'unread'>('all');
  // Biến [sort, setSort] nhận giá trị từ useState<'recent' | 'title' | 'progress'>('recent'). const không gán lại; let có thể cập nhật.
  const [sort, setSort] = useState<'recent' | 'title' | 'progress'>('recent');
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (authLoading) return; if (!user) { navigate('/login', { rep
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return;
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { navigate('/login', { replace: true, state: { from: '/my-library' } }); return; }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true); setError('');
    // Gọi/thực thi Promise.all với đối số để cập nhật logic/giao diện: Promise.all([fetchReaderBookmarks(), fetchReadingProgress()]).then(async ([bm, p
    Promise.all([fetchReaderBookmarks(), fetchReadingProgress()]).then(async ([bm, pg]) => {
      // Biến map nhận giá trị từ new Map<string, ShelfItem>(). const không gán lại; let có thể cập nhật.
      const map = new Map<string, ShelfItem>();
      // Biến progressByBook nhận giá trị từ new Map(pg.progress.map((p) => [idOf(p.book), p])). const không gán lại; let có thể cập nhật.
      const progressByBook = new Map(pg.progress.map((p) => [idOf(p.book), p]));
      // Biến refs nhận giá trị từ new Map<string, Bookmark>(). const không gán lại; let có thể cập nhật.
      const refs = new Map<string, Bookmark>();
      // Gọi/thực thi bm.bookmarks.forEach với đối số để cập nhật logic/giao diện: bm.bookmarks.forEach((bookmark) => { const id = idOf(bookmark.book); if (id) ref
      bm.bookmarks.forEach((bookmark) => { const id = idOf(bookmark.book); if (id) refs.set(id, bookmark); });
      // Gọi/thực thi pg.progress.forEach với đối số để cập nhật logic/giao diện: pg.progress.forEach((progress) => { const id = idOf(progress.book); if (id) map.
      pg.progress.forEach((progress) => { const id = idOf(progress.book); if (id) map.set(id, { id, book: null as unknown as Book, progress }); });
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await Promise.all([...new Set([...refs.keys(), ...progressByBook.keys()])].map(a
      await Promise.all([...new Set([...refs.keys(), ...progressByBook.keys()])].map(async (id) => {
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
        try {
          // Biến book nhận giá trị từ await fetchPublicBook(id). const không gán lại; let có thể cập nhật.
          const book = await fetchPublicBook(id);
          // Gọi/thực thi map.set với đối số để cập nhật logic/giao diện: map.set(id, { id, book, bookmark: refs.get(id), progress: progressByBook.get(id)
          map.set(id, { id, book, bookmark: refs.get(id), progress: progressByBook.get(id) });
        } catch { /* inaccessible or removed books are omitted */ }
      }));
      // if chỉ chạy nhánh này khi điều kiện active đúng.
      if (active) setItems([...map.values()].filter((item) => item.book));
    }).catch((err: unknown) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  // Biến visible nhận giá trị từ useMemo(() => { const q = search.trim().toLocaleLowerCa. const không gán lại; let có thể cập nhật.
  const visible = useMemo(() => {
    // Biến q nhận giá trị từ search.trim().toLocaleLowerCase(). const không gán lại; let có thể cập nhật.
    const q = search.trim().toLocaleLowerCase();
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: items.filter(({ book, progress }) => { const matches = !q || `${book.title} ${bo.
    return items.filter(({ book, progress }) => {
      // Biến matches nhận giá trị từ !q || `${book.title} ${book.author_name}`.toLocaleLower. const không gán lại; let có thể cập nhật.
      const matches = !q || `${book.title} ${book.author_name}`.toLocaleLowerCase().includes(q);
      // Biến count nhận giá trị từ progress?.completed_chapter_count ?? 0. const không gán lại; let có thể cập nhật.
      const count = progress?.completed_chapter_count ?? 0;
      // Biến started nhận giá trị từ Boolean(count || progress?.last_read_chapter). const không gán lại; let có thể cập nhật.
      const started = Boolean(count || progress?.last_read_chapter);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: matches && (status === 'all' || (status === 'reading' && started) || (status ===.
      return matches && (status === 'all' || (status === 'reading' && started) || (status === 'unread' && !started));
    }).sort((a, b) => sort === 'title' ? a.book.title.localeCompare(b.book.title) : sort === 'progress' ? (b.progress?.completed_chapter_count ?? 0) - (a.progress?.completed_chapter_count ?? 0) : new Date(b.progress?.updatedAt ?? b.book.updatedAt ?? b.book.createdAt ?? 0).getTime() - new Date(a.progress?.updatedAt ?? a.book.updatedAt ?? a.book.createdAt ?? 0).getTime());
  }, [items, search, sort, status]);

  // Biến tabs nhận giá trị từ [{ id: 'all', label: 'Tất cả' }, { id: 'reading', label. const không gán lại; let có thể cập nhật.
  const tabs = [{ id: 'all', label: 'Tất cả' }, { id: 'reading', label: 'Đang đọc' }, { id: 'finished', label: 'Đã đọc' }, { id: 'unread', label: 'Chưa đọc' }] as const;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderLayout searchValue={search} onSearchChange={setSearch}> <div className="b.
  return <ReaderLayout searchValue={search} onSearchChange={setSearch}>
    <div className="bn-page-header"><h1 className="bn-page-title-main">Tủ sách</h1><p className="bn-page-subtitle-main">Quản lý và khám phá sách trong thư viện của bạn</p></div>
    <div className="ob-shelf-toolbar"><div className="bn-filter-tabs">{tabs.map((tab) => <button key={tab.id} className={`bn-filter-tab-pill ${status === tab.id ? 'active' : ''}`} onClick={() => setStatus(tab.id)}>{tab.label}</button>)}</div><label className="ob-sort">Sắp xếp<select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="recent">Mới nhất</option><option value="title">Tên sách</option><option value="progress">Tiến độ đọc</option></select></label></div>
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {status === 'finished' ? <div className="ob-page-message">Trạng thái hoàn thành toàn bộ sách chưa được xác định từ dữ liệu hiện có.</div> : loading ? <div className="ob-page-message">Đang tải tủ sách…</div> : visible.length ? <div className="ob-book-grid">{visible.map(({ id, book, progress }) => {
      // Biến count nhận giá trị từ progress?.completed_chapter_count ?? 0. const không gán lại; let có thể cập nhật.
      const count = progress?.completed_chapter_count ?? 0;
      // Biến started nhận giá trị từ Boolean(count || progress?.last_read_chapter). const không gán lại; let có thể cập nhật.
      const started = Boolean(count || progress?.last_read_chapter);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <article className="ob-book-card" key={id}><Link to={`/books/${encodeURIComponen.
      return <article className="ob-book-card" key={id}><Link to={`/books/${encodeURIComponent(id)}`} className="ob-book-cover-link"><img src={book.cover_url || '/book-cover-placeholder.svg'} alt={book.title} className="ob-book-cover" onError={(e) => { e.currentTarget.src = '/book-cover-placeholder.svg'; }} /></Link><div className="ob-book-info"><Link to={`/books/${encodeURIComponent(id)}`} className="ob-book-title">{book.title}</Link><span className="ob-book-author">{book.author_name}</span><span className="ob-book-meta">{count ? `${count} chương hoàn thành` : started ? 'Đã mở gần đây' : 'Chưa bắt đầu'}</span><span className="ob-book-status">{started ? 'Đang đọc' : 'Chưa đọc'}</span></div></article>;
    })}</div> : <div className="ob-empty-state"><h2>{items.length ? 'Không tìm thấy sách phù hợp' : 'Tủ sách đang trống'}</h2><p>{items.length ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Sách bạn lưu hoặc bắt đầu đọc sẽ xuất hiện tại đây.'}</p><Link to="/catalog">Khám phá sách</Link></div>}
  </ReaderLayout>;
}
