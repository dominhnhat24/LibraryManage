// Import { useEffect, useMemo, useRef, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/FavoritesPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { Bookmark as BookmarkIcon } từ lucide-react để dùng trong giao diện.
import { Bookmark as BookmarkIcon } from 'lucide-react';
// Import { ReaderLayout } từ ../components/ReaderLayout để dùng trong giao diện.
import { ReaderLayout } from '../components/ReaderLayout';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { deleteReaderBookmark, errorMessage, fetchPublicBook, fetchReaderBookmarks } từ ../api/client để dùng trong giao diện.
import { deleteReaderBookmark, errorMessage, fetchPublicBook, fetchReaderBookmarks } from '../api/client';
// Import type { Bookmark, Book } từ ../types để dùng trong giao diện.
import type { Bookmark, Book } from '../types';

// Kiểu Favorite mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type Favorite = { bookmark: Bookmark; book: Book };
/**
 * Hàm/thành phần bookIdOf: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: ref.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
const bookIdOf = (ref: Bookmark['book']) => typeof ref === 'string' ? ref : ref?._id || ref?.id || '';

/**
 * Hàm/thành phần FavoritesPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, Set, useRef, useEffect, navigate, setLoading.
 */
export function FavoritesPage() {
  // Biến { user, loading: authLoading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading } = useAuth(); const navigate = useNavigate();
  // Biến [items, setItems] nhận giá trị từ useState<Favorite[]>([]). const không gán lại; let có thể cập nhật.
  const [items, setItems] = useState<Favorite[]>([]); const [search, setSearch] = useState('');
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  // Biến [removingIds, setRemovingIds] nhận giá trị từ useState<Set<string>>(() => new Set()). const không gán lại; let có thể cập nhật.
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  // Biến removingRef nhận giá trị từ useRef(new Set<string>()). const không gán lại; let có thể cập nhật.
  const removingRef = useRef(new Set<string>());
  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (authLoading) return; if (!user) { navigate('/login', { rep
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return;
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { navigate('/login', { replace: true, state: { from: '/favorites' } }); return; }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true; setLoading(true); setError('');
    // Gọi/thực thi fetchReaderBookmarks với đối số để cập nhật logic/giao diện: fetchReaderBookmarks().then(async ({ bookmarks }) => Promise.all(bookmarks.map(a
    fetchReaderBookmarks().then(async ({ bookmarks }) => Promise.all(bookmarks.map(async (bookmark) => {
      // Biến id nhận giá trị từ bookIdOf(bookmark.book). const không gán lại; let có thể cập nhật.
      const id = bookIdOf(bookmark.book); if (!id) return null;
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try { return { bookmark, book: await fetchPublicBook(id) }; } catch { return null; }
    }))).then((result) => { if (active) setItems(result.filter((item): item is Favorite => item !== null)); })
      .catch((err: unknown) => { if (active) setError(errorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [authLoading, navigate, user]);
  // Biến filtered nhận giá trị từ useMemo(() => { const q = search.trim().toLocaleLowerCa. const không gán lại; let có thể cập nhật.
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase(); return items.filter(({ book }) => !q || `${book.title} ${book.author_name}`.toLocaleLowerCase().includes(q)); }, [items, search]);
  /**
   * Hàm/thành phần remove: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: bookmark.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: has, add, setRemovingIds, Set, deleteReaderBookmark, setItems, filter, setError.
   * Được tham chiếu tại: admin-web/src/pages/ReaderFavoritePage.tsx.
   */
  const remove = async (bookmark: Bookmark) => {
    // if chỉ chạy nhánh này khi điều kiện removingRef.current.has(bookmark._id) đúng.
    if (removingRef.current.has(bookmark._id)) return;
    // Gọi/thực thi removingRef.current.add với đối số để cập nhật logic/giao diện: removingRef.current.add(bookmark._id)
    removingRef.current.add(bookmark._id);
    // Gọi/thực thi setRemovingIds với đối số để cập nhật logic/giao diện: setRemovingIds((current) => new Set(current).add(bookmark._id))
    setRemovingIds((current) => new Set(current).add(bookmark._id));
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try { await deleteReaderBookmark(bookmark._id); setItems((current) => current.filter((item) => item.bookmark._id !== bookmark._id)); }
    catch (err) { setError(`Không thể bỏ yêu thích: ${errorMessage(err)}`); }
    finally { removingRef.current.delete(bookmark._id); setRemovingIds((current) => { const next = new Set(current); next.delete(bookmark._id); return next; }); }
  };
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderLayout searchValue={search} onSearchChange={setSearch}> <div className="b.
  return <ReaderLayout searchValue={search} onSearchChange={setSearch}>
    <div className="bn-page-header"><h1 className="bn-page-title-main">Sách yêu thích</h1><p className="bn-page-subtitle-main">Những cuốn sách bạn đã lưu để đọc sau</p></div>
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {loading ? <div className="ob-page-message">Đang tải sách yêu thích…</div> : filtered.length ? <div className="ob-book-grid ob-favorites-grid">{filtered.map(({ bookmark, book }) => <article className="ob-book-card" key={bookmark._id}><div className="ob-favorite-cover"><Link to={`/books/${encodeURIComponent(book._id)}`} className="ob-book-cover-link"><img src={book.cover_url || '/book-cover-placeholder.svg'} alt={book.title} className="ob-book-cover" onError={(e) => { e.currentTarget.src = '/book-cover-placeholder.svg'; }} /></Link><button aria-pressed="true" className="ob-favorite-button" disabled={removingIds.has(bookmark._id)} type="button" aria-label={`Bỏ yêu thích ${book.title}`} title={removingIds.has(bookmark._id) ? 'Đang bỏ lưu…' : 'Bỏ yêu thích'} onClick={() => void remove(bookmark)}><BookmarkIcon size={17} fill="currentColor" /></button></div><div className="ob-book-info"><Link to={`/books/${encodeURIComponent(book._id)}`} className="ob-book-title">{book.title}</Link><span className="ob-book-author">{book.author_name}</span></div></article>)}</div> : <div className="ob-empty-state"><h2>{items.length ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách yêu thích'}</h2><p>{items.length ? 'Thử tìm bằng tên sách hoặc tác giả khác.' : 'Lưu một cuốn sách khi đọc để tìm lại tại đây.'}</p><Link to="/catalog">Khám phá sách</Link></div>}
  </ReaderLayout>;
}
