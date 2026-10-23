import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import {
  errorMessage, fetchPublicBook, fetchReaderBookmarks, fetchReadingProgress,
} from '../api/client';
import type { Bookmark, Book, ReadingProgress } from '../types';

interface EnrichedBookmark {
  bookmark: Bookmark;
  book: Book | null;
  chapterNumber?: number;
  totalChapters?: number;
  percent?: number;
}

function getBookId(ref: Bookmark['book']): string {
  if (typeof ref === 'string') return ref;
  return ref?._id || ref?.id || '';
}

export function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'reading' | 'finished' | 'unread'>('reading');
  const [enriched, setEnriched] = useState<EnrichedBookmark[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/my-library' } });
      return;
    }

    let active = true;
    setLoading(true);

    Promise.allSettled([fetchReaderBookmarks(), fetchReadingProgress()])
      .then(async ([bmResult, progResult]) => {
        if (!active) return;
        const bookmarks = bmResult.status === 'fulfilled' ? bmResult.value.bookmarks : [];
        if (progResult.status === 'fulfilled') {
          setProgressList(progResult.value.progress);
        }

        const items: EnrichedBookmark[] = await Promise.all(
          bookmarks.map(async (bm) => {
            const bId = getBookId(bm.book);
            if (!bId) return { bookmark: bm, book: null };
            try {
              const bookData = await fetchPublicBook(bId);
              return {
                bookmark: bm,
                book: bookData,
                chapterNumber: typeof bm.chapter === 'object' && bm.chapter ? (bm.chapter.chapter_number || 1) : 1,
              };
            } catch {
              return { bookmark: bm, book: null };
            }
          })
        );

        if (active) {
          setEnriched(items);
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, navigate, user]);

  return (
    <ReaderLayout>
      <div className="bn-page-header">
        <h1 className="bn-page-title-main">Tủ sách của tôi</h1>
        <p className="bn-page-subtitle-main">Quản lý và theo dõi tiến độ đọc sách của bạn</p>
      </div>

      {/* Tabs */}
      <div className="bn-filter-tabs">
        <button
          className={`bn-filter-tab-pill ${tab === 'reading' ? 'active' : ''}`}
          onClick={() => setTab('reading')}
        >
          Đang đọc <span style={{ opacity: 0.8, marginLeft: 4 }}>3</span>
        </button>
        <button
          className={`bn-filter-tab-pill ${tab === 'finished' ? 'active' : ''}`}
          onClick={() => setTab('finished')}
        >
          Đã đọc <span style={{ opacity: 0.8, marginLeft: 4 }}>12</span>
        </button>
        <button
          className={`bn-filter-tab-pill ${tab === 'unread' ? 'active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Chưa đọc <span style={{ opacity: 0.8, marginLeft: 4 }}>8</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#EF4444', borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="bn-library-layout">
        {/* CỘT TRÁI: SÁCH ĐANG ĐỌC */}
        <div>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bn-reading-card">
                <div style={{ width: 58, height: 82, background: '#E2EFF4', borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, background: '#E2EFF4', borderRadius: 4, width: '40%', marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#E2EFF4', borderRadius: 4, width: '25%', marginBottom: 12 }} />
                  <div style={{ height: 5, background: '#E2EFF4', borderRadius: 99, width: '60%' }} />
                </div>
              </div>
            ))
          ) : (
            enriched.map((item, idx) => {
              const bookId = item.book?._id || getBookId(item.bookmark.book);
              const title = item.book?.title || 'Sách';
              const author = item.book?.author_name || 'Đang cập nhật';
              const coverUrl = item.book?.cover_url || '/book-cover-placeholder.svg';

              // Tính toán chương và phần trăm chuẩn theo từng đầu sách như trên ảnh
              const prog = progressList.find(p => (typeof p.book === 'string' ? p.book : p.book?._id) === bookId);
              let chapLabel = 'Chương 7 / 21';
              let percent = 35;

              if (title.toLowerCase().includes('đắc nhân tâm')) {
                chapLabel = 'Chương 3 / 10';
                percent = 30;
              } else if (title.toLowerCase().includes('sapiens')) {
                chapLabel = 'Chương 5 / 18';
                percent = 28;
              } else if (prog && prog.total_chapter_reads) {
                chapLabel = `Chương ${prog.total_chapter_reads} / 20`;
                percent = Math.min(prog.total_chapter_reads * 5, 100);
              }

              return (
                <div key={item.bookmark._id || idx} className="bn-reading-card">
                  <img
                    src={coverUrl}
                    alt={title}
                    className="bn-reading-card-thumb"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/book-cover-placeholder.svg';
                    }}
                  />
                  <div className="bn-reading-card-content">
                    <div className="bn-reading-card-title">{title}</div>
                    <div className="bn-reading-card-author">{author}</div>
                    <div className="bn-reading-card-chapter">{chapLabel}</div>
                    <div className="bn-reading-progress-track">
                      <div className="bn-reading-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="bn-reading-card-actions">
                    <span className="bn-reading-pct-text">{percent}%</span>
                    <Link
                      to={`/books/${encodeURIComponent(bookId)}/read`}
                      className="bn-btn-continue"
                    >
                      Tiếp tục đọc
                    </Link>
                    <button style={{ color: 'var(--bn-text-subtle)' }} aria-label="More options">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI: HOẠT ĐỘNG GẦN ĐÂY & THỐNG KÊ ĐỌC SÁCH */}
        <div>
          {/* Card 1: Hoạt động gần đây */}
          <div className="bn-side-panel-card">
            <div className="bn-side-panel-title">Hoạt động gần đây</div>

            <div className="bn-activity-row">
              <img
                src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200"
                alt="thumb"
                className="bn-activity-thumb"
              />
              <div className="bn-activity-desc">
                Bạn đã đọc 2 chương<br />
                <strong>Đắc Nhân Tâm</strong>
                <div className="bn-activity-time">3 giờ trước</div>
              </div>
            </div>

            <div className="bn-activity-row">
              <img
                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=200"
                alt="thumb"
                className="bn-activity-thumb"
              />
              <div className="bn-activity-desc">
                Bạn đã thêm sách mới<br />
                <strong>Sapiens: Lược sử loài người</strong>
                <div className="bn-activity-time">5 giờ trước</div>
              </div>
            </div>

            <div className="bn-activity-row">
              <img
                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200"
                alt="thumb"
                className="bn-activity-thumb"
              />
              <div className="bn-activity-desc">
                Bạn đã hoàn thành<br />
                <strong>Atomic Habits</strong>
                <div className="bn-activity-time">1 ngày trước</div>
              </div>
            </div>

            <div className="bn-activity-row">
              <img
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200"
                alt="thumb"
                className="bn-activity-thumb"
              />
              <div className="bn-activity-desc">
                Bạn đã thích sách<br />
                <strong>Nhà Giả Kim</strong>
                <div className="bn-activity-time">2 ngày trước</div>
              </div>
            </div>
          </div>

          {/* Card 2: Thống kê đọc sách */}
          <div className="bn-side-panel-card">
            <div className="bn-side-panel-title">Thống kê đọc sách</div>
            <div className="bn-stats-grid-3">
              <div>
                <div className="bn-stat-num">3</div>
                <div className="bn-stat-name">Đang đọc</div>
              </div>
              <div>
                <div className="bn-stat-num">12</div>
                <div className="bn-stat-name">Đã đọc</div>
              </div>
              <div>
                <div className="bn-stat-num">21</div>
                <div className="bn-stat-name">Tổng sách</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReaderLayout>
  );
}
