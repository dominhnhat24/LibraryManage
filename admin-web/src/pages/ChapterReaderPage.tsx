import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight,
  Sun, Moon, Type, MessageSquare, Send
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPublicBook, fetchReadableChapterMetadata, fetchReadableChapters, fetchReadingProgress, readBookChapter,
  saveReaderBookmark, fetchReaderBookmarks, deleteReaderBookmark, fetchBookComments, createBookComment
} from '../api/client';
import type { Book, Chapter, Comment } from '../types';

export function ChapterReaderPage() {
  const { bookId = '', chapterId = '' } = useParams<{ bookId: string; chapterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    const preference = localStorage.getItem('openbook.reading-size');
    return preference === 'small' ? 'sm' : preference === 'large' ? 'lg' : 'md';
  });
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState('');
  const [showAd, setShowAd] = useState(false);
  const [panelMode, setPanelMode] = useState<'toc' | 'comments'>('toc');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('openbook.reading-size', fontSize === 'sm' ? 'small' : fontSize === 'lg' ? 'large' : 'medium');
  }, [fontSize]);

  // Tải dữ liệu sách và danh mục chương thật từ API
  useEffect(() => {
    let active = true;

    if (bookId) {
      fetchPublicBook(bookId)
        .then((b) => {
          if (!active) return;
          setBook(b);
          if (b._id !== bookId) {
            navigate(`/books/${encodeURIComponent(b._id)}/read${chapterId ? `/${encodeURIComponent(chapterId)}` : ''}`, { replace: true });
          } else if (b.reader_mode === 'pdf') {
            navigate(`/books/${encodeURIComponent(b._id)}/pdf`, { replace: true });
          } else if (b.reader_mode === 'unsupported') {
            setChapterContent(`Định dạng ${b.file_format || 'này'} chưa có trình đọc trong ứng dụng.`);
          } else if (b.reader_mode === 'unavailable') {
            setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
          }
        })
        .catch(() => {});

      fetchReadableChapters(bookId, 1, 50)
        .then(async (res) => {
          if (!active) return;
          setChapters(res.chapters);
          const firstChapterId = res.chapters[0]?._id;
          const selectChapter = async (targetId: string, updateRoute: boolean) => {
            let target = res.chapters.find((chapter) => chapter._id === targetId);
            if (!target) {
              // Direct metadata lookup avoids scanning all catalog pages for a saved chapter.
              target = await fetchReadableChapterMetadata(bookId, targetId);
              if (!active) return;
              setChapters((current) => current.some((chapter) => chapter._id === targetId)
                ? current
                : [...current, target!].sort((a, b) => a.chapter_number - b.chapter_number));
            }
            if (!active) return;
            setCurrentChapterId(targetId);
            if (updateRoute) navigate(`/books/${encodeURIComponent(bookId)}/read/${encodeURIComponent(targetId)}`, { replace: true });
          };

          if (chapterId) {
            try { await selectChapter(chapterId, false); }
            catch { if (active && firstChapterId) setCurrentChapterId(firstChapterId); }
          } else if (!user) {
            if (firstChapterId) setCurrentChapterId(firstChapterId);
            else setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
          } else {
            try {
              const progressResult = await fetchReadingProgress(1, 1, '', bookId);
              if (!active) return;
              const lastRead = progressResult.progress[0]?.last_read_chapter;
              const lastReadId = typeof lastRead === 'string' ? lastRead : lastRead?._id || lastRead?.id;
              if (lastReadId) {
                try { await selectChapter(lastReadId, true); }
                catch { if (active && firstChapterId) setCurrentChapterId(firstChapterId); }
              } else if (firstChapterId) setCurrentChapterId(firstChapterId);
              else setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
            } catch {
              if (active && firstChapterId) setCurrentChapterId(firstChapterId);
              else if (active) setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
            }
          }
        })
        .catch(() => { if (active) setChapterContent('Không thể tải danh sách chương hoặc sách không còn khả dụng.'); });
    }

    if (user && bookId) {
      fetchReaderBookmarks().then((bm) => {
        if (active) {
          const found = bm.bookmarks.find((b) => {
            const bId = typeof b.book === 'string' ? b.book : b.book?._id;
            return bId === bookId;
          });
          setBookmarkId(found?._id || '');
          setIsBookmarked(Boolean(found));
        }
      }).catch(() => {});
    }

    return () => { active = false; };
  }, [bookId, chapterId, user, navigate]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.is_vip || user?.is_premium || showAd) return;
    const key = `harvey-free-ad-time:${bookId}`;
    const lastAdAt = Number(sessionStorage.getItem(key) || Date.now());
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, String(lastAdAt));
    const interval = window.setInterval(() => {
      if (Date.now() - Number(sessionStorage.getItem(key) || lastAdAt) >= 10 * 60 * 1000) setShowAd(true);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [bookId, user, showAd]);

  useEffect(() => {
    let active = true;
    fetchBookComments(bookId).then((result) => {
      if (!active) return;
      setComments(result.comments);
      setCommentsTotal(result.pagination.total);
    }).catch(() => { if (active) setCommentError('Không thể tải bình luận.'); });
    return () => { active = false; };
  }, [bookId]);

  async function sendReaderComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } }); return; }
    const body = commentDraft.trim();
    if (!body) return;
    setCommentSaving(true); setCommentError('');
    try {
      const created = await createBookComment(bookId, body, null);
      setComments((current) => [created, ...current]);
      setCommentsTotal((count) => count + 1);
      setCommentDraft('');
    } catch { setCommentError('Chưa gửi được bình luận. Vui lòng thử lại.'); }
    finally { setCommentSaving(false); }
  }

  // Đọc nội dung chương thật từ endpoint API POST /books/:bookId/chapters/:chapterId/read
  useEffect(() => {
    if (!bookId || !currentChapterId) return;

    readBookChapter(bookId, currentChapterId)
      .then((res) => {
        if (res?.chapter?.content) {
          setChapterContent(res.chapter.content);
        }
      })
      .catch(() => setChapterContent('Không thể tải nội dung chương. Vui lòng quay lại thử sau.'));
  }, [bookId, currentChapterId]);

  // Tìm chương hiện tại
  const currentChapter = useMemo(() => {
    return chapters.find(c => c._id === currentChapterId);
  }, [chapters, currentChapterId]);

  const currentIndex = useMemo(() => {
    const idx = chapters.findIndex(c => c._id === currentChapterId);
    return idx >= 0 ? idx : 0;
  }, [chapters, currentChapterId]);

  function navigateToChapter(targetChapterId: string) {
    setCurrentChapterId(targetChapterId);
    navigate(`/books/${encodeURIComponent(bookId)}/read/${encodeURIComponent(targetChapterId)}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigateToChapter(chapters[currentIndex - 1]._id);
    }
  };

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) {
      navigateToChapter(chapters[currentIndex + 1]._id);
    }
  };

  const toggleBookmark = async () => {
    if (!user) { navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } }); return; }
    if (isBookmarked && bookmarkId) {
      try { await deleteReaderBookmark(bookmarkId); setBookmarkId(''); setIsBookmarked(false); } catch { /* keep current state */ }
    } else if (bookId && currentChapterId) {
      try { const saved = await saveReaderBookmark(bookId, currentChapterId); setBookmarkId(saved._id); setIsBookmarked(true); } catch { /* keep current state */ }
    }
  };

  const getFontSize = () => {
    if (fontSize === 'sm') return '15px';
    if (fontSize === 'lg') return '18px';
    return '16.5px';
  };

  return (
    <div
      className={`bn-reader-page-root harvey-reader-page ${theme === 'dark' ? 'is-dark' : ''} ${theme === 'sepia' ? 'is-sepia' : ''}`}
      style={{
        backgroundColor: theme === 'sepia' ? '#FBF0D9' : theme === 'dark' ? '#1E293B' : '#F8FAFB',
        color: theme === 'dark' ? '#F1F5F9' : '#1E293B'
      }}
    >
      {/* 1. Header trên cùng */}
      <header
        className="bn-reader-navbar"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#334155' : 'var(--bn-border)'
        }}
      >
        <Link
          to={`/books/${encodeURIComponent(bookId)}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bn-text-muted)' }}
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="bn-reader-nav-title">
          <div className="bn-reader-nav-book-name" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}>
            {book?.title || 'Đang tải sách…'}
          </div>
          <div className="bn-reader-nav-author-name">
            {book?.author_name || ''}
          </div>
        </div>

        <div className="harvey-reader-tools" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--bn-text-muted)' }}>
          <button aria-label={panelMode === 'comments' ? 'Mở mục lục' : 'Mở bình luận'} aria-pressed={panelMode === 'comments'} onClick={() => setPanelMode((mode) => mode === 'toc' ? 'comments' : 'toc')} title="Bình luận"><MessageSquare size={19} /></button>
          <button
            onClick={toggleBookmark}
            title={isBookmarked ? 'Bỏ lưu sách' : 'Lưu sách'}
            aria-label={isBookmarked ? 'Bỏ lưu sách' : 'Lưu sách'}
            aria-pressed={isBookmarked}
            style={{ color: isBookmarked ? '#D0A82F' : 'inherit' }}
          >
            <BookmarkIcon size={19} fill={isBookmarked ? '#D0A82F' : 'none'} />
          </button>
          <button
            onClick={() => setFontSize(f => f === 'sm' ? 'md' : f === 'md' ? 'lg' : 'sm')}
            title="Đổi cỡ chữ"
          >
            <Type size={19} />
          </button>
          <button
            onClick={() => setTheme(t => t === 'light' ? 'sepia' : t === 'sepia' ? 'dark' : 'light')}
            title="Đổi giao diện đọc"
          >
            {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>

      {/* 2. Container đọc sách 2 cột */}
      <div className="bn-reader-container">
        {/* Cột trái: Mục lục */}
        <aside
          className="bn-reader-toc-panel"
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            boxShadow: theme === 'dark' ? 'none' : undefined
          }}
        >
          {panelMode === 'toc' ? <>
            <div className="bn-reader-toc-heading" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}><span>Mục lục</span><small>{chapters.length} chương</small></div>
            {chapters.map((chapter) => <button aria-current={chapter._id === currentChapterId ? 'page' : undefined} className={`bn-reader-toc-item-link ${chapter._id === currentChapterId ? 'active' : ''}`} key={chapter._id} onClick={() => navigateToChapter(chapter._id)} type="button"><span><small>Chương {chapter.chapter_number}</small>{chapter.title}</span><ChevronRight size={15} /></button>)}
          </> : <div className="harvey-reader-comments">
            <div className="bn-reader-toc-heading"><span>Bình luận</span><small>{commentsTotal} bình luận</small></div>
            <form onSubmit={(event) => void sendReaderComment(event)}>{user?.name && <span className="harvey-comment-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span>}<input aria-label="Viết bình luận" maxLength={3000} onChange={(event) => setCommentDraft(event.target.value)} placeholder={user ? 'Viết bình luận...' : 'Đăng nhập để bình luận'} value={commentDraft} /><button aria-label="Gửi bình luận" disabled={commentSaving} type="submit"><Send size={15} /></button></form>
            {commentError && <p className="harvey-comment-error">{commentError}</p>}
            <div className="harvey-comment-list">{comments.length ? comments.map((comment) => {
              const author = typeof comment.user === 'object' ? comment.user.name : 'Độc giả';
              return <article key={comment._id}><span className="harvey-comment-avatar">{author.slice(0, 1).toUpperCase()}</span><div><header><strong>{author}</strong><time>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</time></header><p>{comment.body}</p><small>{comment.rating ? `${comment.rating} ★` : 'Bình luận'}</small></div></article>;
            }) : <p className="harvey-comments-empty">Chưa có bình luận. Hãy chia sẻ cảm nhận đầu tiên.</p>}</div>
          </div>}
        </aside>

        {/* Cột phải: Vùng đọc sách */}
        <main
          className="bn-reader-main-book-panel"
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            boxShadow: theme === 'dark' ? 'none' : undefined
          }}
        >
          <div className="bn-reader-chapter-number-tag">
            Chương {currentChapter?.chapter_number || 1}
          </div>
          <h1 className="bn-reader-chapter-big-title" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}>
            {currentChapter?.title || 'Đang tải chương…'}
          </h1>

          <div
            className="bn-reader-prose"
            style={{
              fontSize: getFontSize(),
              color: theme === 'dark' ? '#CBD5E1' : '#2D3748'
            }}
          >
            {chapterContent.split('\n\n').map((para, pIdx) => (
              <p key={pIdx}>{para}</p>
            ))}
          </div>

          {/* Footer Điều hướng Đọc sách */}
          <div className="bn-reader-footer-nav" style={{ borderColor: theme === 'dark' ? '#334155' : undefined }}>
            <button
              className="bn-hero-arrow-btn"
              style={{ position: 'static', transform: 'none' }}
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              aria-label="Previous chapter"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="bn-reader-footer-center">
              <span className="bn-reader-footer-pos">
                Chương {currentChapter?.chapter_number || 1} / {chapters.length}
              </span>
              <div className="bn-reader-footer-bar">
                <div
                  className="bn-reader-footer-fill"
                  style={{
                    width: `${Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 1)) * 100)}%`
                  }}
                />
              </div>
              <span className="bn-reader-footer-pct">
                {Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 1)) * 100)}%
              </span>
            </div>

            <button
              className="bn-hero-arrow-btn"
              style={{ position: 'static', transform: 'none' }}
              onClick={handleNext}
              disabled={currentIndex >= chapters.length - 1}
              aria-label="Next chapter"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </main>
      </div>
      {showAd && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation"><section aria-labelledby="free-ad-title" aria-modal="true" className="w-full max-w-md rounded-xl border border-[#e5ddc8] bg-[#f8f6ec] p-7 text-center shadow-xl" role="dialog"><p className="harvey-eyebrow">HARVEYBOOK · QUẢNG CÁO</p><h2 className="mt-2 text-xl font-semibold text-[#302d20]" id="free-ad-title">Cảm ơn bạn đã đọc cùng HarveyBook</h2><div className="my-5 grid min-h-32 place-items-center border border-dashed border-[#cfc5a7] bg-[#f2eddd] text-sm text-[#8a826d]">Vị trí hiển thị quảng cáo</div><button className="rounded-md bg-[#948342] px-5 py-2.5 text-sm font-semibold text-white" onClick={() => { setShowAd(false); sessionStorage.setItem(`harvey-free-ad-time:${bookId}`, String(Date.now())); }} type="button">Tiếp tục đọc</button></section></div>}
    </div>
  );
}
