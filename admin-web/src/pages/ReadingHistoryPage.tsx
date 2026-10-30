// Import { useEffect, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReadingHistoryPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState } from 'react';
// Import { ChevronLeft, ChevronRight, Trash2 } từ lucide-react để dùng trong giao diện.
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { ReaderLayout } từ ../components/ReaderLayout để dùng trong giao diện.
import { ReaderLayout } from '../components/ReaderLayout';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { clearReadingHistory, errorMessage, fetchReadingProgress } từ ../api/client để dùng trong giao diện.
import { clearReadingHistory, errorMessage, fetchReadingProgress } from '../api/client';
// Import type { PaginationData, ReadingProgress } từ ../types để dùng trong giao diện.
import type { PaginationData, ReadingProgress } from '../types';

// Biến PAGE_SIZE nhận giá trị từ 10. const không gán lại; let có thể cập nhật.
const PAGE_SIZE = 10;

/**
 * Hàm/thành phần ReadingHistoryPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, handleClearHistory, confirm, setClearing, setError, setNotice.
 */
export function ReadingHistoryPage() {
  // Biến { user, loading: authLoading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [items, setItems] nhận giá trị từ useState<ReadingProgress[]>([]). const không gán lại; let có thể cập nhật.
  const [items, setItems] = useState<ReadingProgress[]>([]);
  // Biến [pagination, setPagination] nhận giá trị từ useState<PaginationData | null>(null). const không gán lại; let có thể cập nhật.
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [page, setPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [page, setPage] = useState(1);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [clearing, setClearing] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [clearing, setClearing] = useState(false);
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');

  /**
   * Hàm/thành phần handleClearHistory: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, setClearing, setError, setNotice, clearReadingHistory, setItems, setPagination, setPage.
   */
  async function handleClearHistory() {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đọc? Tiến độ đọc đã lưu cũ đúng.
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đọc? Tiến độ đọc đã lưu cũng sẽ bị xóa.')) return;
    // Gọi/thực thi setClearing với đối số để cập nhật logic/giao diện: setClearing(true)
    setClearing(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến deletedCount nhận giá trị từ await clearReadingHistory(). const không gán lại; let có thể cập nhật.
      const deletedCount = await clearReadingHistory();
      // Gọi/thực thi setItems với đối số để cập nhật logic/giao diện: setItems([])
      setItems([]);
      // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 })
      setPagination({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
      // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
      setPage(1);
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(`Đã xóa lịch sử đọc (${deletedCount} mục).`)
      setNotice(`Đã xóa lịch sử đọc (${deletedCount} mục).`);
    } catch (clearError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(clearError))
      setError(errorMessage(clearError));
    } finally {
      // Gọi/thực thi setClearing với đối số để cập nhật logic/giao diện: setClearing(false)
      setClearing(false);
    }
  }

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (authLoading) return; if (!user) { navigate('/login', { rep
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return;
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { navigate('/login', { replace: true, state: { from: '/history' } }); return; }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: (async () => { return await fetchReadingProgress(page, PAGE_SIZE, search.trim())
    (async () => {
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: await fetchReadingProgress(page, PAGE_SIZE, search.trim()).
      return await fetchReadingProgress(page, PAGE_SIZE, search.trim());
    })().then((result) => {
      // if chỉ chạy nhánh này khi điều kiện active đúng.
      if (active) {
        // Gọi/thực thi setItems với đối số để cập nhật logic/giao diện: setItems(result.progress)
        setItems(result.progress);
        // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination(result.pagination)
        setPagination(result.pagination);
      }
    })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [authLoading, navigate, user, page, search]);

  // Biến currentPage nhận giá trị từ pagination?.page ?? page. const không gán lại; let có thể cập nhật.
  const currentPage = pagination?.page ?? page;
  // Biến totalPages nhận giá trị từ pagination?.totalPages ?? 0. const không gán lại; let có thể cập nhật.
  const totalPages = pagination?.totalPages ?? 0;

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderLayout searchValue={search} onSearchChange={(value) => { setSearch(value).
  return <ReaderLayout searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }}>
    <div className="bn-page-header flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="bn-page-title-main">Lịch sử đọc</h1><p className="bn-page-subtitle-main">Những cuốn sách bạn đã đọc gần đây</p></div>
      <button aria-label="Xóa toàn bộ lịch sử đọc" className="button-secondary !min-h-10 !px-4 !text-rose-700" disabled={clearing || loading || !(pagination?.total ?? 0)} onClick={() => void handleClearHistory()} type="button"><Trash2 size={16} />{clearing ? 'Đang xóa…' : 'Xóa lịch sử đọc'}</button>
    </div>
    {notice && <div className="ob-page-message" role="status">{notice}</div>}
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {loading ? <div className="ob-page-message">Đang tải lịch sử đọc…</div> : error ? null : pagination?.total ? <>
      <div className="ob-history-list">{items.map((progress) => {
        // Biến book nhận giá trị từ typeof progress.book === 'string' ? null : progress.boo. const không gán lại; let có thể cập nhật.
        const book = typeof progress.book === 'string' ? null : progress.book;
        // Biến bookId nhận giá trị từ book?._id || book?.id. const không gán lại; let có thể cập nhật.
        const bookId = book?._id || book?.id;
        // if chỉ chạy nhánh này khi điều kiện !bookId || !book?.title đúng.
        if (!bookId || !book?.title) return null;
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <Link className="ob-history-row" key={progress._id} to={`/books/${encodeURICompo.
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
