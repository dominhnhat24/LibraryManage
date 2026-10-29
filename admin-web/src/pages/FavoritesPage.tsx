import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import { deleteReaderBookmark, errorMessage, fetchPublicBook, fetchReaderBookmarks } from '../api/client';
import type { Bookmark, Book } from '../types';

type Favorite = { bookmark: Bookmark; book: Book };
const bookIdOf = (ref: Bookmark['book']) => typeof ref === 'string' ? ref : ref?._id || ref?.id || '';

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth(); const navigate = useNavigate();
  const [items, setItems] = useState<Favorite[]>([]); const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  const removingRef = useRef(new Set<string>());
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true, state: { from: '/favorites' } }); return; }
    let active = true; setLoading(true); setError('');
    fetchReaderBookmarks().then(async ({ bookmarks }) => Promise.all(bookmarks.map(async (bookmark) => {
      const id = bookIdOf(bookmark.book); if (!id) return null;
      try { return { bookmark, book: await fetchPublicBook(id) }; } catch { return null; }
    }))).then((result) => { if (active) setItems(result.filter((item): item is Favorite => item !== null)); })
      .catch((err: unknown) => { if (active) setError(errorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, navigate, user]);
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase(); return items.filter(({ book }) => !q || `${book.title} ${book.author_name}`.toLocaleLowerCase().includes(q)); }, [items, search]);
  const remove = async (bookmark: Bookmark) => {
    if (removingRef.current.has(bookmark._id)) return;
    removingRef.current.add(bookmark._id);
    setRemovingIds((current) => new Set(current).add(bookmark._id));
    try { await deleteReaderBookmark(bookmark._id); setItems((current) => current.filter((item) => item.bookmark._id !== bookmark._id)); }
    catch (err) { setError(`Không thể bỏ yêu thích: ${errorMessage(err)}`); }
    finally { removingRef.current.delete(bookmark._id); setRemovingIds((current) => { const next = new Set(current); next.delete(bookmark._id); return next; }); }
  };
  return <ReaderLayout searchValue={search} onSearchChange={setSearch}>
    <div className="bn-page-header"><h1 className="bn-page-title-main">Sách yêu thích</h1><p className="bn-page-subtitle-main">Những cuốn sách bạn đã lưu để đọc sau</p></div>
    {error && <div className="ob-page-message is-error" role="alert">{error}</div>}
    {loading ? <div className="ob-page-message">Đang tải sách yêu thích…</div> : filtered.length ? <div className="ob-book-grid ob-favorites-grid">{filtered.map(({ bookmark, book }) => <article className="ob-book-card" key={bookmark._id}><div className="ob-favorite-cover"><Link to={`/books/${encodeURIComponent(book._id)}`} className="ob-book-cover-link"><img src={book.cover_url || '/book-cover-placeholder.svg'} alt={book.title} className="ob-book-cover" onError={(e) => { e.currentTarget.src = '/book-cover-placeholder.svg'; }} /></Link><button aria-pressed="true" className="ob-favorite-button" disabled={removingIds.has(bookmark._id)} type="button" aria-label={`Bỏ yêu thích ${book.title}`} title={removingIds.has(bookmark._id) ? 'Đang bỏ lưu…' : 'Bỏ yêu thích'} onClick={() => void remove(bookmark)}><BookmarkIcon size={17} fill="currentColor" /></button></div><div className="ob-book-info"><Link to={`/books/${encodeURIComponent(book._id)}`} className="ob-book-title">{book.title}</Link><span className="ob-book-author">{book.author_name}</span></div></article>)}</div> : <div className="ob-empty-state"><h2>{items.length ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách yêu thích'}</h2><p>{items.length ? 'Thử tìm bằng tên sách hoặc tác giả khác.' : 'Lưu một cuốn sách khi đọc để tìm lại tại đây.'}</p><Link to="/catalog">Khám phá sách</Link></div>}
  </ReaderLayout>;
}
