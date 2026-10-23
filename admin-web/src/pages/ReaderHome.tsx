import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  LibraryBig,
  MoreHorizontal,
  Play,
  Search,
  Settings,
  Timer,
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

import { errorMessage, fetchPublicBooks } from '../api/client';

import type { Book as BookType } from '../types';

import './booknest-home.css';


const visualBooks = [
  { title: 'Eat that frog', author: 'Brian Tracy', cover: '/assets/eat-that-frog.svg' },
  { title: 'Psychology of money', author: 'Morgan Housel', cover: '/assets/psychology-of-money.svg' },
  { title: 'How to talk to anyone', author: 'Leil Lowndes', cover: '/assets/how-to-talk.svg' },
  { title: 'The 10X rule', author: 'Grant Cardone', cover: '/assets/the-10x-rule.svg' },
];

/**
 * Dữ liệu phần "Chapters" là dữ liệu trình bày giống ảnh mẫu.
 * Khi người dùng chọn chapter, ta vẫn điều hướng về trang đọc thật.
 */

const chapterPreview = [
  { title: 'The Surprising Power of Atomic Habits', text: 'small, consistent changes can produce remarkable results over time.', time: '15 min' },
  { title: 'How Your Habits Shape Your Identity', text: 'small, consistent changes can produce remarkable results over time.', time: '18 min' },
];

/**
 * Trang chủ Reader được dựng riêng theo composition của ảnh tham chiếu:
 * desk background → khung sách bo góc → sidebar mảnh → hai trang sách.
 */

export function ReaderHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dữ liệu thật từ backend vẫn được tải để các thao tác đọc sách hoạt động với project hiện tại.
  const [books, setBooks] = useState<BookType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  useEffect(() => {
    let active = true;
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
  }, [search]);

  // Cuốn sách thật đầu tiên được dùng làm target cho nút "Start reading".
  const firstReadableBook = books[0];

  // Thông tin hero có fallback để ảnh vẫn giữ đúng bố cục ngay cả khi API chưa trả dữ liệu.
  const heroBook = useMemo(() => {
    const fallback = {
      title: 'Happy reading',
      author: user?.name || 'Harvey',
      description: "Wow! you've deep dived into the wonderful world of reading.",
    };

    return {
      title: firstReadableBook?.title || fallback.title,
      author: firstReadableBook?.author_name || fallback.author,
      description: firstReadableBook?.description || fallback.description,
    };
  }, [firstReadableBook, user?.name]);

  const openBook = () => {
    if (firstReadableBook?._id) {
      navigate(`/books/${encodeURIComponent(firstReadableBook._id)}/read`);
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

  const displayedHero = books[bannerIndex] || firstReadableBook;

  return (
    <div className="booknest-home">
      <div className="booknest-book">
        {/* SIDEBAR: ảnh mẫu chỉ dùng icon, không dùng sideb  ar rộng có chữ. */}        
          <aside
            className={`booknest-sidebar ${
              isSidebarCollapsed ? "is-collapsed" : ""
            }`}
            aria-label="Điều hướng"
          >
            <nav
              className={`booknest-side-nav ${
                isSidebarCollapsed ? "is-collapsed" : ""
              }`}
              aria-hidden={isSidebarCollapsed}
            >
              <Link
                className="booknest-side-icon"
                to="/"
                aria-label="Trang chủ"
                title="Trang chủ"
                tabIndex={isSidebarCollapsed ? -1 : 0}
              >
                <Home size={30} strokeWidth={1.2} />
              </Link>

              <Link
                className="booknest-side-icon"
                to="/library"
                aria-label="Tủ sách"
                title="Tủ sách"
                tabIndex={isSidebarCollapsed ? -1 : 0}
              >
                <LibraryBig size={30} strokeWidth={1.2} />
              </Link>

              <Link
                className="booknest-side-icon"
                to="/books"
                aria-label="Lịch sử đọc"
                title="Lịch sử đọc"
                tabIndex={isSidebarCollapsed ? -1 : 0}
              >
                <Timer size={30} strokeWidth={1.2} />
              </Link>

              <Link
                className="booknest-side-icon"
                to="/favorites"
                aria-label="Yêu thích"
                title="Yêu thích"
                tabIndex={isSidebarCollapsed ? -1 : 0}
              >
                <Bookmark size={30} strokeWidth={1.2} />
              </Link>

              <Link
                className="booknest-side-icon"
                to="/settings"
                aria-label="Cài đặt"
                title="Cài đặt"
                tabIndex={isSidebarCollapsed ? -1 : 0}
              >
                <Settings size={30} strokeWidth={1.2} />
              </Link>
            </nav>

            <button
              className="booknest-side-icon booknest-menu-button"
              type="button"
              aria-label={isSidebarCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
              title={isSidebarCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
              aria-expanded={!isSidebarCollapsed}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            >
              <MoreHorizontal size={18} />
            </button>
          </aside>



        {/* PHẦN NỘI DUNG: hai "trang sách" chia bởi đường sống giữa. */}
        <main className="booknest-pages">
          {/* SEARCH BAR: nằm sát mép trên giống ảnh tham chiếu. */}
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
              placeholder="Search book name, author, edition..."
              aria-label="Search book name, author, edition"
            />
          </form>

          {/* USER CHIP: avatar nhỏ + tên + notification ở góc phải. */}
          <div className="booknest-user">
            <button className="booknest-notification" type="button" aria-label="Notifications">
              <Bell size={14} />
            </button>
            <Link to="/account" className="booknest-profile">
              <span className="booknest-avatar">
                {(user?.name || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span>{user?.name || 'Alexander Mark'}</span>
            </Link>
          </div>

          {/* LEFT PAGE */}
          <section className="booknest-left-page">
            <div className="booknest-welcome">
              <h1>
                {heroBook.title === 'Happy reading' ? (
                  <>
                    Happy reading
                    <span>{heroBook.author}</span>
                  </>
                ) : (
                  <>
                    Happy reading
                    <span>{heroBook.author}</span>
                  </>
                )}
              </h1>
              <p>
                Wow! You&apos;ve deep dived into the wonderful world of reading.
                <br />
                Have fun&apos;s parents didn&apos;t yet? Oops, looks like you&apos;re not there yet. Get reading now!
              </p>
              <button className="booknest-start" onClick={openBook} type="button">
                Start reading <span>→</span>
              </button>
            </div>

            {/* Open-book artwork là asset có sẵn trong project, không phải ảnh từ web. */}
            <div className="booknest-open-book">
              <img src="/assets/open-book-spread.svg" alt="Open book preview" />
            </div>

            <section className="booknest-popular">
              <div className="booknest-section-head">
                <h2>Popular Now</h2>
                <div className="booknest-mini-arrows">
                  <button type="button" onClick={previousHero} aria-label="Previous">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={nextHero} aria-label="Next">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              <div className="booknest-popular-grid">
                {visualBooks.map((book) => (
                  <Link className="booknest-popular-card" to={firstReadableBook?._id ? `/books/${encodeURIComponent(firstReadableBook._id)}` : '/catalog'} key={book.title}>
                    <img src={book.cover} alt={book.title} />
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="booknest-series">
              <div className="booknest-section-head">
                <h2>New series collection</h2>
                <button type="button" aria-label="More collections">
                  <MoreHorizontal size={15} />
                </button>
              </div>
              <Link className="booknest-series-card" to={firstReadableBook?._id ? `/books/${encodeURIComponent(firstReadableBook._id)}` : '/catalog'}>
                <img src="/assets/hardcover-stack.svg" alt="" />
                <span>
                  <strong>Hard cover free book psd mockup</strong>
                  <small>8 chapters eBook vol</small>
                </span>
                <b>2 vol</b>
              </Link>
            </section>
          </section>

          {/* RIGHT PAGE */}
          <section className="booknest-right-page">
            <div className="booknest-feature-book">
              <img src="/assets/open-book-spread.svg" alt="" className="booknest-right-book-art" />
              <div className="booknest-feature-copy">
                <h2>{displayedHero?.title || 'The Cambers of Secrets'}</h2>
                <span>154 / 300 pages</span>
                <p>
                  Harry has return to Hogwarts school with mischief, and to his 2nd year,
                  only to discover that...
                </p>
                <em>- J.K Rowling&apos;s</em>
              </div>
            </div>

            {/* AUDIO PLAYER: giao diện tĩnh theo ảnh nhưng nút play vẫn hoạt động. */}
            <section className="booknest-audio">
              <div className="booknest-section-head">
                <h2>Audio Book</h2>
                <div className="booknest-mini-arrows">
                  <button type="button" aria-label="Previous audio"><ChevronLeft size={13} /></button>
                  <button type="button" aria-label="Next audio"><ChevronRight size={13} /></button>
                </div>
              </div>

              <div className="booknest-player">
                <img src="/assets/atomic-habits-square.svg" alt="Atomic Habits" />
                <div className="booknest-player-main">
                  <strong>Atomic Habits</strong>
                  <span>James Clear</span>
                  <div className="booknest-progress">
                    <i style={{ width: playing ? '48%' : '34%' }} />
                  </div>
                  <div className="booknest-time">
                    <span>26:42</span>
                    <span>01:23:42</span>
                  </div>
                </div>
                <div className="booknest-player-controls">
                  <button type="button" aria-label="Previous track"><ChevronLeft size={12} /></button>
                  <button className="booknest-play" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause' : 'Play'}>
                    <Play size={10} fill="currentColor" />
                  </button>
                  <button type="button" aria-label="Next track"><ChevronRight size={12} /></button>
                </div>
              </div>
            </section>

            {/* CHAPTER LIST: giữ typography và khoảng cách của ảnh mẫu. */}
            <section className="booknest-chapters">
              <div className="booknest-section-head">
                <h2>Chapters</h2>
                <MoreHorizontal size={15} />
              </div>

              <div className="booknest-chapter-list">
                {chapterPreview.map((chapter, index) => (
                  <Link
                    className="booknest-chapter"
                    key={chapter.title}
                    to={firstReadableBook?._id ? `/books/${encodeURIComponent(firstReadableBook._id)}/read` : '/catalog'}
                  >
                    <span className="booknest-chapter-dot" />
                    <div>
                      <strong>{chapter.title}</strong>
                      <p>In the first chapters, James Clear introduces the core ideas: {chapter.text}</p>
                    </div>
                    <time>{chapter.time}</time>
                    {index === 0 && <span className="booknest-chapter-line" />}
                  </Link>
                ))}
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
