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

// Import các trang Reader (Độc giả)
import { ReaderHome } from './pages/ReaderHome';
import { ReaderBookPage } from './pages/ReaderBookPage';
import { ReaderAccountPage } from './pages/ReaderAccountPage';
import { ReaderSupportPage } from './pages/ReaderSupportPage';
import { BookReaderPage } from './pages/BookReaderPage';

export function App() {
  return (
    <Routes>
      {/* ================= PHẦN XÁC THỰC (ĐĂNG NHẬP / ĐĂNG KÝ) ================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} /> {/* Đã bổ sung route đăng ký */}
      <Route path="/admin/login" element={<LoginPage admin />} />

      {/* ================= PHẦN DÀNH CHO ĐỘC GIẢ (USER) ================= */}
      <Route path="/" element={<ReaderHome />} />
      <Route path="/catalog" element={<ReaderHome />} />
      <Route path="/books/:bookId" element={<ReaderBookPage />} />  
      <Route path="/account" element={<ReaderAccountPage />} />
      <Route path="/support" element={<ReaderSupportPage />} />
      <Route path="/books/:bookId/read" element={<BookReaderPage />} />
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