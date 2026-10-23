import { useState, type ReactNode, type FormEvent } from 'react';
import { BookOpen, Heart, LibraryBig, LogOut, Menu, Search, Settings, LifeBuoy } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../reader-ui.css';

const navItems = [
  { to: '/', label: 'Trang chủ', icon: BookOpen },
  { to: '/library', label: 'Tủ sách của tôi', icon: LibraryBig },
  { to: '/favorites', label: 'Yêu thích', icon: Heart },
  { to: '/account', label: 'Cài đặt', icon: Settings },
];

export function ReaderShell({ children, title, subtitle, searchValue = '', onSearchChange }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/' || location.pathname === '/catalog';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = (onSearchChange ? searchValue : localSearch).trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
    setMobileOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  const currentSearch = onSearchChange ? searchValue : localSearch;

  return <div className="ob2-app">
      <aside className={`ob2-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="ob2-brand-wrap">
          <Link to="/" className="ob2-brand" onClick={() => setMobileOpen(false)}>
            <span className="ob2-brand-icon"><BookOpen size={22} /></span>
            <span><strong>OpenBook</strong><small>Đọc sách · Mở trí thức</small></span>
          </Link>
        </div>
        <nav className="ob2-side-nav" aria-label="Điều hướng độc giả">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} className={`ob2-side-link ${isActive(to) ? 'is-active' : ''}`}>
              <Icon size={17} /><span>{label}</span>
            </Link>
          ))}
          <Link to="/support" onClick={() => setMobileOpen(false)} className={`ob2-side-link ${isActive('/support') ? 'is-active' : ''}`}>
            <LifeBuoy size={17} /><span>Hỗ trợ</span>
          </Link>
        </nav>
        <div className="ob2-side-tip">
          <strong>Đọc sách là cách bạn trò chuyện với thế giới.</strong>
          <span>Mở một cuốn sách mới hôm nay.</span>
        </div>
        <div className="ob2-side-bottom">
          {user ? (
            <button className="ob2-logout-link" onClick={() => void handleLogout()} type="button"><LogOut size={16} /> Đăng xuất</button>
          ) : (
            <Link className="ob2-login-link" to="/login">Đăng nhập</Link>
          )}
        </div>
      </aside>
      {mobileOpen && <button className="ob2-overlay" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} type="button" />}

      <section className="ob2-frame">
        <header className="ob2-topbar">
          <button className="ob2-mobile-button" aria-label="Mở menu" onClick={() => setMobileOpen(true)} type="button">
            <Menu size={19} />
          </button>
          <form className="ob2-search" onSubmit={submitSearch} role="search">
            <Search size={16} />
            <input value={currentSearch} onChange={(event) => { const value = event.target.value; setLocalSearch(value); onSearchChange?.(value); }} placeholder="Tìm kiếm sách, tác giả, thể loại..." aria-label="Tìm kiếm sách, tác giả, thể loại" />
          </form>
          <div className="ob2-top-actions">
            <span className="ob2-topbell" aria-hidden="true">♧</span>
            {user ? (
              <Link className="ob2-user-chip" to="/account">
                <span className="ob2-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span>
                <span><strong>{user.name}</strong><small>{user.is_vip ? 'VIP' : user.is_premium ? 'Premium' : 'Thành viên'}</small></span>
              </Link>
            ) : <Link className="ob2-user-chip" to="/login"><span className="ob2-avatar">?</span><span><strong>Khách</strong><small>Đăng nhập</small></span></Link>}
          </div>
        </header>

        <main className="ob2-content">
          {(title || subtitle) && (
            <div className="ob2-page-heading">
              <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
            </div>
          )}
          {children}
        </main>
      </section>
    </div>
}
