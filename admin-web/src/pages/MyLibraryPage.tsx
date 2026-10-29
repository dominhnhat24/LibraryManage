import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import { errorMessage, fetchPublicBook, fetchReaderBookmarks, fetchReadingProgress } from '../api/client';
import type { Bookmark, Book, ReadingProgress } from '../types';

type ShelfItem = { id: string; book: Book; bookmark?: Bookmark; progress?: ReadingProgress };
const idOf = (ref: Bookmark['book'] | ReadingProgress['book']) => typeof ref === 'string' ? ref : ref?._id || ref?.id || '';

export function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'reading' | 'finished' | 'unread'>('all');
  const [sort, setSort] = useState<'recent' | 'title' | 'progress'>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true, state: { from: '/my-library' } }); return; }
    let active = true;
    setLoading(true); setError('');
    Promise.all([fetchReaderBookmarks(), fetchReadingProgress()]).then(async ([bm, pg]) => {
      const map = new Map<string, ShelfItem>();
      const progressByBook = new Map(pg.progress.map((p) => [idOf(p.book), p]));
      const refs = new Map<string, Bookmark>();
      bm.bookmarks.forEach((bookmark) => { const id = idOf(bookmark.book); if (id) refs.set(id, bookmark); });
      pg.progress.forEach((progress) => { const id = idOf(progress.book); if (id) map.set(id, { id, book: null as unknown as Book, progress }); });
      await Promise.all([...new Set([...refs.keys(), ...progressByBook.keys()])].map(async (id) => {
        try {
          const book = await fetchPublicBook(id);
          map.set(id, { id, book, bookmark: refs.get(id), progress: progressByBook.get(id) });
        } catch { /* inaccessible or removed books are omitted */ }
      }));
      if (active) setItems([...map.values()].filter((item) => item.book));
    }).catch((err: unknown) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return items.filter(({ book, progress }) => {
      const matches = !q || `${book.title} ${book.author_name}`.toLocaleLowerCase().includes(q);
      const count = progress?.completed_chapter_count ?? 0;
      const started = Boolean(count || progress?.last_read_chapter);
      return matches && (status === 'all' || (status === 'reading' && started) || (status === 'unread' && !started));
    }).sort((a, b) => sort === 'title' ? a.book.title.localeCompare(b.book.title) : sort === 'progress' ? (b.progress?.completed_chapter_count ?? 0) - (a.progress?.completed_chapter_count ?? 0) : new Date(b.progress?.updatedAt ?? b.book.updatedAt ?? b.book.createdAt ?? 0).getTime() - new Date(a.progress?.updatedAt ?? a.book.updatedAt ?? a.book.createdAt ?? 0).getTime());
  }, [items, search, sort, status]);

  const tabs = [{ id: 'all', label: 'Tất cả' }, { id: 'reading', label: 'Đang đọc' }, { id: 'finished', label: 'Đã đọc' }, { id: 'unread', label: 'Chưa đọc' }] as const;
  return <ReaderLayout searchValue={search} onSearchChange={setSearch}>
    <div className="bn-page-header"><h1 className="bn-page-title-main">Tủ sách</h1><p className="bn-page-subtitle-main">Quản lý và khám phá sách trong thư viện của bạn</p></div>
    <div className="ob-shelf-toolbar"><div className="bn-filter-tabs">{tabs.map((tab) => <button key={tab.id} className={`bn-filter-tab-pill ${status === tab.id ? 'active' : ''}`} onClick={() => setStatus(tab.id)}>{tab.label}</button>)}</div><label className="ob-sort">Sắp xếp<select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="recent">Mới nhất</option><option value="title">Tên sách</option><option value="progress">Tiến độ đọc</option></select></label></div>
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {status === 'finished' ? <div className="ob-page-message">Trạng thái hoàn thành toàn bộ sách chưa được xác định từ dữ liệu hiện có.</div> : loading ? <div className="ob-page-message">Đang tải tủ sách…</div> : visible.length ? <div className="ob-book-grid">{visible.map(({ id, book, progress }) => {
      const count = progress?.completed_chapter_count ?? 0;
      const started = Boolean(count || progress?.last_read_chapter);
      return <article className="ob-book-card" key={id}><Link to={`/books/${encodeURIComponent(id)}`} className="ob-book-cover-link"><img src={book.cover_url || '/book-cover-placeholder.svg'} alt={book.title} className="ob-book-cover" onError={(e) => { e.currentTarget.src = '/book-cover-placeholder.svg'; }} /></Link><div className="ob-book-info"><Link to={`/books/${encodeURIComponent(id)}`} className="ob-book-title">{book.title}</Link><span className="ob-book-author">{book.author_name}</span><span className="ob-book-meta">{count ? `${count} chương hoàn thành` : started ? 'Đã mở gần đây' : 'Chưa bắt đầu'}</span><span className="ob-book-status">{started ? 'Đang đọc' : 'Chưa đọc'}</span></div></article>;
    })}</div> : <div className="ob-empty-state"><h2>{items.length ? 'Không tìm thấy sách phù hợp' : 'Tủ sách đang trống'}</h2><p>{items.length ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Sách bạn lưu hoặc bắt đầu đọc sẽ xuất hiện tại đây.'}</p><Link to="/catalog">Khám phá sách</Link></div>}
  </ReaderLayout>;
}
