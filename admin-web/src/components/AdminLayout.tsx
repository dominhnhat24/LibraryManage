import { BookOpen, LayoutDashboard, LogOut, UserRound, Users, CreditCard, AlertCircle, MessageSquareText, Search, Bell, ChevronDown, Settings, BookText } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';

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
export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      window.alert(errorMessage(error));
    }
  }

  const mainNav = [
    { to: '/admin/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
    { to: '/admin/books', label: 'Sách', Icon: BookOpen },
    { to: '/admin/chapters', label: 'Chương', Icon: BookText },
    { to: '/admin/users', label: 'Người dùng', Icon: Users },
    { to: '/admin/subscriptions', label: 'Thuê bao', Icon: CreditCard },
    { to: '/admin/reports', label: 'Báo cáo', Icon: AlertCircle },
  ];

  const bottomNav = [
    { to: '/admin/comments', label: 'Cài đặt', Icon: Settings },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
      isActive
        ? 'bg-[#E3F4EB] text-[#24795C]'
        : 'text-[#526B86] hover:bg-[#f0f7f3] hover:text-[#24795C]'
    }`;

  return (
    <div className="min-h-screen bg-[#F5FAF8]">
      {/* ─── TOPBAR ─── */}
      <header
        className="fixed inset-x-0 top-0 z-30 flex h-[76px] items-center border-b border-[#DDE9E6] bg-white px-6"
      >
        {/* Brand – left 256 px */}
        <div className="flex w-[256px] shrink-0 items-center gap-3 pr-6">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#24795C] text-white">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[20px] font-bold leading-tight text-[#24795C]">OpenBook</p>
            <p className="text-[11px] font-medium text-[#526B86]">Read More · Grow More</p>
          </div>
        </div>

        {/* Separator */}
        <div className="mr-6 h-10 w-px bg-[#DDE9E6]" />

        {/* Search */}
        <div className="relative mr-auto w-full max-w-[548px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#97A8B8]" size={16} />
          <input
            className="h-[39px] w-full rounded-full border border-[#DDE9E6] bg-white pl-11 pr-4 text-[13px] text-[#202b28] placeholder-[#97A8B8] outline-none transition-colors focus:border-[#24795C]"
            placeholder="Tìm kiếm sách, tác giả, người dùng..."
            type="search"
          />
        </div>

        {/* Right controls */}
        <div className="ml-6 flex items-center gap-4">
          {/* Bell */}
          <button className="relative rounded-full p-2 text-[#526B86] hover:bg-[#f0f7f3]" type="button">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Separator */}
          <div className="h-8 w-px bg-[#DDE9E6]" />

          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#E3F4EB] text-[#24795C]">
              <UserRound size={18} />
            </span>
            <div className="max-w-[140px]">
              <p className="truncate text-[13px] font-semibold text-[#153D31]">{user?.name ?? 'Admin'}</p>
              <p className="text-[11px] text-[#526B86]">Quản trị viên</p>
            </div>
            <ChevronDown size={16} className="text-[#526B86]" />
          </div>
        </div>
      </header>

      {/* ─── SIDEBAR ─── */}
      <aside
        className="fixed bottom-0 left-0 top-[76px] z-20 flex w-[256px] flex-col overflow-y-auto border-r border-[#DDE9E6] bg-white"
      >
        <nav className="flex flex-1 flex-col gap-1 px-4 pt-5">
          {mainNav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
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
          {/* Decorative book illustration (SVG) */}
          <div className="mb-3 flex justify-center">
            <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Stack of books */}
              <rect x="20" y="55" width="100" height="14" rx="3" fill="#B8E0CC" />
              <rect x="25" y="42" width="90" height="14" rx="3" fill="#8FD1AF" />
              <rect x="30" y="29" width="80" height="14" rx="3" fill="#5BBF8A" />
              {/* Leaf */}
              <path d="M85 10 C95 5, 110 15, 100 30 C90 20, 85 15, 85 10Z" fill="#24795C" opacity="0.7" />
              <path d="M85 10 C85 20, 90 25, 100 30" stroke="#24795C" strokeWidth="1" fill="none" opacity="0.5" />
              {/* Small leaf */}
              <path d="M75 18 C80 12, 90 18, 82 28 C78 22, 75 20, 75 18Z" fill="#57A982" opacity="0.5" />
            </svg>
          </div>
          <p className="text-center text-[16px] font-bold text-[#24795C]">OpenBook</p>
          <p className="mt-1 text-center text-[12px] leading-relaxed text-[#526B86]">
            Knowledge is the key<br />to a brighter future
          </p>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="ml-[256px] min-h-screen pt-[76px]">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}