// Import { useEffect, useRef, useState, type FormEvent, type ReactNode } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/AdminLayout.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
// Import { BookOpen, LayoutDashboard, LogOut, UserRound, Users, CreditCard, AlertCircle,  từ lucide-react để dùng trong giao diện.
import { BookOpen, LayoutDashboard, LogOut, UserRound, Users, CreditCard, AlertCircle, MessageSquareText, Search, Bell, ChevronDown, BookText, BookDown } from 'lucide-react';
// Import { NavLink, useNavigate } từ react-router-dom để dùng trong giao diện.
import { NavLink, useNavigate } from 'react-router-dom';
// Import { errorMessage, fetchBooks, fetchUsers } từ ../api/client để dùng trong giao diện.
import { errorMessage, fetchBooks, fetchUsers } from '../api/client';
// Import type { Book, User } từ ../types để dùng trong giao diện.
import type { Book, User } from '../types';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';

/**
 * AdminLayout – Two‑column layout: fixed sidebar (256 px) + topbar (76 px).
 *
 * Design tokens:
 *   Page background : #F5FAF8
 *   Surface (white)  : #FFFFFF
 *   Primary green    : #24795C
 *   Dark green       : #153D31
 *   Mint             : #E3F4EB
 *   Border           : #DDE9E6
 *   Text secondary   : #526B86
 */
/**
 * Hàm/thành phần AdminLayout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { children }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, useEffect, trim, setBookMatches, setUserMatches, setSearchError.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  // Biến { user, logout } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, logout } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến searchBoxRef nhận giá trị từ useRef<HTMLDivElement | null>(null). const không gán lại; let có thể cập nhật.
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  // Biến [globalSearch, setGlobalSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [globalSearch, setGlobalSearch] = useState('');
  // Biến [searchOpen, setSearchOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [searchOpen, setSearchOpen] = useState(false);
  // Biến [searchLoading, setSearchLoading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [searchLoading, setSearchLoading] = useState(false);
  // Biến [searchError, setSearchError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [searchError, setSearchError] = useState('');
  // Biến [bookMatches, setBookMatches] nhận giá trị từ useState<Book[]>([]). const không gán lại; let có thể cập nhật.
  const [bookMatches, setBookMatches] = useState<Book[]>([]);
  // Biến [userMatches, setUserMatches] nhận giá trị từ useState<User[]>([]). const không gán lại; let có thể cập nhật.
  const [userMatches, setUserMatches] = useState<User[]>([]);
  // Biến [profileOpen, setProfileOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [profileOpen, setProfileOpen] = useState(false);

  // Tìm sách/tác giả và tài khoản thật qua API quản trị khi người dùng nhập từ khóa.
  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { const query = globalSearch.trim(); if (query.length < 2) { set
  useEffect(() => {
    // Biến query nhận giá trị từ globalSearch.trim(). const không gán lại; let có thể cập nhật.
    const query = globalSearch.trim();
    // if chỉ chạy nhánh này khi điều kiện query.length < 2 đúng.
    if (query.length < 2) {
      // Gọi/thực thi setBookMatches với đối số để cập nhật logic/giao diện: setBookMatches([])
      setBookMatches([]);
      // Gọi/thực thi setUserMatches với đối số để cập nhật logic/giao diện: setUserMatches([])
      setUserMatches([]);
      // Gọi/thực thi setSearchError với đối số để cập nhật logic/giao diện: setSearchError('')
      setSearchError('');
      // Gọi/thực thi setSearchLoading với đối số để cập nhật logic/giao diện: setSearchLoading(false)
      setSearchLoading(false);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }

    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Biến timer nhận giá trị từ window.setTimeout(async () => { setSearchLoading(true);. const không gán lại; let có thể cập nhật.
    const timer = window.setTimeout(async () => {
      // Gọi/thực thi setSearchLoading với đối số để cập nhật logic/giao diện: setSearchLoading(true)
      setSearchLoading(true);
      // Gọi/thực thi setSearchError với đối số để cập nhật logic/giao diện: setSearchError('')
      setSearchError('');
      // Biến results nhận giá trị từ await Promise.allSettled([ fetchBooks({ page: 1, limit:. const không gán lại; let có thể cập nhật.
      const results = await Promise.allSettled([
        fetchBooks({ page: 1, limit: 5, search: query }),
        fetchUsers({ page: 1, limit: 5, search: query }),
      ]);
      // if chỉ chạy nhánh này khi điều kiện !active đúng.
      if (!active) return;
      // if chỉ chạy nhánh này khi điều kiện results[0].status === 'fulfilled' đúng.
      if (results[0].status === 'fulfilled') setBookMatches(results[0].value.books);
      else setBookMatches([]);
      // if chỉ chạy nhánh này khi điều kiện results[1].status === 'fulfilled' đúng.
      if (results[1].status === 'fulfilled') setUserMatches(results[1].value.users);
      else setUserMatches([]);
      // if chỉ chạy nhánh này khi điều kiện results.every((result) => result.status === 'rejected') đúng.
      if (results.every((result) => result.status === 'rejected')) {
        // Gọi/thực thi setSearchError với đối số để cập nhật logic/giao diện: setSearchError(errorMessage(results[0].status === 'rejected' ? results[0].reason
        setSearchError(errorMessage(results[0].status === 'rejected' ? results[0].reason : (results[1] as PromiseRejectedResult).reason));
      }
      // Gọi/thực thi setSearchLoading với đối số để cập nhật logic/giao diện: setSearchLoading(false)
      setSearchLoading(false);
    }, 300);

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; window.clearTimeout(timer); }.
    return () => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
      active = false;
      // Gọi/thực thi window.clearTimeout với đối số để cập nhật logic/giao diện: window.clearTimeout(timer)
      window.clearTimeout(timer);
    };
  }, [globalSearch]);

  /**
   * Hàm/thành phần runGlobalSearch: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: trim, setSearchOpen, navigate, encodeURIComponent.
   */
  function runGlobalSearch() {
    // Biến query nhận giá trị từ globalSearch.trim(). const không gán lại; let có thể cập nhật.
    const query = globalSearch.trim();
    // if chỉ chạy nhánh này khi điều kiện !query đúng.
    if (!query) return;
    // Gọi/thực thi setSearchOpen với đối số để cập nhật logic/giao diện: setSearchOpen(false)
    setSearchOpen(false);
    // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/admin/books?search=${encodeURIComponent(query)}`)
    navigate(`/admin/books?search=${encodeURIComponent(query)}`);
  }

  /**
   * Hàm/thành phần submitGlobalSearch: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, runGlobalSearch.
   */
  function submitGlobalSearch(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi runGlobalSearch với đối số để cập nhật logic/giao diện: runGlobalSearch()
    runGlobalSearch();
  }

  /**
   * Hàm/thành phần openSearchResult: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: path.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSearchOpen, setGlobalSearch, navigate.
   */
  function openSearchResult(path: string) {
    // Gọi/thực thi setSearchOpen với đối số để cập nhật logic/giao diện: setSearchOpen(false)
    setSearchOpen(false);
    // Gọi/thực thi setGlobalSearch với đối số để cập nhật logic/giao diện: setGlobalSearch('')
    setGlobalSearch('');
    // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(path)
    navigate(path);
  }


  /**
   * Hàm/thành phần handleLogout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: logout, navigate, alert, errorMessage.
   * Được tham chiếu tại: admin-web/src/components/ReaderShell.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
   */
  async function handleLogout() {
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await logout()
      await logout();
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/admin/login', { replace: true })
      navigate('/admin/login', { replace: true });
    } catch (error) {
      // Gọi/thực thi window.alert với đối số để cập nhật logic/giao diện: window.alert(errorMessage(error))
      window.alert(errorMessage(error));
    }
  }

  // Biến mainNav nhận giá trị từ [ { to: '/admin/dashboard', label: 'Tổng quan', Icon: L. const không gán lại; let có thể cập nhật.
  const mainNav = [
    { to: '/admin/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
    { to: '/admin/books', label: 'Sách', Icon: BookOpen },
    { to: '/admin/books/import', label: 'Import ebook', Icon: BookDown },
    { to: '/admin/chapters', label: 'Chương', Icon: BookText },
    { to: '/admin/users', label: 'Người dùng', Icon: Users },
    { to: '/admin/subscriptions', label: 'Thuê bao', Icon: CreditCard },
    { to: '/admin/reports', label: 'Báo cáo', Icon: AlertCircle },
  ];

  // Biến bottomNav nhận giá trị từ [ { to: '/admin/comments', label: 'Bình luận', Icon: Me. const không gán lại; let có thể cập nhật.
  const bottomNav = [
    { to: '/admin/comments', label: 'Bình luận', Icon: MessageSquareText },
  ];

  /**
   * Hàm/thành phần linkClass: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: { isActive }.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   */
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
      isActive
        ? 'bg-[#E3F4EB] text-[#24795C]'
        : 'text-[#526B86] hover:bg-[#f0f7f3] hover:text-[#24795C]'
    }`;

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="min-h-screen bg-[#F5FAF8]"> {} <header className="fixed inset-.
  return (
    <div className="min-h-screen bg-[#F5FAF8]">
      {/* ─── TOPBAR ─── */}
      <header
        className="fixed inset-x-0 top-0 z-30 flex h-[76px] items-center border-b border-[#DDE9E6] bg-white px-3 sm:px-6"
      >
        {/* Brand – left 256 px */}
        <div aria-hidden="true" className="w-[154px] shrink-0 pr-2 sm:w-[220px] sm:pr-6 lg:w-[256px]" />

        {/* Separator */}
        <div className="mr-3 hidden h-10 w-px bg-[#DDE9E6] lg:mr-6 lg:block" />

        {/* Global search backed by the admin book and user APIs. */}
        <div ref={searchBoxRef} className="relative mr-auto min-w-0 flex-1 lg:max-w-[548px]">
          <form onSubmit={submitGlobalSearch}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#97A8B8]" size={16} />
            <input
              aria-label="Tìm sách, tác giả hoặc người dùng"
              aria-expanded={searchOpen && globalSearch.trim().length >= 2}
              className="h-[39px] w-full rounded-full border border-[#DDE9E6] bg-white pl-11 pr-4 text-[13px] text-[#153D31] placeholder-[#97A8B8] outline-none transition-colors focus:border-[#24795C]"
              onChange={(event) => { setGlobalSearch(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); }}
              placeholder="Tìm kiếm sách, tác giả, người dùng..."
              type="search"
              value={globalSearch}
            />
          </form>
          {searchOpen && globalSearch.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[46px] z-50 max-h-[420px] overflow-y-auto rounded-xl border border-[#DDE9E6] bg-white p-2 shadow-[0_12px_36px_rgba(21,61,49,0.14)]">
              {searchLoading ? <p className="px-3 py-4 text-xs text-[#526B86]">Đang tìm kiếm trên hệ thống...</p> : searchError ? <p className="px-3 py-4 text-xs text-rose-700">{searchError}</p> : (
                <>
                  {bookMatches.length > 0 && <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#97A8B8]">Sách</p>}
                  {bookMatches.map((book) => (
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F5FAF8]" key={book._id} onClick={() => openSearchResult(`/admin/books?search=${encodeURIComponent(globalSearch.trim())}`)} type="button">
                      <BookOpen size={16} className="shrink-0 text-[#24795C]" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#153D31]">{book.title}</span><span className="block truncate text-[11px] text-[#526B86]">{book.author_name}</span></span>
                    </button>
                  ))}
                  {userMatches.length > 0 && <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-[#97A8B8]">Người dùng</p>}
                  {userMatches.map((item) => (
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F5FAF8]" key={item._id ?? item.id} onClick={() => openSearchResult(`/admin/users?search=${encodeURIComponent(globalSearch.trim())}`)} type="button">
                      <UserRound size={16} className="shrink-0 text-[#24795C]" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#153D31]">{item.name}</span><span className="block truncate text-[11px] text-[#526B86]">{item.email}</span></span>
                    </button>
                  ))}
                  {!bookMatches.length && !userMatches.length && <p className="px-3 py-4 text-xs text-[#526B86]">Không tìm thấy sách hoặc người dùng phù hợp.</p>}
                  <button className="mt-1 w-full rounded-lg border-t border-[#EEF3F0] px-3 py-3 text-left text-xs font-semibold text-[#24795C] hover:bg-[#F8FBF9]" onClick={runGlobalSearch} type="button">Xem kết quả đầy đủ cho “{globalSearch.trim()}”</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="ml-2 flex shrink-0 items-center gap-2 sm:ml-6 sm:gap-3">
          <button aria-label="Mở báo cáo cần xử lý" className="rounded-full p-2 text-[#526B86] hover:bg-[#F0F7F3]" onClick={() => navigate('/admin/reports')} title="Mở báo cáo cần xử lý" type="button">
            <Bell size={20} />
          </button>
          <div className="h-8 w-px bg-[#DDE9E6]" />
          <div className="relative">
            <button aria-expanded={profileOpen} className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-[#F8FBF9]" onClick={() => setProfileOpen((open) => !open)} type="button">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#E3F4EB] text-[#24795C]"><UserRound size={18} /></span>
              <span className="hidden max-w-[140px] sm:block"><span className="block truncate text-[13px] font-semibold text-[#153D31]">{user?.name ?? 'Admin'}</span><span className="block text-[11px] text-[#526B86]">Quản trị viên</span></span>
              <ChevronDown size={16} className="text-[#526B86]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[48px] z-50 w-56 rounded-xl border border-[#DDE9E6] bg-white p-2 shadow-[0_12px_36px_rgba(21,61,49,0.14)]">
                <div className="border-b border-[#EEF3F0] px-3 py-2"><p className="truncate text-xs font-semibold text-[#153D31]">{user?.name ?? 'Admin'}</p><p className="mt-1 truncate text-[11px] text-[#526B86]">{user?.email ?? ''}</p></div>
                <button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => { setProfileOpen(false); void handleLogout(); }} type="button"><LogOut size={15} /> Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── SIDEBAR ─── */}
      <aside
        className="fixed bottom-0 left-0 top-[76px] z-20 hidden w-[256px] flex-col overflow-y-auto border-r border-[#DDE9E6] bg-white lg:flex"
      >
        <nav className="flex flex-1 flex-col gap-1 px-4 pt-5">
          {mainNav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/admin/books'} className={linkClass}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-[#DDE9E6]" />

          {bottomNav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-[#526B86] transition-colors hover:bg-[#f0f7f3] hover:text-[#24795C]"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </nav>

        {/* Bottom illustration area */}
        <div className="mt-auto px-5 pb-6">
          <div className="mb-3 flex justify-center"><img src="/HarveyBook-gold.png" alt="HarveyBook" className="harveybook-logo h-[90px] w-[140px] object-contain" /></div>
          <p className="mt-1 text-center text-[12px] leading-relaxed text-[#526B86]">
            Knowledge is the key<br />to a brighter future
          </p>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="ml-0 min-h-screen pt-[76px] lg:ml-[256px]">
        <div className="px-3 py-4 sm:p-6">
          <nav aria-label="Điều hướng quản trị trên thiết bị nhỏ" className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {mainNav.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/admin/books'} className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isActive ? 'border-[#C3E5D0] bg-[#E3F4EB] text-[#24795C]' : 'border-[#DDE9E6] bg-white text-[#526B86]'}`}>
                <Icon size={15} />{label}
              </NavLink>
            ))}
            <NavLink to="/admin/comments" className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isActive ? 'border-[#C3E5D0] bg-[#E3F4EB] text-[#24795C]' : 'border-[#DDE9E6] bg-white text-[#526B86]'}`}><MessageSquareText size={15} />Bình luận</NavLink>
          </nav>
          {children}
        </div>
      </main>
    </div>
  );
}
