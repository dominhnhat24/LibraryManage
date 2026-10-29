import { Bookmark, BookOpen, Home, Menu, Settings, Timer } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function ReaderSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const links = [
    { to: '/', label: 'Trang chủ', active: location.pathname === '/' || location.pathname === '/catalog', icon: Home, size: 30, stroke: 1.2 },
    { to: '/library', label: 'Tủ sách', active: location.pathname.startsWith('/library') || location.pathname === '/my-library', icon: BookOpen, size: 25, stroke: 1.5 },
    { to: '/favorites', label: 'Yêu thích', active: location.pathname.startsWith('/favorites'), icon: Bookmark, size: 25, stroke: 1.5 },
    { to: '/history', label: 'Lịch sử đọc', active: location.pathname.startsWith('/history'), icon: Timer, size: 25, stroke: 1.5 },
    { to: '/settings', label: 'Cài đặt', active: location.pathname.startsWith('/settings') || location.pathname === '/account', icon: Settings, size: 25, stroke: 1.5 },
  ];

  return <aside className={`booknest-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Điều hướng">
    <Link className="harveybook-sidebar-brand" to="/" aria-label="HarveyBook - Trang chủ"><img src="/HarveyBook-gold.png" alt="HarveyBook" className="harveybook-logo" /></Link>
    <nav className={`booknest-side-nav ${collapsed ? 'is-collapsed' : ''}`} aria-hidden={collapsed}>
      {links.map(({ to, label, active, icon: Icon, size, stroke }) => <Link key={to} className={`booknest-side-icon ${active ? 'is-active' : ''}`} to={to} aria-label={label} title={label} tabIndex={collapsed ? -1 : 0}><Icon size={size} strokeWidth={stroke} /></Link>)}
    </nav>
    <button className="booknest-side-icon booknest-menu-button" type="button" aria-label={collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'} title={collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'} aria-expanded={!collapsed} onClick={onToggle}><Menu size={22} strokeWidth={1.5} /></button>
  </aside>;
}
