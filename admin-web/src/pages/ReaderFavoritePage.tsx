// Import { useEffect, useMemo, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderFavoritePage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useState } from 'react';
// Import { Bookmark as BookmarkIcon, Search, Trash2 } từ lucide-react để dùng trong giao diện.
import { Bookmark as BookmarkIcon, Search, Trash2 } from 'lucide-react';
// Import { Link } từ react-router-dom để dùng trong giao diện.
import { Link } from 'react-router-dom';
// Import { deleteReaderBookmark, errorMessage, fetchReaderBookmarks } từ ../api/client để dùng trong giao diện.
import { deleteReaderBookmark, errorMessage, fetchReaderBookmarks } from '../api/client';
// Import type { Bookmark } từ ../types để dùng trong giao diện.
import type { Bookmark } from '../types';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import module từ ../reader-ui.css để dùng trong giao diện.
import '../reader-ui.css';
// Import module từ ../styles.css để dùng trong giao diện.
import '../styles.css';

/**
 * Hàm/thành phần refId: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function refId(value: unknown): string { return typeof value === 'string' ? value : (value as { _id?: string; id?: string } | null)?.id || (value as { _id?: string } | null)?._id || ''; }
/**
 * Hàm/thành phần asObject: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: admin-web/src/pages/ReaderAccountPage.tsx.
 */
function asObject(value: unknown) { return typeof value === 'object' && value ? value as { title?: string; author_name?: string; cover_url?: string; slug?: string } : null; }

/**
 * Hàm/thành phần ReaderFavoritesPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, fetchReaderBookmarks, then, setItems, setError, errorMessage, finally.
 */
export function ReaderFavoritesPage() {
  // Biến [items, setItems] nhận giá trị từ useState<Bookmark[]>([]). const không gán lại; let có thể cập nhật.
  const [items, setItems] = useState<Bookmark[]>([]);
  // Biến [query, setQuery] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [query, setQuery] = useState('');
  // Biến [sort, setSort] nhận giá trị từ useState<'newest' | 'title'>('newest'). const không gán lại; let có thể cập nhật.
  const [sort, setSort] = useState<'newest' | 'title'>('newest');
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; fetchReaderBookmarks(1, 50).then((result) =
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi fetchReaderBookmarks với đối số để cập nhật logic/giao diện: fetchReaderBookmarks(1, 50).then((result) => { if (active) setItems(result.bookm
    fetchReaderBookmarks(1, 50).then((result) => { if (active) setItems(result.bookmarks); }).catch((err) => { if (active) setError(errorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, []);

  // Biến books nhận giá trị từ useMemo(() => { const unique = new Map<string, Bookmark. const không gán lại; let có thể cập nhật.
  const books = useMemo(() => {
    // Biến unique nhận giá trị từ new Map<string, Bookmark>(). const không gán lại; let có thể cập nhật.
    const unique = new Map<string, Bookmark>();
    // Gọi/thực thi items.forEach với đối số để cập nhật logic/giao diện: items.forEach((item) => { const id = refId(item.book); if (id && !unique.has(id)
    items.forEach((item) => { const id = refId(item.book); if (id && !unique.has(id)) unique.set(id, item); });
    // Biến list nhận giá trị từ [...unique.values()].filter((item) => { const book = as. const không gán lại; let có thể cập nhật.
    const list = [...unique.values()].filter((item) => {
      // Biến book nhận giá trị từ asObject(item.book). const không gán lại; let có thể cập nhật.
      const book = asObject(item.book); return !query.trim() || `${book?.title || ''} ${book?.author_name || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: list.sort((a, b) => sort === 'newest' ? new Date(b.createdAt).getTime() - new Da.
    return list.sort((a, b) => sort === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : (asObject(a.book)?.title || '').localeCompare(asObject(b.book)?.title || '', 'vi'));
  }, [items, query, sort]);

  /**
   * Hàm/thành phần remove: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: item.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, deleteReaderBookmark, setItems, filter, setError, errorMessage.
   */
  async function remove(item: Bookmark) {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Bỏ sách này khỏi danh sách yêu thích?') đúng.
    if (!window.confirm('Bỏ sách này khỏi danh sách yêu thích?')) return;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try { await deleteReaderBookmark(item._id); setItems((current) => current.filter((entry) => entry._id !== item._id)); }
    catch (err) { setError(errorMessage(err)); }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderShell title="Sách yêu thích" subtitle="Danh sách những cuốn sách bạn đã đ.
  return <ReaderShell title="Sách yêu thích" subtitle="Danh sách những cuốn sách bạn đã đánh dấu để quay lại.">
    <div className="ob2-toolbar"><div className="ob2-search" style={{ maxWidth: 360 }}><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong sách yêu thích..." /></div><select className="ob2-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="newest">Mới nhất</option><option value="title">Tên sách</option></select></div>
    {error && <div className="ob2-error">{error}</div>}
    {loading ? <div className="ob2-empty">Đang tải sách yêu thích…</div> : books.length ? <div className="ob2-book-grid">{books.map((item) => { const book = asObject(item.book); const id = refId(item.book); return <article className="ob2-book-card" key={item._id} style={{ position: 'relative' }}>
      <button className="ob2-icon-btn" style={{ position: 'absolute', right: 10, top: 10, zIndex: 2, color: '#d0a82f' }} onClick={() => void remove(item)} title="Bỏ lưu" type="button"><BookmarkIcon size={14} fill="currentColor" /></button>
      <Link to={`/books/${encodeURIComponent(id)}`}><img className="ob2-cover" src={book?.cover_url || '/book-cover-placeholder.svg'} alt={`Bìa sách ${book?.title || 'sách'}`} /><strong className="ob2-book-title">{book?.title || 'Sách'}</strong><span className="ob2-book-author">{book?.author_name || 'Đang cập nhật tác giả'}</span><span className="ob2-badge">Đã lưu</span></Link>
      <button className="ob2-remove-text" onClick={() => void remove(item)} type="button"><Trash2 size={12}/> Bỏ lưu</button>
    </article>; })}</div> : <div className="ob2-empty"><BookmarkIcon size={24}/><p>Chưa có sách yêu thích. Mở một cuốn sách và lưu để thêm vào đây.</p><Link className="ob2-btn-primary" to="/">Khám phá sách</Link></div>}
  </ReaderShell>;
}
