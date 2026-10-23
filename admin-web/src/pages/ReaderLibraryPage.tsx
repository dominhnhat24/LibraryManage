import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock3, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteReaderBookmark, errorMessage, fetchReadableChapters, fetchReaderBookmarks, fetchReadingProgress } from '../api/client';
import type { Bookmark, ReadingProgress } from '../types';
import { ReaderShell } from '../components/ReaderShell';
import "../reader-ui.css";

function refId(value: unknown): string { return typeof value === 'string' ? value : (value as { _id?: string; id?: string } | null)?.id || (value as { _id?: string } | null)?._id || ''; }
type BookValue = {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  cover_url?: string;
};

function bookValue(
  value: string | BookValue | undefined
): BookValue | null {
  if (!value) return null;

  if (typeof value === "string") {
    return {
      _id: value,
      id: value,
    };
  }

  return value;
}

export function ReaderLibraryPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chapterTotals, setChapterTotals] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'reading' | 'done' | 'unread'>('reading');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([fetchReadingProgress(1, 50), fetchReaderBookmarks(1, 50)])
      .then(async ([progressResult, bookmarkResult]) => {
        if (!active) return;
        setProgress(progressResult.progress); setBookmarks(bookmarkResult.bookmarks);
        const ids = [...new Set(bookmarkResult.bookmarks.map((item) => refId(item.book)).filter(Boolean))];
        const totals = await Promise.all(ids.slice(0, 20).map(async (id) => {
          try { const result = await fetchReadableChapters(id, 1, 1); return [id, result.pagination.total] as const; }
          catch { return [id, 0] as const; }
        }));
        if (active) setChapterTotals(Object.fromEntries(totals));
      })
      .catch((err) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => {
    const byBook = new Map<string, { progress?: ReadingProgress; bookmark?: Bookmark }>();
    progress.forEach((item) => { const id = refId(item.book); if (id) byBook.set(id, { ...(byBook.get(id) || {}), progress: item }); });
    bookmarks.forEach((item) => { const id = refId(item.book); if (id) byBook.set(id, { ...(byBook.get(id) || {}), bookmark: item }); });
    return [...byBook.entries()].map(([id, item]) => ({ id, ...item }));
  }, [progress, bookmarks]);

  const filtered = rows.filter((row) => {
    if (activeTab === 'reading') return Boolean(row.bookmark || row.progress);
    if (activeTab === 'done') return Boolean((row.progress?.total_chapter_reads || 0) >= 20);
    return !row.bookmark && !row.progress;
  });

  async function removeBookmark(item: Bookmark) {
    if (!window.confirm('Bỏ sách này khỏi tủ sách của bạn?')) return;
    try { await deleteReaderBookmark(item._id); setBookmarks((current) => current.filter((bookmark) => bookmark._id !== item._id)); }
    catch (err) { setError(errorMessage(err)); }
  }

  return <ReaderShell title="Tủ sách của tôi" subtitle="Quản lý và theo dõi tiến độ đọc sách của bạn.">
    <div className="ob2-tabs">
      {([['reading', 'Đang đọc'], ['done', 'Đã đọc'], ['unread', 'Chưa đọc']] as const).map(([value, label]) => <button key={value} type="button" className={activeTab === value ? 'is-active' : ''} onClick={() => setActiveTab(value)}>{label}</button>)}
    </div>
    <div className="ob2-two-col">
      <section>
        {error && <div className="ob2-error">{error}</div>}
        {loading ? <div className="ob2-empty">Đang tải tủ sách…</div> : filtered.length ? <div className="ob2-list">{filtered.map((row) => {
          const book = bookValue(row.bookmark?.book || row.progress?.book);
          const chapter = typeof row.bookmark?.chapter === 'object' ? row.bookmark.chapter : null;
          const total = chapterTotals[row.id] || 0;
          const current = chapter?.chapter_number || 0;
          const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
          return <article className="ob2-row" key={row.id}>
            <img className="ob2-row-cover" src={book?.cover_url || '/book-cover-placeholder.svg'} alt="" />
            <div className="ob2-row-main">
              <strong>{book?.title || 'Sách'}</strong>
              <p>{chapter?.chapter_number ? `Chương ${chapter.chapter_number}: ${chapter.title || ''}` : `${row.progress?.total_chapter_reads || 0} lượt đọc chương`}</p>
              <div className="ob2-progress"><span style={{ width: `${percent}%` }} /></div>
              <div className="ob2-progress-meta"><span>{percent ? `${percent}%` : 'Đang cập nhật tiến độ'}</span><span>{total ? `${current}/${total} chương` : ''}</span></div>
            </div>
            <div className="ob2-row-actions">
              <Link className="ob2-mini-btn" to={`/books/${encodeURIComponent(row.id)}`}>Tiếp tục đọc</Link>
              {row.bookmark && <button className="ob2-icon-btn" title="Bỏ lưu" onClick={() => void removeBookmark(row.bookmark!)} type="button"><Trash2 size={14} /></button>}
            </div>
          </article>;
        })}</div> : <div className="ob2-empty"><BookOpen size={22} /><p>Chưa có sách trong mục này.</p><button className="ob2-btn-light" onClick={() => navigate('/')} type="button">Khám phá sách</button></div>}
      </section>
      <aside className="ob2-panel">
        <h2><Clock3 size={15} /> Tổng quan đọc sách</h2>
        <div className="ob2-stats" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ob2-stat"><strong>{progress.length}</strong><span>Sách có lịch sử đọc</span></div>
          <div className="ob2-stat"><strong>{bookmarks.length}</strong><span>Sách/chương đã lưu</span></div>
          <div className="ob2-stat"><strong>{progress.reduce((sum, item) => sum + item.total_chapter_reads, 0)}</strong><span>Lượt đọc chương</span></div>
        </div>
        <p>Dữ liệu được lấy trực tiếp từ tài khoản hiện tại và đồng bộ qua API OpenBook.</p>
      </aside>
    </div>
  </ReaderShell>;
}
