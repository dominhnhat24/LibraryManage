import { useEffect, useMemo, useState } from 'react';
import { Heart, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deleteReaderBookmark, errorMessage, fetchReaderBookmarks } from '../api/client';
import type { Bookmark } from '../types';
import { ReaderShell } from '../components/ReaderShell';
import '../reader-ui.css';
import '../styles.css';

function refId(value: unknown): string { return typeof value === 'string' ? value : (value as { _id?: string; id?: string } | null)?.id || (value as { _id?: string } | null)?._id || ''; }
function asObject(value: unknown) { return typeof value === 'object' && value ? value as { title?: string; author_name?: string; cover_url?: string; slug?: string } : null; }

export function ReaderFavoritesPage() {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'title'>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchReaderBookmarks(1, 50).then((result) => { if (active) setItems(result.bookmarks); }).catch((err) => { if (active) setError(errorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const books = useMemo(() => {
    const unique = new Map<string, Bookmark>();
    items.forEach((item) => { const id = refId(item.book); if (id && !unique.has(id)) unique.set(id, item); });
    const list = [...unique.values()].filter((item) => {
      const book = asObject(item.book); return !query.trim() || `${book?.title || ''} ${book?.author_name || ''}`.toLowerCase().includes(query.trim().toLowerCase());
    });
    return list.sort((a, b) => sort === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : (asObject(a.book)?.title || '').localeCompare(asObject(b.book)?.title || '', 'vi'));
  }, [items, query, sort]);

  async function remove(item: Bookmark) {
    if (!window.confirm('Bỏ sách này khỏi danh sách yêu thích?')) return;
    try { await deleteReaderBookmark(item._id); setItems((current) => current.filter((entry) => entry._id !== item._id)); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <ReaderShell title="Sách yêu thích" subtitle="Danh sách những cuốn sách bạn đã đánh dấu để quay lại.">
    <div className="ob2-toolbar"><div className="ob2-search" style={{ maxWidth: 360 }}><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong sách yêu thích..." /></div><select className="ob2-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="newest">Mới nhất</option><option value="title">Tên sách</option></select></div>
    {error && <div className="ob2-error">{error}</div>}
    {loading ? <div className="ob2-empty">Đang tải sách yêu thích…</div> : books.length ? <div className="ob2-book-grid">{books.map((item) => { const book = asObject(item.book); const id = refId(item.book); return <article className="ob2-book-card" key={item._id} style={{ position: 'relative' }}>
      <button className="ob2-icon-btn" style={{ position: 'absolute', right: 10, top: 10, zIndex: 2, color: '#d16b76' }} onClick={() => void remove(item)} title="Bỏ yêu thích" type="button"><Heart size={14} fill="currentColor" /></button>
      <Link to={`/books/${encodeURIComponent(id)}`}><img className="ob2-cover" src={book?.cover_url || '/book-cover-placeholder.svg'} alt={`Bìa sách ${book?.title || 'sách'}`} /><strong className="ob2-book-title">{book?.title || 'Sách'}</strong><span className="ob2-book-author">{book?.author_name || 'Đang cập nhật tác giả'}</span><span className="ob2-badge">Đã lưu</span></Link>
      <button className="ob2-remove-text" onClick={() => void remove(item)} type="button"><Trash2 size={12}/> Bỏ lưu</button>
    </article>; })}</div> : <div className="ob2-empty"><Heart size={24}/><p>Chưa có sách yêu thích. Mở một cuốn sách và lưu chương để thêm vào đây.</p><Link className="ob2-btn-primary" to="/">Khám phá sách</Link></div>}
  </ReaderShell>;
}
