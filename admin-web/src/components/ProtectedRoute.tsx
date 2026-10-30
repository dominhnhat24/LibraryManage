// Import { Navigate, Outlet, useLocation } từ react-router-dom để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ProtectedRoute.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';

// Hàm ProtectedRoute: Chờ xác minh session, điều hướng đúng cổng login và chặn sai vai trò.
/**
 * Hàm/thành phần ProtectedRoute: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { requireAdmin = false }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useLocation, return.
 */
export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  // Biến { user, loading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading } = useAuth();
  // Biến location nhận giá trị từ useLocation(). const không gán lại; let có thể cập nhật.
  const location = useLocation();

  // if chỉ chạy nhánh này khi điều kiện loading đúng.
  if (loading) {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <main className="grid min-h-screen place-items-center bg-[#f4f3ef]"> <div clas.
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f3ef]">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <span className="h-5 w-5 animate-spin border-2 border-[#203a34] border-t-transparent" />
          Đang xác minh phiên đăng nhập...
        </div>
      </main>
    );
  }

  // if chỉ chạy nhánh này khi điều kiện !user đúng.
  if (!user) {
    // Biến from nhận giá trị từ `${location.pathname}${location.search}${location.hash}. const không gán lại; let có thể cập nhật.
    const from = `${location.pathname}${location.search}${location.hash}`;
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <Navigate to={requireAdmin ? '/admin/login' : '/login'} replace state={{ from }}.
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} replace state={{ from }} />;
  }
  // if chỉ chạy nhánh này khi điều kiện requireAdmin && user.role !== 'ADMIN' đúng.
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/admin/login?forbidden=1" replace />;
  // if chỉ chạy nhánh này khi điều kiện !requireAdmin && user.role !== 'USER' đúng.
  if (!requireAdmin && user.role !== 'USER') return <Navigate to="/admin/dashboard" replace />;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <Outlet />.
  return <Outlet />;
}
