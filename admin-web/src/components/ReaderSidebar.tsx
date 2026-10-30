// Import { Bookmark, BookOpen, Home, Menu, Settings, Timer } từ lucide-react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ReaderSidebar.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { Bookmark, BookOpen, Home, Menu, Settings, Timer } from 'lucide-react';
// Import { Link, useLocation } từ react-router-dom để dùng trong giao diện.
import { Link, useLocation } from 'react-router-dom';

/**
 * Hàm/thành phần ReaderSidebar: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { collapsed, onToggle, showLabels = fals.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useLocation, startsWith, map.
 */
export function ReaderSidebar({ collapsed, onToggle, showLabels = false }: { collapsed: boolean; onToggle: () => void; showLabels?: boolean }) {
  // Biến location nhận giá trị từ useLocation(). const không gán lại; let có thể cập nhật.
  const location = useLocation();
  // Biến links nhận giá trị từ [ { to: '/', label: 'Trang chủ', active: location.pathn. const không gán lại; let có thể cập nhật.
  const links = [
    { to: '/', label: 'Trang chủ', active: location.pathname === '/' || location.pathname === '/catalog', icon: Home, size: 30, stroke: 1.2 },
    { to: '/library', label: 'Tủ sách', active: location.pathname.startsWith('/library') || location.pathname === '/my-library', icon: BookOpen, size: 25, stroke: 1.5 },
    { to: '/favorites', label: 'Yêu thích', active: location.pathname.startsWith('/favorites'), icon: Bookmark, size: 25, stroke: 1.5 },
    { to: '/history', label: 'Lịch sử đọc', active: location.pathname.startsWith('/history'), icon: Timer, size: 25, stroke: 1.5 },
    { to: '/settings', label: 'Cài đặt', active: location.pathname.startsWith('/settings') || location.pathname === '/account', icon: Settings, size: 25, stroke: 1.5 },
  ];

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <aside className={`booknest-sidebar ${collapsed ? 'is-collapsed' : ''} ${showLab.
  return <aside className={`booknest-sidebar ${collapsed ? 'is-collapsed' : ''} ${showLabels ? 'is-labeled' : ''}`} aria-label="Điều hướng">
    <Link className="harveybook-sidebar-brand" to="/" aria-label="HarveyBook - Trang chủ"><img src="/HarveyBook-gold.png" alt="HarveyBook" className="harveybook-logo" /></Link>
    <nav className={`booknest-side-nav ${collapsed ? 'is-collapsed' : ''}`} aria-hidden={collapsed}>
      {links.map(({ to, label, active, icon: Icon, size, stroke }) => <Link key={to} className={`booknest-side-icon ${active ? 'is-active' : ''}`} to={to} aria-label={label} title={label} tabIndex={collapsed ? -1 : 0}><Icon size={size} strokeWidth={stroke} />{showLabels && <span>{label === 'Tủ sách' ? 'Thư viện' : label === 'Lịch sử đọc' ? 'Khám phá' : label === 'Cài đặt' ? 'Tài khoản' : label}</span>}</Link>)}
    </nav>
    <button className="booknest-side-icon booknest-menu-button" type="button" aria-label={collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'} title={collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'} aria-expanded={!collapsed} onClick={onToggle}><Menu size={22} strokeWidth={1.5} /></button>
  </aside>;
}
