// Import { useEffect, useMemo, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderHome.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useState } from 'react';
// Import { Bookmark, BookOpen, Crown, ChevronLeft, ChevronRight, Brain, Compass, Landmark từ lucide-react để dùng trong giao diện.
import {
  Bookmark,
  BookOpen,
  Crown,
  ChevronLeft,
  ChevronRight,
  Brain,
  Compass,
  Landmark,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from 'lucide-react';

// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';

// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { ReaderSidebar } từ ../components/ReaderSidebar để dùng trong giao diện.
import { ReaderSidebar } from '../components/ReaderSidebar';
// Import { ReaderNotifications } từ ../components/ReaderNotifications để dùng trong giao diện.
import { ReaderNotifications } from '../components/ReaderNotifications';

// Import { errorMessage, fetchPublicBooks, fetchReadableChapters, fetchReadingProgress } từ ../api/client để dùng trong giao diện.
import { errorMessage, fetchPublicBooks, fetchReadableChapters, fetchReadingProgress } from '../api/client';

// Import type { Book as BookType, Chapter } từ ../types để dùng trong giao diện.
import type { Book as BookType, Chapter } from '../types';
// Import { cleanBookDescription } từ ../utils/book-description để dùng trong giao diện.
import { cleanBookDescription } from '../utils/book-description';

// Import module từ ./booknest-home.css để dùng trong giao diện.
import './booknest-home.css';

/**
 * Trang chủ Reader được dựng riêng theo composition của ảnh tham chiếu:
 * desk background → khung sách bo góc → sidebar mảnh → hai trang sách.
 */
/**
 * Hàm/thành phần ReaderHome: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, getItem, useEffect, return, setBooks, setLoading.
 */
export function ReaderHome() {
  // Biến { user, loading: authLoading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();

  // Biến [books, setBooks] nhận giá trị từ useState<BookType[]>([]). const không gán lại; let có thể cập nhật.
  const [books, setBooks] = useState<BookType[]>([]);
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [bannerIndex, setBannerIndex] nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [bannerIndex, setBannerIndex] = useState(0);
  // Biến [chapters, setChapters] nhận giá trị từ useState<Chapter[]>([]). const không gán lại; let có thể cập nhật.
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Biến [chaptersRead, setChaptersRead] nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [chaptersRead, setChaptersRead] = useState(0);
  // Biến [isSidebarCollapsed, setIsSidebarCo nhận giá trị từ useState(() => localStorage.getItem('reader-sidebar-col. const không gán lại; let có thể cập nhật.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('reader-sidebar-collapsed') === 'true');

  // State điều khiển animation của danh sách sách
  // Biến [slideDirection, setSlideDirection] nhận giá trị từ useState<'next' | 'previous'>('next'). const không gán lại; let có thể cập nhật.
  const [slideDirection, setSlideDirection] = useState<'next' | 'previous'>('next');
  // Biến [slideKey, setSlideKey] nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [slideKey, setSlideKey] = useState(0);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; if (authLoading) return () => { active = fa
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return () => { active = false; };
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) {
      // Gọi/thực thi setBooks với đối số để cập nhật logic/giao diện: setBooks([])
      setBooks([]);
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
      return () => { active = false; };
    }
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');

    // Gọi/thực thi fetchPublicBooks với đối số để cập nhật logic/giao diện: fetchPublicBooks(search, undefined, 1, 24) .then((result) => { if (active) setBo
    fetchPublicBooks(search, undefined, 1, 24)
      .then((result) => {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setBooks(result.books);
      })
      .catch((err) => {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setLoading(false);
      });

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
      active = false;
    };
  }, [authLoading, search, user]);

  // Biến orderedBooks nhận giá trị từ useMemo(() => { if (books.length === 0) return []; cons. const không gán lại; let có thể cập nhật.
  const orderedBooks = useMemo(() => {
    // if chỉ chạy nhánh này khi điều kiện books.length === 0 đúng.
    if (books.length === 0) return [];
    // Biến verifiedBooks nhận giá trị từ books.filter((book) => Boolean(book.cover_source_url &&. const không gán lại; let có thể cập nhật.
    const verifiedBooks = books.filter((book) => Boolean(book.cover_source_url && book.cover_license_name
      && book.cover_license_name !== 'Bìa thay thế do OpenBook thiết kế'));
    // Biến fallbackBooks nhận giá trị từ books.filter((book) => !verifiedBooks.includes(book)). const không gán lại; let có thể cập nhật.
    const fallbackBooks = books.filter((book) => !verifiedBooks.includes(book));
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: [...verifiedBooks, ...fallbackBooks].
    return [...verifiedBooks, ...fallbackBooks];
  }, [books]);

  // Biến visualBooks nhận giá trị từ useMemo(() => { if (orderedBooks.length === 0) return [. const không gán lại; let có thể cập nhật.
  const visualBooks = useMemo(() => {
    // if chỉ chạy nhánh này khi điều kiện orderedBooks.length === 0 đúng.
    if (orderedBooks.length === 0) return [];
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Array.from({ length: Math.min(4, orderedBooks.length) }, (_, index) => orderedBo.
    return Array.from({ length: Math.min(4, orderedBooks.length) }, (_, index) =>
      orderedBooks[(bannerIndex + index) % orderedBooks.length]
    );
  }, [orderedBooks, bannerIndex]);

  // The first visible featured book drives the author and chapter panels.
  // Biến displayedHero nhận giá trị từ visualBooks[0]. const không gán lại; let có thể cập nhật.
  const displayedHero = visualBooks[0];
  // Biến firstReadableBook nhận giá trị từ displayedHero. const không gán lại; let có thể cập nhật.
  const firstReadableBook = displayedHero;
  // Biến authorSummary nhận giá trị từ displayedHero ? cleanBookDescription(displayedHero.desc. const không gán lại; let có thể cập nhật.
  const authorSummary = displayedHero
    ? cleanBookDescription(displayedHero.description) || `Khám phá ${displayedHero.title} trong thư viện HarveyBook.`
    : '';

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (!user) { setChaptersRead(0); return; } let active = true;
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { setChaptersRead(0); return; }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi fetchReadingProgress với đối số để cập nhật logic/giao diện: fetchReadingProgress().then(({ progress }) => { if (active) setChaptersRead(prog
    fetchReadingProgress().then(({ progress }) => {
      // if chỉ chạy nhánh này khi điều kiện active đúng.
      if (active) setChaptersRead(progress.reduce((total, item) => total + (item.completed_chapter_count ?? 0), 0));
    }).catch(() => { if (active) setChaptersRead(0); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [user]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (!displayedHero?._id) { setChapters([]); return; } let acti
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện !displayedHero?._id đúng.
    if (!displayedHero?._id) { setChapters([]); return; }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters([])
    setChapters([]);
    // Gọi/thực thi fetchReadableChapters với đối số để cập nhật logic/giao diện: fetchReadableChapters(displayedHero._id, 1, 2) .then((result) => { if (active) s
    fetchReadableChapters(displayedHero._id, 1, 2)
      .then((result) => { if (active) setChapters(result.chapters); })
      .catch(() => { if (active) setChapters([]); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [displayedHero?._id]);

  /**
   * Hàm/thành phần openBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: navigate, encodeURIComponent.
   */
  const openBook = () => {
    // if chỉ chạy nhánh này khi điều kiện firstReadableBook?._id đúng.
    if (firstReadableBook?._id) {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(firstReadableBook._id)}`)
      navigate(`/books/${encodeURIComponent(firstReadableBook._id)}`);
    } else {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/catalog')
      navigate('/catalog');
    }
  };

  /**
   * Hàm/thành phần nextHero: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setBannerIndex.
   */
  const nextHero = () => {
    // if chỉ chạy nhánh này khi điều kiện books.length đúng.
    if (books.length) setBannerIndex((current) => (current + 1) % books.length);
  };

  /**
   * Hàm/thành phần previousHero: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setBannerIndex.
   */
  const previousHero = () => {
    // if chỉ chạy nhánh này khi điều kiện books.length đúng.
    if (books.length) {
      // Gọi/thực thi setBannerIndex với đối số để cập nhật logic/giao diện: setBannerIndex((current) => (current - 1 + books.length) % books.length)
      setBannerIndex((current) => (current - 1 + books.length) % books.length);
    }
  };

  /**
   * Hàm/thành phần handleNextHero: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSlideDirection, setSlideKey, nextHero.
   */
  const handleNextHero = () => {
    // Gọi/thực thi setSlideDirection với đối số để cập nhật logic/giao diện: setSlideDirection('next')
    setSlideDirection('next');
    // Gọi/thực thi setSlideKey với đối số để cập nhật logic/giao diện: setSlideKey((key) => key + 1)
    setSlideKey((key) => key + 1);
    // Gọi/thực thi nextHero với đối số để cập nhật logic/giao diện: nextHero()
    nextHero();
  };

  /**
   * Hàm/thành phần handlePreviousHero: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSlideDirection, setSlideKey, previousHero.
   */
  const handlePreviousHero = () => {
    // Gọi/thực thi setSlideDirection với đối số để cập nhật logic/giao diện: setSlideDirection('previous')
    setSlideDirection('previous');
    // Gọi/thực thi setSlideKey với đối số để cập nhật logic/giao diện: setSlideKey((key) => key + 1)
    setSlideKey((key) => key + 1);
    // Gọi/thực thi previousHero với đối số để cập nhật logic/giao diện: previousHero()
    previousHero();
  };

  // if chỉ chạy nhánh này khi điều kiện !authLoading && !user đúng.
  if (!authLoading && !user) {
    // Biến guestCategories nhận giá trị từ [ { title: 'Văn học', description: 'Tiểu thuyết, truyện. const không gán lại; let có thể cập nhật.
    const guestCategories = [
      { title: 'Văn học', description: 'Tiểu thuyết, truyện ngắn, truyện cổ điển', icon: Landmark },
      { title: 'Kinh tế', description: 'Quản trị, đầu tư, kinh doanh', icon: TrendingUp },
      { title: 'Khoa học', description: 'Công nghệ, tự nhiên, khám phá', icon: Brain },
      { title: 'Lịch sử', description: 'Sự kiện, danh nhân, dòng chảy thời gian', icon: Compass },
      { title: 'Tâm lý', description: 'Phát triển bản thân, kỹ năng sống', icon: Bookmark },
    ];

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="booknest-home booknest-guest-home"><div className="booknest-book.
    return <div className="booknest-home booknest-guest-home"><div className="booknest-book booknest-book-guest">
      <ReaderSidebar showLabels collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((previous) => {
        // Biến next nhận giá trị từ !previous. const không gán lại; let có thể cập nhật.
        const next = !previous;
        // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('reader-sidebar-collapsed', String(next))
        localStorage.setItem('reader-sidebar-collapsed', String(next));
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: next.
        return next;
      })} />
      <main className="booknest-guest-main">
        <header className="booknest-guest-header">
          <form className="booknest-guest-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate(search.trim() ? `/catalog?search=${encodeURIComponent(search.trim())}` : '/catalog'); }}>
            <Search size={19} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm sách, tác giả, chủ đề..." aria-label="Tìm kiếm sách, tác giả, chủ đề" />
          </form>
          <nav className="booknest-guest-topnav" aria-label="Điều hướng chính">
            <a href="#features">Giới thiệu</a>
            <Link to="/membership">Gói thành viên</Link>
            <a href="#categories">Blog</a>
            <Link to="/support">Liên hệ</Link>
            <Link className="booknest-guest-login" to="/login">Đăng nhập</Link>
          </nav>
        </header>

        <section className="booknest-guest-hero" aria-labelledby="guest-home-title">
          <div className="booknest-guest-copy">
            <p className="booknest-guest-eyebrow"><span /> THƯ VIỆN SỐ HARVEYBOOK</p>
            <h1 id="guest-home-title">Chạm vào thế giới<br /><em>qua từng trang sách.</em></h1>
            <p className="booknest-guest-description">Khám phá những câu chuyện đáng nhớ, lưu lại cuốn sách bạn yêu thích và tiếp tục đọc theo nhịp riêng của mình.</p>
            <div className="booknest-guest-actions">
              <Link className="booknest-guest-primary" to="/login">Bắt đầu ngay <ChevronRight size={18} /></Link>
              <Link className="booknest-guest-secondary" to="/catalog">Khám phá thư viện</Link>
            </div>
          </div>
          <div className="booknest-guest-photo"><img src="/harveybook-library-hero.jpg" alt="Một cuốn sách đang mở trên bàn trong không gian thư viện ấm áp" /></div>
        </section>

        <section className="booknest-guest-benefits" id="features" aria-label="Lợi ích của HarveyBook">
          <article><span className="booknest-guest-benefit-icon"><BookOpen size={26} /></span><div><strong>Đọc mọi lúc, mọi nơi</strong><p>Đồng bộ giữa các thiết bị để bạn không bỏ lỡ trang sách nào.</p></div></article>
          <article><span className="booknest-guest-benefit-icon"><ShieldCheck size={26} /></span><div><strong>An toàn &amp; bảo mật</strong><p>Bảo vệ dữ liệu và quyền riêng tư của bạn một cách tối ưu.</p></div></article>
          <article><span className="booknest-guest-benefit-icon"><Bookmark size={26} /></span><div><strong>Cá nhân hóa trải nghiệm</strong><p>Gợi ý sách phù hợp với sở thích và thói quen đọc của bạn.</p></div></article>
        </section>

        <section className="booknest-guest-categories" id="categories">
          <p className="booknest-guest-eyebrow">KHÁM PHÁ DANH MỤC</p>
          <h2>Kho tàng tri thức</h2>
          <p className="booknest-guest-category-intro">Đa dạng thể loại sách cho mọi sở thích và nhu cầu.</p>
          <div className="booknest-guest-category-grid">
            {guestCategories.map(({ title, description, icon: Icon }) => <Link to="/catalog" className="booknest-guest-category" key={title}>
              <span><Icon size={25} strokeWidth={1.5} /></span><div><strong>{title}</strong><small>{description}</small></div>
            </Link>)}
          </div>
        </section>
      </main>
    </div></div>;
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="booknest-home"> <div className="booknest-book"> {} <ReaderSide.
  return (
    <div className="booknest-home">
      <div className="booknest-book">
        {/* SIDEBAR */}
        <ReaderSidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => {
          // Biến next nhận giá trị từ !prev. const không gán lại; let có thể cập nhật.
          const next = !prev;
          // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('reader-sidebar-collapsed', String(next))
          localStorage.setItem('reader-sidebar-collapsed', String(next));
          // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: next.
          return next;
        })} />

        {/* PHẦN NỘI DUNG: hai "trang sách" chia bởi đường sống giữa. */}
        <main className="booknest-pages">
          {/* SEARCH BAR */}
          <form
            className="booknest-search"
            onSubmit={(event) => {
              // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
              event.preventDefault();
              // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(search.trim() ? `/?search=${encodeURIComponent(search.trim())}` : '/')
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
                          // Gọi/thực thi biểu thức để cập nhật logic/giao diện: event.currentTarget.onerror = null
                          event.currentTarget.onerror = null;
                          // Gọi/thực thi biểu thức để cập nhật logic/giao diện: event.currentTarget.src = '/book-cover-placeholder.svg'
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
