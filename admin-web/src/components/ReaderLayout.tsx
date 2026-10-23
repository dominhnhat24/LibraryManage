import { useState, useEffect, type ReactNode } from 'react';
import {
  BookOpen, Heart, Home, Settings, Search, Bell,
  ChevronDown, LibraryBig, Facebook, Youtube, Instagram
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../reader-ui.css';

interface ReaderLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

export function ReaderLayout({
  children,
  rightPanel,
  searchValue,
  onSearchChange,
  onSearchSubmit
}: ReaderLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue ?? '');

  useEffect(() => {
    if (searchValue !== undefined) setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localSearch.trim();
    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else if (trimmed) {
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/');
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Trang chủ' },
    { to: '/my-library', icon: LibraryBig, label: 'Tủ sách của tôi' },
    { to: '/favorites', icon: Heart, label: 'Yêu thích' },
    { to: '/settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="bn-app">
      {/* 1. SIDEBAR BÊN TRÁI */}
      <aside className="ob-sidebar">
        {/* Logo */}
        <Link to="/" className="ob-sidebar-logo">
          <div className="ob-sidebar-logo-icon">
            <BookOpen size={30} strokeWidth={2.2} />
          </div>
          <div className="ob-sidebar-logo-text">
            <span className="ob-sidebar-brand-name">OpenBook</span>
            <span className="ob-sidebar-brand-tagline">Đọc để trưởng thành</span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="ob-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to ||
              (item.to === '/' && location.pathname === '/catalog');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`ob-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Đáy Sidebar: Quote viết tay & Tranh vẽ màu nước */}
        <div className="ob-sidebar-bottom-art">
          <div className="ob-sidebar-hand-quote">
            Sách là<br />
            người bạn đồng hành<br />
            thầm lặng nhưng<br />
            luôn ở bên bạn.
          </div>
          <svg className="ob-sidebar-art-img" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chồng sách vintage */}
            <rect x="25" y="70" width="105" height="15" rx="3" fill="#D3E2D6" stroke="#5E846A" strokeWidth="1.5" />
            <rect x="35" y="55" width="95" height="15" rx="3" fill="#E8E2D5" stroke="#7A6F5D" strokeWidth="1.5" />
            <rect x="45" y="42" width="75" height="13" rx="3" fill="#C5D9CB" stroke="#52785D" strokeWidth="1.5" />
            {/* Nhành lá cây vươn ra */}
            <path d="M15 88C35 75 40 50 42 25" stroke="#5E846A" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M42 25C48 24 54 28 52 35C45 38 42 32 42 25Z" fill="#88B294" />
            <path d="M38 42C44 40 50 45 47 51C41 53 38 48 38 42Z" fill="#9FC4AA" />
            <path d="M28 62C22 60 18 53 23 48C28 48 30 55 28 62Z" fill="#88B294" />
            <path d="M125 85C135 75 142 55 145 35" stroke="#5E846A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M145 35C150 36 153 42 148 46C142 47 141 42 145 35Z" fill="#88B294" />
            <path d="M138 52C143 54 146 60 141 63C136 63 135 58 138 52Z" fill="#A8CBB2" />
          </svg>
        </div>
      </aside>

      {/* 2. TOPBAR */}
      <header className="ob-topbar">
        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="ob-topbar-search">
          <Search size={16} />
          <input
            placeholder="Tìm kiếm sách, tác giả, thể loại..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
          />
        </form>

        {/* Phần bên phải Topbar */}
        <div className="ob-topbar-right">
          <button className="ob-topbar-bell" aria-label="Thông báo">
            <Bell size={19} />
          </button>

          <div
            className="ob-topbar-user"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ position: 'relative' }}
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="avatar"
              className="ob-topbar-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/book-cover-placeholder.svg';
              }}
            />
            <span className="ob-topbar-name">
              {user?.name || 'Nhật Đỗ Minh'}
              <ChevronDown size={14} color="#64748B" />
            </span>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 200,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 110,
                  border: '1px solid #E8ECE8'
                }}
              >
                <Link
                  to="/settings"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1E293B' }}
                >
                  <Settings size={16} /> Cài đặt tài khoản
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1E293B' }}
                  >
                    <BookOpen size={16} /> Trang quản trị
                  </Link>
                )}
                <button
                  onClick={() => void logout()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#EF4444', width: '100%', textAlign: 'left' }}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. KHỐI NỘI DUNG CHÍNH (3 CỘT NẾU CÓ RIGHT PANEL) */}
      <div className="ob-layout-container">
        <main className="ob-main-col">
          {children}
        </main>

        {rightPanel && (
          <aside className="ob-right-col">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* 4. FOOTER TOÀN CỤC TRẢI DÀI DƯỚI CÙNG */}
      <footer className="ob-global-footer">
        <div className="ob-footer-brand">
          <BookOpen size={20} color="var(--ob-primary)" />
          <span>OpenBook</span>
        </div>

        <div className="ob-footer-links">
          <Link to="/support">Giới thiệu</Link>
          <Link to="/support">Liên hệ</Link>
          <Link to="/support">Điều khoản sử dụng</Link>
          <Link to="/support">Chính sách bảo mật</Link>
        </div>

        <div className="ob-footer-right">
          <div className="ob-footer-socials">
            <a href="#facebook" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#youtube" aria-label="Youtube"><Youtube size={16} /></a>
            <a href="#instagram" aria-label="Instagram"><Instagram size={16} /></a>
          </div>
          <span className="ob-footer-copy">© 2025 OpenBook. Cùng bạn đọc xa hơn.</span>
        </div>
      </footer>
    </div>
  );
}
