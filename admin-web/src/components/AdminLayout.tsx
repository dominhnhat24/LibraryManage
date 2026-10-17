import { 
  BookOpen, BookText, CreditCard, LayoutDashboard, LibraryBig, 
  LogOut, MessageSquareText, UserRound, Users, AlertCircle 
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';

// Hàm AdminLayout: Tạo khung quản trị góc vuông với điều hướng thư viện và khu vực phiên ADMIN.
export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hàm handleLogout: Thu hồi phiên rồi chuyển quản trị viên về màn hình đăng nhập.
  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      window.alert(errorMessage(error));
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-[#202b28]">
      <header className="sticky top-0 z-30 border-b border-[#deddd6] bg-[#fbfaf7]">
        <div className="flex min-h-[72px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3.5">
            <span className="grid h-10 w-10 place-items-center bg-[#203a34] text-[#faf9f5]"><BookOpen size={21} /></span>
            <div>
              <p className="text-[15px] font-extrabold tracking-[0.12em] text-[#203a34]">OPENBOOK</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Digital Library System</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-2 border border-[#e4e2da] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#496a55] sm:inline-flex">
              <span className="h-1.5 w-1.5 bg-[#6a9277]" /> Administrator
            </span>
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-9 w-9 place-items-center border border-[#e2e0d8] bg-[#f1f0ea] text-[#4d6257]"><UserRound size={16} /></span>
              <div className="max-w-40">
                <p className="truncate text-xs font-bold">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button className="button-secondary !min-h-9 !px-3 !py-2" onClick={handleLogout} type="button">
              <LogOut size={15} /><span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Thanh Menu Sidebar / Navigation */}
      <nav aria-label="Quản trị thư viện" className="border-b border-[#deddd6] bg-[#fbfaf7]">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12">
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            end
            to="/admin/dashboard"
          >
            <LayoutDashboard size={15} /> Tổng quan
          </NavLink>
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/books"
          >
            <BookOpen size={15} /> Quản lý sách
          </NavLink>
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/chapters"
          >
            <BookText size={15} /> Quản lý chương
          </NavLink>
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/users"
          >
            <Users size={15} /> Người dùng
          </NavLink>
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/subscriptions"
          >
            <CreditCard size={15} /> Thuê bao
          </NavLink>
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/reports"
          >
            <AlertCircle size={15} /> Báo cáo
          </NavLink>
          {/* Thêm mục Bình luận & Đánh giá vào menu điều hướng */}
          <NavLink
            className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'border-[#31564a] text-[#203a34]' : 'border-transparent text-slate-500 hover:text-[#203a34]'
            }`}
            to="/admin/comments"
          >
            <MessageSquareText size={15} /> Bình luận & Đánh giá
          </NavLink>
        </div>
      </nav>

      <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-7 sm:px-8 sm:pt-9 lg:px-12">
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <LibraryBig size={14} />
          <span>Quản trị hệ thống</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-[#31564a]">
            {location.pathname === '/admin' || location.pathname === '/admin/dashboard' ? 'Tổng quan'
              : location.pathname.startsWith('/admin/chapters') ? 'Quản lý chương'
              : location.pathname.startsWith('/admin/users') ? 'Người dùng'
              : location.pathname.startsWith('/admin/subscriptions') ? 'Thuê bao'
              : location.pathname.startsWith('/admin/reports') ? 'Báo cáo'
              : location.pathname.startsWith('/admin/comments') ? 'Bình luận & Đánh giá' : 'Quản lý sách'}
          </span>
        </div>
        {children}
      </main>

      <footer className="border-t border-[#e1dfd8] px-4 py-4 text-center text-[10px] font-medium tracking-wide text-slate-400">
        OPENBOOK LIBRARY MANAGEMENT · ADMIN CONSOLE
      </footer>
    </div>
  );
}