import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import { clearReadingHistory, errorMessage, fetchReadingProgress } from '../api/client';
import type { PaginationData, ReadingProgress } from '../types';

const PAGE_SIZE = 10;

export function ReadingHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ReadingProgress[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const [notice, setNotice] = useState('');

  async function handleClearHistory() {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đọc? Tiến độ đọc đã lưu cũng sẽ bị xóa.')) return;
    setClearing(true);
    setError('');
    setNotice('');
    try {
      const deletedCount = await clearReadingHistory();
      setItems([]);
      setPagination({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
      setPage(1);
      setNotice(`Đã xóa lịch sử đọc (${deletedCount} mục).`);
    } catch (clearError: unknown) {
      setError(errorMessage(clearError));
    } finally {
      setClearing(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true, state: { from: '/history' } }); return; }
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      return await fetchReadingProgress(page, PAGE_SIZE, search.trim());
    })().then((result) => {
      if (active) {
        setItems(result.progress);
        setPagination(result.pagination);
      }
    })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, navigate, user, page, search]);

  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 0;

  return <ReaderLayout searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }}>
    <div className="bn-page-header flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="bn-page-title-main">Lịch sử đọc</h1><p className="bn-page-subtitle-main">Những cuốn sách bạn đã đọc gần đây</p></div>
      <button aria-label="Xóa toàn bộ lịch sử đọc" className="button-secondary !min-h-10 !px-4 !text-rose-700" disabled={clearing || loading || !(pagination?.total ?? 0)} onClick={() => void handleClearHistory()} type="button"><Trash2 size={16} />{clearing ? 'Đang xóa…' : 'Xóa lịch sử đọc'}</button>
    </div>
    {notice && <div className="ob-page-message" role="status">{notice}</div>}
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {loading ? <div className="ob-page-message">Đang tải lịch sử đọc…</div> : error ? null : pagination?.total ? <>
      <div className="ob-history-list">{items.map((progress) => {
        const book = typeof progress.book === 'string' ? null : progress.book;
        const bookId = book?._id || book?.id;
        if (!bookId || !book?.title) return null;
        return <Link className="ob-history-row" key={progress._id} to={`/books/${encodeURIComponent(bookId)}/read`}>
          <img src={book.cover_url || '/book-cover-placeholder.svg'} alt={book.title} onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }} />
          <span className="ob-history-info"><strong>{book.title}</strong><small>{book.author_name || 'Đang cập nhật tác giả'}</small><small>Đã hoàn thành {progress.completed_chapter_count ?? 0} chương</small></span>
          <time dateTime={progress.updatedAt}>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(progress.updatedAt))}</time>
        </Link>;
      })}</div>
      {totalPages > 1 && <nav aria-label="Phân trang lịch sử đọc" className="mt-5 flex items-center justify-center gap-3 text-sm text-slate-600">
        <button className="button-secondary !min-h-9 !px-3" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button"><ChevronLeft size={15} /> Trước</button>
        <span>Trang {currentPage} / {totalPages} · 10 sách mỗi trang</span>
        <button className="button-secondary !min-h-9 !px-3" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">Tiếp <ChevronRight size={15} /></button>
      </nav>}
    </> : <div className="ob-empty-state"><h2>{search.trim() ? 'Không tìm thấy sách phù hợp' : 'Chưa có lịch sử đọc'}</h2><p>{search.trim() ? 'Thử tìm bằng tên sách hoặc tác giả khác.' : 'Sách bạn đã đọc sẽ xuất hiện tại đây.'}</p><Link to="/catalog">Khám phá sách</Link></div>}
  </ReaderLayout>;
}
