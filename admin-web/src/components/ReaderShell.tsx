// Import { useState, type ReactNode, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ReaderShell.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useState, type ReactNode, type FormEvent } from 'react';
// Import { Crown, LogOut, Search, Settings, LifeBuoy } từ lucide-react để dùng trong giao diện.
import { Crown, LogOut, Search, Settings, LifeBuoy } from 'lucide-react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import module từ ../reader-ui.css để dùng trong giao diện.
import '../reader-ui.css';
// Import { ReaderSidebar } từ ./ReaderSidebar để dùng trong giao diện.
import { ReaderSidebar } from './ReaderSidebar';
// Import { ReaderNotifications } từ ./ReaderNotifications để dùng trong giao diện.
import { ReaderNotifications } from './ReaderNotifications';

/**
 * Hàm/thành phần ReaderShell: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { children, title, subtitle, searchValue.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, getItem, submitSearch, preventDefault, trim, onSearchSubmit.
 */
export function ReaderShell({ children, title, subtitle, searchValue = '', onSearchChange, onSearchSubmit, hideSearch = false }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  hideSearch?: boolean;
}) {
  // Biến { user, logout } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, logout } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [isSidebarCollapsed, setIsSidebarCo nhận giá trị từ useState(() => localStorage.getItem('reader-sidebar-col. const không gán lại; let có thể cập nhật.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('reader-sidebar-collapsed') === 'true');
  // Biến [localSearch, setLocalSearch] nhận giá trị từ useState(searchValue). const không gán lại; let có thể cập nhật.
  const [localSearch, setLocalSearch] = useState(searchValue);
  // Biến [menuOpen, setMenuOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * Hàm/thành phần submitSearch: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, trim, onSearchSubmit, navigate, encodeURIComponent.
   */
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Biến q nhận giá trị từ (onSearchChange ? searchValue : localSearch).trim(). const không gán lại; let có thể cập nhật.
    const q = (onSearchChange ? searchValue : localSearch).trim();
    // if chỉ chạy nhánh này khi điều kiện onSearchSubmit đúng.
    if (onSearchSubmit) onSearchSubmit(q);
    else navigate(q ? `/library?search=${encodeURIComponent(q)}` : '/library');
  }
  /**
   * Hàm/thành phần handleLogout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: logout, navigate.
   * Được tham chiếu tại: admin-web/src/components/AdminLayout.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
   */
  async function handleLogout() { await logout(); navigate('/', { replace: true }); }
  // Biến currentSearch nhận giá trị từ onSearchChange ? searchValue : localSearch. const không gán lại; let có thể cập nhật.
  const currentSearch = onSearchChange ? searchValue : localSearch;
  // Biến initials nhận giá trị từ user?.name?.trim().slice(0, 1).toUpperCase() || 'A'. const không gán lại; let có thể cập nhật.
  const initials = user?.name?.trim().slice(0, 1).toUpperCase() || 'A';

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="booknest-home reader-shared-home"> <section className="booknest-.
  return <div className="booknest-home reader-shared-home">
    <section className="booknest-book">
      <ReaderSidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => {
        // Biến next nhận giá trị từ !prev. const không gán lại; let có thể cập nhật.
        const next = !prev;
        // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('reader-sidebar-collapsed', String(next))
        localStorage.setItem('reader-sidebar-collapsed', String(next));
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: next.
        return next;
      })} />
      <div className="reader-main">
        <header className="reader-topbar">
          {!hideSearch && <form className="reader-search" onSubmit={submitSearch} role="search"><Search size={17} /><input value={currentSearch} onChange={(event) => { const value = event.target.value; setLocalSearch(value); onSearchChange?.(value); }} placeholder="Tìm kiếm sách, tác giả, thể loại..." aria-label="Tìm kiếm sách, tác giả, thể loại" /></form>}
          <div className="harvey-header-actions"><Link aria-label="Gói thành viên" className="harvey-membership-link" title="Gói thành viên" to="/membership"><Crown size={20} /></Link><ReaderNotifications /><button className="harvey-header-avatar" onClick={() => setMenuOpen((open) => !open)} type="button" aria-label="Tài khoản">{initials}</button>
            {menuOpen && <div className="harvey-account-popover"><Link to="/support"><LifeBuoy size={15} /> Hỗ trợ</Link>{user ? <><Link to="/account"><Settings size={15} /> Tài khoản</Link><button onClick={() => void handleLogout()} type="button"><LogOut size={15} /> Đăng xuất</button></> : <Link to="/login">Đăng nhập</Link>}{user?.role === 'ADMIN' && <Link to="/admin/dashboard">Quản trị</Link>}</div>}
          </div>
        </header>
        <main className="reader-content">
          {(title || subtitle) && <div className="reader-content-heading"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>}
          {children}
        </main>
      </div>
    </section>
  </div>;
}
