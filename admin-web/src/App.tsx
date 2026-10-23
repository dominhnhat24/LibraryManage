import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import các trang Admin
import { AdminDashboard } from './pages/AdminDashboard';
import { BookManagement } from './pages/BookManagement';
import { ChapterManagement } from './pages/ChapterManagement';
import { UserManagement } from './pages/UserManagement';
import { SubscriptionManagement } from './pages/SubscriptionManagement';
import { ReportManagement } from './pages/ReportManagement';
import { AdminCommentsPage } from './pages/AdminCommentsPage';

// Import cả LoginPage và RegisterPage từ file AuthPages.tsx
import { LoginPage, RegisterPage } from './pages/AuthPages';

// Import các trang Reader (Độc giả) theo chuẩn Booknest UI
import { ReaderHome } from './pages/ReaderHome';
import { MyLibraryPage } from './pages/MyLibraryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReaderBookPage } from './pages/ReaderBookPage';
import { ReaderSupportPage } from './pages/ReaderSupportPage';
import { ChapterReaderPage } from './pages/ChapterReaderPage';
import { BookReaderPage } from './pages/BookReaderPage';

export function App() {
  return (
    <Routes>
      {/* ================= PHẦN XÁC THỰC (ĐĂNG NHẬP / ĐĂNG KÝ) ================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<LoginPage admin />} />

      {/* ================= PHẦN DÀNH CHO ĐỘC GIẢ (USER) THEO BOOKNEST UI ================= */}
      {/* 1. Trang chủ */}
      <Route path="/" element={<ReaderHome />} />
      <Route path="/catalog" element={<ReaderHome />} />

      {/* 2. Tủ sách của tôi */}
      <Route path="/my-library" element={<MyLibraryPage />} />
      <Route path="/library" element={<MyLibraryPage />} />

      {/* 3. Sách yêu thích */}
      <Route path="/favorites" element={<FavoritesPage />} />

      {/* 4. Cài đặt tài khoản */}
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<SettingsPage />} />

      {/* Chi tiết sách */}
      <Route path="/books/:bookId" element={<ReaderBookPage />} />

      {/* 5. Trang đọc sách (Chapter reader & PDF stream reader) */}
      <Route path="/books/:bookId/read" element={<ChapterReaderPage />} />
      <Route path="/books/:bookId/read/:chapterId" element={<ChapterReaderPage />} />
      <Route path="/books/:bookId/pdf" element={<BookReaderPage />} />

      {/* Hỗ trợ / báo cáo */}
      <Route path="/support" element={<ReaderSupportPage />} />

      {/* ================= PHẦN DÀNH CHO QUẢN TRỊ (ADMIN) ================= */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate replace to="/admin/dashboard" />} />
        <Route path="/admin/books" element={<BookManagement />} />
        <Route path="/admin/chapters" element={<ChapterManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
        <Route path="/admin/reports" element={<ReportManagement />} />
        <Route path="/admin/comments" element={<AdminCommentsPage />} />
      </Route>

      {/* Điều hướng mặc định */}
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
