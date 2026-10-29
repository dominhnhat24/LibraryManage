import { useState, type ReactNode, type FormEvent } from 'react';
import { Crown, LogOut, Search, Settings, LifeBuoy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../reader-ui.css';
import { ReaderSidebar } from './ReaderSidebar';
import { ReaderNotifications } from './ReaderNotifications';

export function ReaderShell({ children, title, subtitle, searchValue = '', onSearchChange, onSearchSubmit, hideSearch = false }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  hideSearch?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('reader-sidebar-collapsed') === 'true');
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [menuOpen, setMenuOpen] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = (onSearchChange ? searchValue : localSearch).trim();
    if (onSearchSubmit) onSearchSubmit(q);
    else navigate(q ? `/library?search=${encodeURIComponent(q)}` : '/library');
  }
  async function handleLogout() { await logout(); navigate('/', { replace: true }); }
  const currentSearch = onSearchChange ? searchValue : localSearch;
  const initials = user?.name?.trim().slice(0, 1).toUpperCase() || 'A';

  return <div className="booknest-home reader-shared-home">
    <section className="booknest-book">
      <ReaderSidebar collapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('reader-sidebar-collapsed', String(next));
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
