import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight, BookOpen, ChevronLeft, ChevronRight, Crown, Search, UserRound, X,
} from 'lucide-react';
//import { LoginPage } from '../pages/AuthPages';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage, fetchPublicBooks } from '../api/client';
import type { Book, BookCategory } from '../types';

const categories: Array<{ label: string; value?: BookCategory }> = [
  { label: 'Tất cả sách' },
  { label: 'Sách điện tử', value: 'ebook' },
  { label: 'Truyện tranh', value: 'comic' },
  { label: 'Sách nói', value: 'audiobook' },
  { label: 'Truyện dài kỳ', value: 'webnovel' },
];

const heroSlides = [
  {
    eyebrow: 'Dành cho người yêu sách',
    title: <>Sách tốt<br />dành cho bạn.</>,
    description: 'Khám phá những câu chuyện mới, tuyển tập nổi bật và không gian đọc dành riêng cho bạn.',
    action: 'Khám phá sách',
  },
  {
    eyebrow: 'Mở ra một thế giới mới',
    title: <>Mỗi trang sách<br />một hành trình.</>,
    description: 'Tìm cảm hứng mỗi ngày với những đầu sách được chọn lọc từ thư viện OpenBook.',
    action: 'Xem thư viện',
  },
  {
    eyebrow: 'Đọc theo cách của bạn',
    title: <>Tri thức luôn<br />ở bên bạn.</>,
    description: 'Sách điện tử, truyện tranh và sách nói — chọn thể loại bạn yêu thích và bắt đầu.',
    action: 'Bắt đầu đọc',
  },
];

// Hàm ReaderHome: Dựng trang chủ độc giả theo mẫu với thanh thông báo, điều hướng, banner và kệ sách ngang.
export function ReaderHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const shelfRef = useRef<HTMLElement>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<BookCategory | undefined>();
  const [slide, setSlide] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [search, category]);

  useEffect(() => {
    let active = true;
    if (page === 1) {
      setLoading(true);
      setLoadingMore(false);
    }
    else setLoadingMore(true);
    setError('');
    fetchPublicBooks(search, category, page)
      .then((result) => {
        if (!active) return;
        setBooks((current) => page === 1 ? result.books : [...current, ...result.books]);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => {
        if (!active) return;
        if (page === 1) setLoading(false);
        setLoadingMore(false);
      });
    return () => { active = false; };
  }, [search, category, page]);

  // Hàm handleLogout: Kết thúc phiên độc giả rồi trở về trang thư viện công khai.
  async function handleLogout() {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (logoutError) {
      setError(errorMessage(logoutError));
    }
  }

  // Hàm submitSearch: Áp dụng từ khóa nhập trong thanh tìm kiếm trên cùng.
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setSearchOpen(false);
    shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Hàm changeSlide: Chuyển nội dung banner theo vòng lặp khi người đọc chọn mũi tên hoặc chấm trang.
  function changeSlide(direction: number) {
    setSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);
  }

  // Hàm scrollShelf: Cuộn ngang kệ sách theo một nhóm bìa sách nhỏ.
  function scrollShelf(direction: number) {
    shelfRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  }

  const activeSlide = heroSlides[slide];
  const featuredBooks = books.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#202b28]">
      <div className="bg-[#f4f6f2] text-[#31564a]">
        <div className="mx-auto flex min-h-8 max-w-[1440px] items-center justify-center gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.1em] sm:text-xs">
          <BookOpen size={13} />
          <span>OpenBook — mỗi ngày mở ra một thế giới mới</span>
          <a className="ml-2 inline-flex items-center gap-1 text-[#203a34] underline underline-offset-2" href="#book-shelf">
            Khám phá ngay <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-5 px-4 sm:px-7">
          <Link className="flex shrink-0 items-center gap-2.5" to="/">
            <span className="grid h-9 w-9 place-items-center bg-[#203a34] text-white"><BookOpen size={19} /></span>
            <span className="text-lg font-black tracking-[0.1em] text-[#203a34]">OPENBOOK</span>
          </Link>
          <nav aria-label="Danh mục sách" className="hidden min-w-0 flex-1 items-center justify-center gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex">
            {categories.map((item) => (
              <button
                aria-pressed={category === item.value}
                className={`shrink-0 rounded-md border-b-2 px-2 py-2 text-xs font-semibold transition-colors ${
                  category === item.value ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-600 hover:text-[#31564a]'
                }`}
                key={item.label}
                onClick={() => {
                  setCategory(item.value);
                  shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm sách'}
              className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
              onClick={() => setSearchOpen((open) => !open)}
              type="button"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            <Link className="hidden px-2 text-xs font-semibold text-slate-600 hover:text-[#203a34] sm:inline-flex" to="/support">Hỗ trợ</Link>
            {user ? (
              <>
                {user.role === 'ADMIN'
                  ? <Link className="hidden items-center gap-1.5 px-2 text-xs font-semibold text-[#567160] sm:inline-flex" to="/admin/dashboard"><Crown size={14} /> Quản trị</Link>
                  : <span className="hidden items-center gap-1.5 px-2 text-xs font-semibold text-[#567160] sm:inline-flex"><Crown size={14} /> Độc giả</span>}
                <span className="hidden items-center gap-1.5 px-2 text-xs text-slate-600 xl:inline-flex"><UserRound size={14} />{user.name}</span>
                <Link className="button-secondary !min-h-9 !px-3 !py-2" to="/account">Tài khoản</Link>
                <button className="button-secondary !min-h-9 !px-3 !py-2" onClick={() => void handleLogout()} type="button">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link className="hidden rounded-md px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#203a34] sm:inline-flex" to="/login">Đăng nhập</Link>
                <Link className="button-primary !min-h-9 !px-3 !py-2" to="/register">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
        {searchOpen ? (
          <form className="border-t border-slate-100 bg-white px-4 py-3 sm:px-7" onSubmit={submitSearch}>
            <div className="mx-auto flex max-w-[1440px] gap-2">
              <input
                aria-label="Tìm theo tên sách hoặc tác giả"
                autoFocus
                className="form-input h-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên sách hoặc tác giả"
                value={searchInput}
              />
              <button className="button-primary !min-h-10" type="submit">Tìm sách</button>
            </div>
          </form>
        ) : null}
        <nav aria-label="Danh mục sách trên điện thoại" className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
          {categories.map((item) => (
            <button
              className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${category === item.value ? 'bg-[#f1f4ef] text-[#203a34]' : 'text-slate-500'}`}
              key={item.label}
              onClick={() => setCategory(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <section aria-label="Giới thiệu OpenBook" className="relative overflow-hidden border-b border-slate-200 bg-[#fbfcfa]">
          <div className="mx-auto grid min-h-[390px] max-w-[1440px] lg:min-h-[440px] lg:grid-cols-2">
            <div className="relative z-10 flex flex-col justify-center px-6 py-12 text-center sm:px-12 lg:px-16 lg:text-left xl:px-24">
              <p className="eyebrow">{activeSlide.eyebrow}</p>
              <h1 className="mt-4 font-serif text-5xl font-semibold italic leading-[0.98] tracking-[-0.055em] text-[#203a34] sm:text-6xl xl:text-7xl">
                {activeSlide.title}
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-slate-600 lg:mx-0">
                {activeSlide.description}
              </p>
              <div className="mt-7 flex justify-center lg:justify-start">
                <a className="button-primary !rounded-md" href="#book-shelf">
                  {activeSlide.action}<ArrowRight size={15} />
                </a>
              </div>
            </div>

            <div className="relative hidden min-h-[380px] items-center justify-center overflow-hidden bg-[#f1f4ef] lg:flex">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_45%,rgba(186,202,183,0.55),transparent_58%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 border-t border-white/80 bg-white/55" />
              <div className="absolute right-[12%] top-[14%] h-28 w-28 border border-[#c9d5c8]" />
              <div className="absolute right-[16%] top-[19%] h-28 w-28 border border-[#d7e0d5]" />
              {featuredBooks.length ? (
                <div className="relative z-10 flex h-[300px] items-end justify-center">
                  {featuredBooks.map((book, index) => (
                    <Link
                      aria-label={`Xem sách ${book.title}`}
                      className={`absolute bottom-0 block w-[145px] border border-white bg-white p-2 shadow-[0_18px_40px_rgba(32,58,52,0.16)] transition-transform hover:-translate-y-2 ${
                        index === 0 ? '-translate-x-[118px] rotate-[-12deg]' : index === 2 ? 'translate-x-[118px] rotate-[12deg]' : 'z-10'
                      }`}
                      key={book._id}
                      style={{ height: index === 1 ? 280 : 238, left: 'calc(50% - 72.5px)' }}
                      to={`/books/${encodeURIComponent(book._id)}`}
                    >
                      <img
                        alt=""
                        className="h-full w-full border border-slate-100 object-cover"
                        onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                        src={book.cover_url || '/book-cover-placeholder.svg'}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div aria-hidden="true" className="relative z-10 grid h-64 w-80 place-items-center">
                  <div className="absolute bottom-7 h-5 w-72 border-y border-[#c8d3c7] bg-white" />
                  <svg className="relative mb-8 h-52 w-64" fill="none" viewBox="0 0 256 208">
                    <path d="M128 55C96 32 59 32 25 43v116c36-12 70-9 103 15V55Z" fill="#fff" stroke="#31564a" strokeWidth="3" />
                    <path d="M128 55c32-23 69-23 103-12v116c-36-12-70-9-103 15V55Z" fill="#eef3ed" stroke="#31564a" strokeWidth="3" />
                    <path d="M128 55v119M43 68c23-5 43-3 62 5M43 87c23-5 43-3 62 5M43 106c23-5 43-3 62 5M151 68c23-5 43-3 62 5m-62 14c23-5 43-3 62 5m-62 14c23-5 43-3 62 5" stroke="#9aab9c" strokeWidth="2" />
                    <path d="m70 33 9-20 9 20m78 2 9-22 9 22" stroke="#c69b55" strokeWidth="3" />
                  </svg>
                </div>
              )}
              <span className="absolute right-8 top-8 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#567160]">
                OPENBOOK<br /><span className="font-normal text-slate-500">Digital library</span>
              </span>
            </div>
          </div>
          <button
            aria-label="Banner trước"
            className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-[#31564a] hover:bg-white sm:left-6"
            onClick={() => changeSlide(-1)}
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Banner tiếp theo"
            className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/90 text-[#31564a] hover:bg-white sm:right-6"
            onClick={() => changeSlide(1)}
            type="button"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 lg:bottom-5 lg:left-auto lg:right-12 lg:translate-x-0">
            {heroSlides.map((item, index) => (
              <button
                aria-label={`Hiển thị banner ${index + 1}`}
                aria-pressed={slide === index}
                className={`h-2 rounded-full transition-all ${slide === index ? 'w-6 bg-[#31564a]' : 'w-2 bg-slate-300'}`}
                key={item.eyebrow}
                onClick={() => setSlide(index)}
                type="button"
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-7 sm:pt-10" id="book-shelf" ref={shelfRef}>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Thư viện OpenBook</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#27342e] sm:text-xl">
                {category ? categories.find((item) => item.value === category)?.label : 'Sách mới mỗi ngày — Dành cho bạn!'}
              </h2>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <button aria-label="Cuộn kệ sách sang trái" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={() => scrollShelf(-1)} type="button">
                <ChevronLeft size={16} />
              </button>
              <button aria-label="Cuộn kệ sách sang phải" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={() => scrollShelf(1)} type="button">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {error ? <p className="mb-4 border-l-2 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}
          {loading ? <p className="py-12 text-center text-sm text-slate-500">Đang tải danh mục sách…</p>
            : books.length ? (
              <>
                <div className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
                  {books.map((book) => (
                    <Link
                      className="group relative w-[126px] shrink-0 snap-start border border-slate-200 bg-white p-2 transition-colors hover:border-[#8da798] sm:w-[138px]"
                      key={book._id}
                      to={`/books/${encodeURIComponent(book._id)}`}
                    >
                      {book.access_level !== 'free' ? (
                        <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 border border-[#ebd29b] bg-[#fff6df] px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-[#805e1e]">
                          <Crown size={10} /> Hội viên
                        </span>
                      ) : null}
                      <img
                        alt={`Bìa sách ${book.title}`}
                        className="h-[154px] w-full border border-slate-100 bg-slate-50 object-cover sm:h-[170px]"
                        onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                        src={book.cover_url || '/book-cover-placeholder.svg'}
                      />
                      <h3 className="mt-2 line-clamp-2 min-h-9 text-xs font-bold leading-4 text-[#26332e] group-hover:text-[#31564a]">
                        {book.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{book.author_name}</p>
                    </Link>
                  ))}
                </div>
                {page < totalPages && <button className="button-secondary mt-3" disabled={loadingMore} onClick={() => setPage((current) => current + 1)} type="button">{loadingMore ? 'Đang tải…' : 'Tải thêm sách'}</button>}
              </>
            ) : (
              <div className="border border-slate-200 bg-white px-5 py-10 text-center">
                <BookOpen className="mx-auto text-slate-300" size={28} />
                <p className="mt-3 text-sm text-slate-500">
                  {search ? 'Không tìm thấy sách phù hợp. Hãy thử từ khóa khác.' : 'Thư viện đang cập nhật sách mới.'}
                </p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
