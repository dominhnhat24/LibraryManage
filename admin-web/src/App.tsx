// Import { Navigate, Route, Routes } từ react-router-dom để dùng trong giao diện.
/**
 * Tệp admin-web/src/App.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
// Import { ProtectedRoute } từ ./components/ProtectedRoute để dùng trong giao diện.
import { ProtectedRoute } from './components/ProtectedRoute';

// Import các trang Admin
// Import { AdminDashboard } từ ./pages/AdminDashboard để dùng trong giao diện.
import { AdminDashboard } from './pages/AdminDashboard';
// Import { BookManagement } từ ./pages/BookManagement để dùng trong giao diện.
import { BookManagement } from './pages/BookManagement';
// Import { ChapterManagement } từ ./pages/ChapterManagement để dùng trong giao diện.
import { ChapterManagement } from './pages/ChapterManagement';
// Import { UserManagement } từ ./pages/UserManagement để dùng trong giao diện.
import { UserManagement } from './pages/UserManagement';
// Import { SubscriptionManagement } từ ./pages/SubscriptionManagement để dùng trong giao diện.
import { SubscriptionManagement } from './pages/SubscriptionManagement';
// Import { ReportManagement } từ ./pages/ReportManagement để dùng trong giao diện.
import { ReportManagement } from './pages/ReportManagement';
// Import { AdminCommentsPage } từ ./pages/AdminCommentsPage để dùng trong giao diện.
import { AdminCommentsPage } from './pages/AdminCommentsPage';
// Import { BookImportPage } từ ./pages/BookImportPage để dùng trong giao diện.
import { BookImportPage } from './pages/BookImportPage';

// Import cả LoginPage và RegisterPage từ file AuthPages.tsx
// Import { AuthPage, LoginPage } từ ./pages/AuthPages để dùng trong giao diện.
import { AuthPage, LoginPage } from './pages/AuthPages';

// Import các trang Reader (Độc giả) theo chuẩn Booknest UI
// Import { ReaderHome } từ ./pages/ReaderHome để dùng trong giao diện.
import { ReaderHome } from './pages/ReaderHome';
// Import { ReaderLibraryPage } từ ./pages/ReaderLibraryPage để dùng trong giao diện.
import { ReaderLibraryPage } from './pages/ReaderLibraryPage';
// Import { MyLibraryPage } từ ./pages/MyLibraryPage để dùng trong giao diện.
import { MyLibraryPage } from './pages/MyLibraryPage';
// Import { FavoritesPage } từ ./pages/FavoritesPage để dùng trong giao diện.
import { FavoritesPage } from './pages/FavoritesPage';
// Import { SettingsPage } từ ./pages/SettingsPage để dùng trong giao diện.
import { SettingsPage } from './pages/SettingsPage';
// Import { ReadingHistoryPage } từ ./pages/ReadingHistoryPage để dùng trong giao diện.
import { ReadingHistoryPage } from './pages/ReadingHistoryPage';
// Import { ReaderBookPage } từ ./pages/ReaderBookPage để dùng trong giao diện.
import { ReaderBookPage } from './pages/ReaderBookPage';
// Import { ReaderSupportPage } từ ./pages/ReaderSupportPage để dùng trong giao diện.
import { ReaderSupportPage } from './pages/ReaderSupportPage';
// Import { ChapterReaderPage } từ ./pages/ChapterReaderPage để dùng trong giao diện.
import { ChapterReaderPage } from './pages/ChapterReaderPage';
// Import { BookReaderPage } từ ./pages/BookReaderPage để dùng trong giao diện.
import { BookReaderPage } from './pages/BookReaderPage';
// Import { MembershipPage } từ ./pages/MembershipPage để dùng trong giao diện.
import { MembershipPage } from './pages/MembershipPage';

/**
 * Hàm/thành phần App: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: return, C.
 */
export function App() {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <Routes> {} <Route element={<AuthPage />}> <Route path="/login" /> <Route path.
  return (
    <Routes>
      {/* ================= PHẦN XÁC THỰC (ĐĂNG NHẬP / ĐĂNG KÝ) ================= */}
      <Route element={<AuthPage />}>
        <Route path="/login" />
        <Route path="/register" />
      </Route>
      <Route path="/admin/login" element={<LoginPage admin />} />

      {/* ================= PHẦN DÀNH CHO ĐỘC GIẢ (USER) THEO BOOKNEST UI ================= */}
      {/* 1. Trang chủ */}
      <Route path="/" element={<ReaderHome />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/catalog" element={<ReaderLibraryPage />} />
        <Route path="/my-library" element={<MyLibraryPage />} />
        <Route path="/library" element={<ReaderLibraryPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<ReadingHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<SettingsPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/books/:bookId" element={<ReaderBookPage />} />
        <Route path="/books/:bookId/read" element={<ChapterReaderPage />} />
        <Route path="/books/:bookId/read/:chapterId" element={<ChapterReaderPage />} />
        <Route path="/books/:bookId/pdf" element={<BookReaderPage />} />
      </Route>

      {/* Hỗ trợ / báo cáo */}
      <Route path="/support" element={<ReaderSupportPage />} />

      {/* ================= PHẦN DÀNH CHO QUẢN TRỊ (ADMIN) ================= */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate replace to="/admin/dashboard" />} />
        <Route path="/admin/books" element={<BookManagement />} />
        <Route path="/admin/books/import" element={<BookImportPage />} />
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
