import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Hàm ProtectedRoute: Chờ xác minh session, điều hướng đúng cổng login và chặn sai vai trò.
export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f3ef]">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <span className="h-5 w-5 animate-spin border-2 border-[#203a34] border-t-transparent" />
          Đang xác minh phiên đăng nhập...
        </div>
      </main>
    );
  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} replace state={{ from }} />;
  }
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/admin/login?forbidden=1" replace />;
  if (!requireAdmin && user.role !== 'USER') return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}
