import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Search,
  UserRound,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { ReaderSidebar } from '../components/ReaderSidebar';
import { ReaderNotifications } from '../components/ReaderNotifications';

import { errorMessage, fetchPublicBooks, fetchReadableChapters, fetchReadingProgress } from '../api/client';

import type { Book as BookType, Chapter } from '../types';
import { cleanBookDescription } from '../utils/book-description';

import './booknest-home.css';

/**
 * Trang chủ Reader được dựng riêng theo composition của ảnh tham chiếu:
 * desk background → khung sách bo góc → sidebar mảnh → hai trang sách.
 */

export function ReaderHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState<BookType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersRead, setChaptersRead] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('reader-sidebar-collapsed') === 'true');

  // State điều khiển animation của danh sách sách
  const [slideDirection, setSlideDirection] = useState<'next' | 'previous'>('next');
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (authLoading) return () => { active = false; };
    if (!user) {
      setBooks([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError('');

    fetchPublicBooks(search, undefined, 1, 24)
      .then((result) => {
        if (active) setBooks(result.books);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, search, user]);

  const orderedBooks = useMemo(() => {
    if (books.length === 0) return [];
    const verifiedBooks = books.filter((book) => Boolean(book.cover_source_url && book.cover_license_name
      && book.cover_license_name !== 'Bìa thay thế do OpenBook thiết kế'));
    const fallbackBooks = books.filter((book) => !verifiedBooks.includes(book));
    return [...verifiedBooks, ...fallbackBooks];
  }, [books]);

  const visualBooks = useMemo(() => {
    if (orderedBooks.length === 0) return [];
    return Array.from({ length: Math.min(4, orderedBooks.length) }, (_, index) =>
      orderedBooks[(bannerIndex + index) % orderedBooks.length]
    );
  }, [orderedBooks, bannerIndex]);

  // The first visible featured book drives the author and chapter panels.
  const displayedHero = visualBooks[0];
  const firstReadableBook = displayedHero;
  const authorSummary = displayedHero
    ? cleanBookDescription(displayedHero.description) || `Khám phá ${displayedHero.title} trong thư viện HarveyBook.`
    : '';

  useEffect(() => {
    if (!user) { setChaptersRead(0); return; }
    let active = true;
    fetchReadingProgress().then(({ progress }) => {
      if (active) setChaptersRead(progress.reduce((total, item) => total + (item.completed_chapter_count ?? 0), 0));
    }).catch(() => { if (active) setChaptersRead(0); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!displayedHero?._id) { setChapters([]); return; }
    let active = true;
    setChapters([]);
    fetchReadableChapters(displayedHero._id, 1, 2)
      .then((result) => { if (active) setChapters(result.chapters); })
      .catch(() => { if (active) setChapters([]); });
    return () => { active = false; };
  }, [displayedHero?._id]);

  const openBook = () => {
    if (firstReadableBook?._id) {
      navigate(`/books/${encodeURIComponent(firstReadableBook._id)}`);
    } else {
      navigate('/catalog');
    }
  };

  const nextHero = () => {
    if (books.length) setBannerIndex((current) => (current + 1) % books.length);
  };

  const previousHero = () => {
    if (books.length) {
      setBannerIndex((current) => (current - 1 + books.length) % books.length);
    }
  };

  const handleNextHero = () => {
    setSlideDirection('next');
    setSlideKey((key) => key + 1);
    nextHero();
  };

  const handlePreviousHero = () => {
    setSlideDirection('previous');
    setSlideKey((key) => key + 1);
    previousHero();
  };

  if (!authLoading && !user) {
    return <div className="booknest-home"><div className="booknest-book">
      <ReaderSidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((previous) => {
        const next = !previous;
        localStorage.setItem('reader-sidebar-collapsed', String(next));
        return next;
      })} />
      <main className="booknest-pages grid place-items-center p-8 text-center">
        <section className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#81744f]">THƯ VIỆN SỐ HARVEYBOOK</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#29261f]">Chào mừng bạn đến với HarveyBook</h1>
          <p className="mt-4 text-sm leading-7 text-[#777164]">Đăng nhập hoặc tạo tài khoản để khám phá sách, lưu yêu thích và tiếp tục hành trình đọc của bạn.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link className="rounded-full bg-[#29261f] px-6 py-3 text-sm font-semibold text-white" to="/login">Đăng nhập</Link>
            <Link className="rounded-full border border-[#b9ad8d] px-6 py-3 text-sm font-semibold text-[#5f512b]" to="/register">Đăng ký</Link>
          </div>
        </section>
      </main>
    </div></div>;
  }

  return (
    <div className="booknest-home">
      <div className="booknest-book">
        {/* SIDEBAR */}
        <ReaderSidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem('reader-sidebar-collapsed', String(next));
          return next;
        })} />

        {/* PHẦN NỘI DUNG: hai "trang sách" chia bởi đường sống giữa. */}
        <main className="booknest-pages">
          {/* SEARCH BAR */}
          <form
            className="booknest-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(search.trim() ? `/?search=${encodeURIComponent(search.trim())}` : '/');
            }}
          >
            <Search size={13} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm kiếm tên sách, tác giả, thể loại..."
              aria-label="Tìm kiếm tên sách, tác giả, thể loại"
            />
          </form>

          {/* USER CHIP */}
          <div className="booknest-user">
            <Link to="/account" className="booknest-profile">
              <span className="booknest-avatar">
                {user?.name ? user.name.trim().slice(0, 1).toUpperCase() : <UserRound aria-hidden="true" size={16} />}
              </span>
              <span>{user?.name || 'Đăng nhập'}</span>
            </Link>
            <Link aria-label="Gói thành viên" className="booknest-membership-link" title="Gói thành viên" to="/membership"><Crown size={20} /></Link>
            <ReaderNotifications />
          </div>

          {/* LEFT PAGE */}
          <section className="booknest-left-page">
            <div className="booknest-welcome">
              <h1>
                Chào mừng bạn
                <span>đến với HarveyBook</span>
              </h1>
              <p>
                Wow! Bạn đã bước vào thế giới kỳ diệu của những cuốn sách. Khám phá các tác phẩm đang có trong thư viện HarveyBook và bắt đầu hành trình đọc sách của bạn.
              </p>
            </div>

            <div className="booknest-start-area">
              <button className="booknest-start" onClick={openBook} type="button">
                Bắt đầu đọc sách <span>→</span>
              </button>
            </div>

            <section className="booknest-popular">
              <div className="booknest-section-head">
                <h2>Sách nổi bật</h2>
                <div className="booknest-head-actions">
                  <button className="booknest-see-all" type="button" onClick={() => navigate('/catalog')}>Xem tất cả <ChevronRight size={16} /></button>
                  <div className="booknest-mini-arrows">
                  <button type="button" onClick={handlePreviousHero} aria-label="Sách trước">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={handleNextHero} aria-label="Sách tiếp theo">
                    <ChevronRight size={13} />
                  </button>
                  </div>
                </div>
              </div>

              <div className="booknest-popular-viewport">
                <div
                  key={slideKey}
                  className={`booknest-popular-grid ${
                    slideDirection === 'next' ? 'slide-left' : 'slide-right'
                  }`}
                >
                  {visualBooks.map((book) => (
                    <Link
                      className="booknest-popular-card"
                      to={book._id ? `/books/${encodeURIComponent(book._id)}` : '/catalog'}
                      key={book._id ?? book.title}
                    >
                      <img
                        className="booknest-cover-plain"
                        src={book.cover_url || '/book-cover-placeholder.svg'}
                        alt={book.title}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/book-cover-placeholder.svg';
                        }}
                      />

                      <strong>{book.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
              {!loading && visualBooks.length === 0 && <p className="booknest-home-empty booknest-popular-empty">Chưa có sách nổi bật để hiển thị.</p>}
            </section>

          </section>

          {/* RIGHT PAGE */}
          <section className="booknest-right-page">
            <section className="booknest-featured-author">
              <h2>Nhà văn nổi bật</h2>
              {displayedHero ? <>
                <Link className="booknest-author-row" to={`/books/${encodeURIComponent(displayedHero._id)}`}>
                  <span className="booknest-author-copy"><strong>{displayedHero.author_name}</strong><small>Tác giả · {displayedHero.title}</small></span>
                  <ChevronRight size={22} />
                </Link>
                <p className="booknest-author-read">{chaptersRead.toLocaleString('vi-VN')} chương đã đọc</p>
                <blockquote>{authorSummary.slice(0, 190)}{authorSummary.length > 190 ? '…' : ''}<cite>— {displayedHero.author_name}</cite></blockquote>
              </> : <p className="booknest-home-empty">Thông tin tác giả sẽ hiển thị khi có sách trong thư viện.</p>}
            </section>

            {/* CHAPTER LIST */}
            <section className="booknest-chapters">
              <div className="booknest-section-head">
                <h2>Chương sách</h2>
                <button className="booknest-see-all" type="button" onClick={() => firstReadableBook && navigate(`/books/${encodeURIComponent(firstReadableBook._id)}`)}>Xem tất cả <ChevronRight size={16} /></button>
              </div>

              <div className="booknest-chapter-list">
                {chapters.map((chapter) => (
                  <Link
                    className="booknest-chapter"
                    key={chapter._id}
                    to={firstReadableBook?._id ? `/books/${encodeURIComponent(firstReadableBook._id)}/read/${encodeURIComponent(chapter._id)}` : '/catalog'}
                  >
                    <span className="booknest-chapter-dot" />
                    <div className="booknest-chapter-copy">
                      <strong>{chapter.title}</strong>
                      <p>{chapter.excerpt || `Chương ${chapter.chapter_number}`}</p>
                    </div>
                    <time>{Math.max(1, Math.ceil((chapter.excerpt?.trim().split(/\s+/).length || 0) / 200))} phút</time>
                  </Link>
                ))}
                {!loading && chapters.length === 0 && <p className="booknest-home-empty">Chưa có chương sách để hiển thị.</p>}
              </div>
            </section>

            {loading && <span className="booknest-data-status">Updating library…</span>}
            {error && <span className="booknest-data-status is-error">{error}</span>}
          </section>
        </main>
      </div>
    </div>
  );
}
