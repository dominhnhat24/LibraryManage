// Import { useEffect, useMemo, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/AdminDashboard.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useMemo, useState } from 'react';
// Import { AlertCircle, ArrowRight, BookOpen, Calendar, ChevronRight, Clock, CreditCard,  từ lucide-react để dùng trong giao diện.
import {
  AlertCircle, ArrowRight, BookOpen, Calendar, ChevronRight,
  Clock, CreditCard, FileText, MoreVertical, Plus, Star, Trash2, Users,
} from 'lucide-react';
// Import { Link } từ react-router-dom để dùng trong giao diện.
import { Link } from 'react-router-dom';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { errorMessage, fetchAdminComments, fetchAdminDashboard, fetchBooks, fetchRecent từ ../api/client để dùng trong giao diện.
import {
  errorMessage, fetchAdminComments, fetchAdminDashboard, fetchBooks, fetchRecentUsers,
  fetchReports, fetchSubscriptions, deleteBookComment, type AdminDashboardResponse,
} from '../api/client';
// Import type { Book, User, Report, Subscription } từ ../types để dùng trong giao diện.
import type { Book, User, Report, Subscription } from '../types';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';

/* ───── Comment type (kept from original) ───── */
// Interface CommentItem quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface CommentItem {
  _id: string;
  body: string;
  rating?: number | null;
  user?: any;
  book?: any;
  createdAt?: string;
  bookTitle?: string;
}

/* ───── Dashboard data ───── */
// Interface DashboardCounts quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
interface DashboardCounts {
  books: number | null;
  chapters: number | null;
  users: number | null;
  activeSubscriptions: number | null;
  openReports: number | null;
}

// Biến emptyCounts nhận giá trị từ { books: null, chapters: null, users: null, activeSubsc. const không gán lại; let có thể cập nhật.
const emptyCounts: DashboardCounts = {
  books: null, chapters: null, users: null, activeSubscriptions: null, openReports: null,
};

/* ═══════════════════════════════════════════════ */
/**
 * Hàm/thành phần AdminDashboard: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useState, useMemo, Date, toLocaleDateString, toLocaleTimeString, useEffect, load.
 */
export function AdminDashboard() {
  // Biến { user: currentUser } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user: currentUser } = useAuth();
  // Biến [summary, setSummary] nhận giá trị từ useState<AdminDashboardResponse | null>(null). const không gán lại; let có thể cập nhật.
  const [summary, setSummary] = useState<AdminDashboardResponse | null>(null);
  // Biến [recentBooks, setRecentBooks] nhận giá trị từ useState<Book[]>([]). const không gán lại; let có thể cập nhật.
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  // Biến [recentUsers, setRecentUsers] nhận giá trị từ useState<User[]>([]). const không gán lại; let có thể cập nhật.
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  // Biến [recentReports, setRecentReports] nhận giá trị từ useState<Report[]>([]). const không gán lại; let có thể cập nhật.
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  // Biến [recentSubscriptions, setRecentSubs nhận giá trị từ useState<Subscription[]>([]). const không gán lại; let có thể cập nhật.
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);
  // Biến [comments, setComments] nhận giá trị từ useState<(CommentItem & { bookTitle?: string })[]>([]). const không gán lại; let có thể cập nhật.
  const [comments, setComments] = useState<(CommentItem & { bookTitle?: string })[]>([]);
  // Biến [period, setPeriod] nhận giá trị từ useState<7 | 30 | 90>(7). const không gán lại; let có thể cập nhật.
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');

  /* Date/time is refreshed on each dashboard load rather than hard-coded. */
  // Biến now nhận giá trị từ useMemo(() => new Date(), [summary]). const không gán lại; let có thể cập nhật.
  const now = useMemo(() => new Date(), [summary]);
  // Biến dateStr nhận giá trị từ now.toLocaleDateString('vi-VN', { weekday: 'long', day:. const không gán lại; let có thể cập nhật.
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  // Biến timeStr nhận giá trị từ now.toLocaleTimeString('vi-VN', { hour: '2-digit', minu. const không gán lại; let có thể cập nhật.
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Biến counts nhận giá trị từ summary ? { books: summary.metrics.totalBooks, chapters. const không gán lại; let có thể cập nhật.
  const counts: DashboardCounts = summary ? {
    books: summary.metrics.totalBooks,
    chapters: summary.metrics.totalChapters,
    users: summary.metrics.totalUsers,
    activeSubscriptions: summary.metrics.activeSubscriptions,
    openReports: summary.metrics.openReports,
  } : emptyCounts;

  /* Load persisted data through the real admin endpoints. Each panel can still render
     when an unrelated endpoint fails, and the dashboard never substitutes sample values. */
  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; async function load() { setLoading(true); s
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    /**
     * Hàm/thành phần load: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: setLoading, setError, allSettled, fetchAdminDashboard, fetchBooks, fetchRecentUsers, fetchReports, fetchAdminComments.
     */
    async function load() {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
      setLoading(true);
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
      setError('');
      // Biến results nhận giá trị từ await Promise.allSettled([ fetchAdminDashboard(period),. const không gán lại; let có thể cập nhật.
      const results = await Promise.allSettled([
        fetchAdminDashboard(period),
        fetchBooks({ page: 1, limit: 5 }),
        fetchRecentUsers(),
        fetchReports({ page: 1, limit: 5, status: 'open' }),
        fetchAdminComments({ page: 1, limit: 10 }),
        fetchSubscriptions({ page: 1, limit: 5 }),
      ]);
      // if chỉ chạy nhánh này khi điều kiện !active đúng.
      if (!active) return;

      // if chỉ chạy nhánh này khi điều kiện results[0].status === 'fulfilled' đúng.
      if (results[0].status === 'fulfilled') setSummary(results[0].value);
      else setError(errorMessage(results[0].reason));
      // if chỉ chạy nhánh này khi điều kiện results[1].status === 'fulfilled' đúng.
      if (results[1].status === 'fulfilled') setRecentBooks(results[1].value.books);
      // if chỉ chạy nhánh này khi điều kiện results[2].status === 'fulfilled' đúng.
      if (results[2].status === 'fulfilled') setRecentUsers(results[2].value.slice(0, 6));
      // if chỉ chạy nhánh này khi điều kiện results[3].status === 'fulfilled' đúng.
      if (results[3].status === 'fulfilled') setRecentReports(results[3].value.reports.slice(0, 5));
      // if chỉ chạy nhánh này khi điều kiện results[4].status === 'fulfilled' đúng.
      if (results[4].status === 'fulfilled') {
        // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments(results[4].value.comments.map((comment) => ({ ...comment, bookTitle:
        setComments(results[4].value.comments.map((comment) => ({
          ...comment,
          bookTitle: typeof comment.book === 'object' && comment.book !== null ? comment.book.title ?? 'Sách' : 'Sách',
        })));
      }
      // if chỉ chạy nhánh này khi điều kiện results[5].status === 'fulfilled' đúng.
      if (results[5].status === 'fulfilled') setRecentSubscriptions(results[5].value.subscriptions);

      // Biến firstFailure nhận giá trị từ results.find((result) => result.status === 'rejected'). const không gán lại; let có thể cập nhật.
      const firstFailure = results.find((result) => result.status === 'rejected');
      // if chỉ chạy nhánh này khi điều kiện firstFailure?.status === 'rejected' đúng.
      if (firstFailure?.status === 'rejected') {
        // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError((currentError) => currentError || `Một số dữ liệu trên dashboard chưa t
        setError((currentError) => currentError || `Một số dữ liệu trên dashboard chưa tải được: ${errorMessage(firstFailure.reason)}`);
      }
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
    // Gọi/thực thi load với đối số để cập nhật logic/giao diện: void load()
    void load();
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [period]);

  // Hàm xử lý xóa bình luận thật qua API.
  /**
   * Hàm/thành phần handleDeleteComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: commentId.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, deleteBookComment, setComments, filter, alert, errorMessage.
   */
  async function handleDeleteComment(commentId: string) {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?') đúng.
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteBookComment(commentId)
      await deleteBookComment(commentId);
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments((prev) => prev.filter((comment) => comment._id !== commentId))
      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    } catch (err: unknown) {
      // Gọi/thực thi window.alert với đối số để cập nhật logic/giao diện: window.alert(errorMessage(err) || 'Không thể xóa bình luận.')
      window.alert(errorMessage(err) || 'Không thể xóa bình luận.');
    }
  }

  /* ── Stat cards config ── */
  // Biến stats nhận giá trị từ [ { label: 'Tổng số sách', value: counts.books, icon: B. const không gán lại; let có thể cập nhật.
  const stats = [
    { label: 'Tổng số sách', value: counts.books, icon: BookOpen, color: '#24795C', href: '/admin/books' },
    { label: 'Người dùng', value: counts.users, icon: Users, color: '#5DAEFF', href: '/admin/users' },
    { label: 'Thuê bao đang hoạt động', value: counts.activeSubscriptions, icon: CreditCard, color: '#57A982', href: '/admin/subscriptions' },
    { label: 'Báo cáo chờ xử lý', value: counts.openReports, icon: FileText, color: '#E8913A', href: '/admin/reports' },
  ];

  /* ── Quick actions ── */
  // Biến quickActions nhận giá trị từ [ { title: 'Thêm sách mới', desc: 'Tạo đầu sách và tải . const không gán lại; let có thể cập nhật.
  const quickActions = [
    { title: 'Thêm sách mới', desc: 'Tạo đầu sách và tải file PDF', href: '/admin/books?action=create', icon: Plus },
    { title: 'Quản lý người dùng', desc: 'Xem và chỉnh sửa tài khoản', href: '/admin/users', icon: Users },
    { title: 'Xử lý thuê bao', desc: 'Duyệt yêu cầu và cấp VIP', href: '/admin/subscriptions', icon: CreditCard },
    { title: 'Xem báo cáo', desc: 'Thống kê và phản hồi', href: '/admin/reports', icon: FileText },
  ];

  // Biến categoryLabel nhận giá trị từ { van_hoc_viet_nam: 'Văn học Việt Nam', truyen_ngan_vie. const không gán lại; let có thể cập nhật.
  const categoryLabel: Record<string, string> = {
    van_hoc_viet_nam: 'Văn học Việt Nam', truyen_ngan_viet_nam: 'Truyện ngắn Việt Nam',
    tho_viet_nam: 'Thơ Việt Nam', van_hoc_dan_gian: 'Văn học dân gian', van_hoc_the_gioi: 'Văn học thế giới',
    kinh_doanh: 'Kinh doanh', phat_trien_ban_than: 'Phát triển bản thân', tam_ly_hoc: 'Tâm lý học',
    lich_su: 'Lịch sử', khoa_hoc: 'Khoa học',
  };
  // Biến categoryColor nhận giá trị từ { van_hoc_viet_nam: '#24795C', truyen_ngan_viet_nam: '#. const không gán lại; let có thể cập nhật.
  const categoryColor: Record<string, string> = {
    van_hoc_viet_nam: '#24795C', truyen_ngan_viet_nam: '#5DAEFF', tho_viet_nam: '#8B5CF6',
    van_hoc_dan_gian: '#F59E0B', van_hoc_the_gioi: '#16A6A0', kinh_doanh: '#D97706',
    phat_trien_ban_than: '#64748B', tam_ly_hoc: '#DB2777', lich_su: '#0D9488', khoa_hoc: '#5DAEFF',
  };

  /* Genre counts come from a MongoDB aggregation over all books, not only recent rows. */
  // Biến genreDist nhận giá trị từ useMemo(() => { const categories = summary?.categories . const không gán lại; let có thể cập nhật.
  const genreDist = useMemo(() => {
    // Biến categories nhận giá trị từ summary?.categories ?? []. const không gán lại; let có thể cập nhật.
    const categories = summary?.categories ?? [];
    // Biến total nhận giá trị từ categories.reduce((sum, item) => sum + item.count, 0) |. const không gán lại; let có thể cập nhật.
    const total = categories.reduce((sum, item) => sum + item.count, 0) || 1;
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: categories.map(({ category, count }) => ({ category, label: categoryLabel[catego.
    return categories.map(({ category, count }) => ({
      category,
      label: categoryLabel[category.toLowerCase()] || category.replaceAll('_', ' '),
      count,
      pct: Math.round((count / total) * 100),
      color: categoryColor[category.toLowerCase()] || '#24795C',
    }));
  }, [summary]);

  // Biến recentActivity nhận giá trị từ useMemo(() => { const activities = [ ...recentUsers.map. const không gán lại; let có thể cập nhật.
  const recentActivity = useMemo(() => {
    // Biến activities nhận giá trị từ [ ...recentUsers.map((item) => ({ id: `user-${item._id . const không gán lại; let có thể cập nhật.
    const activities = [
      ...recentUsers.map((item) => ({
        id: `user-${item._id ?? item.id}`, type: 'user' as const, title: 'Người dùng mới đăng ký',
        detail: item.name, date: item.createdAt, icon: Users, href: '/admin/users',
      })),
      ...recentBooks.map((item) => ({
        id: `book-${item._id}`, type: 'book' as const, title: 'Sách mới được thêm',
        detail: item.title, date: item.createdAt, icon: BookOpen, href: '/admin/books',
      })),
      ...recentReports.map((item) => ({
        id: `report-${item._id ?? item.id}`, type: 'report' as const, title: 'Báo cáo cần xử lý',
        detail: item.subject || item.email, date: item.createdAt, icon: FileText, href: '/admin/reports',
      })),
      ...recentSubscriptions.map((item) => ({
        id: `subscription-${item._id ?? item.id}`, type: 'subscription' as const, title: 'Yêu cầu thuê bao',
        detail: item.plan === 'vip_monthly' ? 'Gói VIP tháng' : 'Gói Premium tháng',
        date: item.createdAt, icon: CreditCard, href: '/admin/subscriptions',
      })),
    ];
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: activities .filter((item) => item.date && !Number.isNaN(new Date(item.date).getT.
    return activities
      .filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()))
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 5);
  }, [recentBooks, recentUsers, recentReports, recentSubscriptions]);

  // Biến readingActivity nhận giá trị từ summary?.readingActivity ?? []. const không gán lại; let có thể cập nhật.
  const readingActivity = summary?.readingActivity ?? [];
  // Biến maxReads nhận giá trị từ Math.max(1, ...readingActivity.map((item) => item.count. const không gán lại; let có thể cập nhật.
  const maxReads = Math.max(1, ...readingActivity.map((item) => item.count));
  // Biến totalReads nhận giá trị từ summary?.readingActivityTotal ?? 0. const không gán lại; let có thể cập nhật.
  const totalReads = summary?.readingActivityTotal ?? 0;

  /**
   * Hàm/thành phần statusBadge: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: status.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   */
  const statusBadge = (status: string) => {
    // if chỉ chạy nhánh này khi điều kiện status === 'published' đúng.
    if (status === 'published') return 'border-[#C3E5D0] bg-[#EAFAF0] text-[#24795C]';
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]'.
    return 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]';
  };

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <AdminLayout> {} {error && ( <div className="mb-5 flex items-start gap-2 round.
  return (
    <AdminLayout>
      {/* ─── Error banner ─── */}
      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── GREETING + DATE ─── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-[#153D31]">
            Xin chào, {currentUser?.name ?? 'Admin'} 👋
          </h1>
          <p className="mt-1 text-[14px] text-[#526B86]">
            Chào mừng bạn quay lại! Dưới đây là tổng quan hoạt động hệ thống.
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-3 self-start text-[#526B86] sm:self-auto">
          <Calendar className="mt-0.5 shrink-0" size={20} />
          <div className="text-right">
            <p className="whitespace-nowrap text-[13px] font-medium text-[#153D31]">{dateStr}</p>
            <p className="text-[13px] text-[#526B86]">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* ═══ TWO-COLUMN DASHBOARD GRID ═══ */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
        {/* ──── LEFT / MAIN COLUMN ──── */}
        <div className="min-w-0 space-y-4">
          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, color, href }) => (
              <div
                key={label}
                className="relative rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]"
              >
                <Link aria-label={`Mở mục ${label.toLowerCase()}`} className="absolute right-3 top-3 text-[#97A8B8] hover:text-[#526B86]" to={href}>
                  <MoreVertical size={16} />
                </Link>
                <span
                  className="mb-4 grid h-[50px] w-[50px] place-items-center rounded-full"
                  style={{ backgroundColor: color + '18', color }}
                >
                  <Icon size={22} />
                </span>
                <p className="text-[13px] font-medium text-[#526B86]">{label}</p>
                <p className="mt-1 text-[28px] font-bold leading-tight text-[#153D31]">
                  {loading || value === null ? '—' : value.toLocaleString('vi-VN')}
                </p>
              </div>
            ))}
          </div>

          {/* ── 2 Charts ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.34fr_1fr]">
            {/* Reading activity returned by the MongoDB-backed admin dashboard endpoint. */}
            <div className="rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E3F4EB] text-[#24795C]">
                    <BookOpen size={16} />
                  </span>
                  <h3 className="text-[14px] font-semibold text-[#153D31]">Thống kê lượt đọc</h3>
                </div>
                <div className="flex gap-1">
                  {([7, 30, 90] as const).map((days) => (
                    <button
                      key={days}
                      aria-pressed={period === days}
                      className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${period === days ? 'bg-[#24795C] text-white' : 'border border-[#DDE9E6] text-[#526B86] hover:bg-[#F8FBF9]'}`}
                      onClick={() => setPeriod(days)}
                      type="button"
                    >{days === 90 ? '90 ngày' : `${days} ngày`}</button>
                  ))}
                </div>
              </div>
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#526B86]">
                <span>{totalReads.toLocaleString('vi-VN')} lượt mở trong {period} ngày</span>
                <span>Đọc chương / mở tệp</span>
              </div>
              <div className="flex h-[160px] items-end gap-1 border-b border-[#EEF3F0] pt-2 sm:gap-1.5">
                {readingActivity.map((item, index) => {
                  // Biến height nhận giá trị từ item.count > 0 ? Math.max(5, (item.count / maxReads) * . const không gán lại; let có thể cập nhật.
                  const height = item.count > 0 ? Math.max(5, (item.count / maxReads) * 100) : 0;
                  // Biến isLatest nhận giá trị từ index === readingActivity.length - 1. const không gán lại; let có thể cập nhật.
                  const isLatest = index === readingActivity.length - 1;
                  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div key={item.date} className="flex h-full min-w-0 flex-1 items-end" title={`.
                  return (
                    <div key={item.date} className="flex h-full min-w-0 flex-1 items-end" title={`${item.date}: ${item.count} lượt đọc`}>
                      <div
                        className="w-full rounded-t-[3px] transition-[height] duration-200"
                        style={{ height: `${height}%`, backgroundColor: isLatest ? '#24795C' : '#A8DCBE' }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[#526B86]">
                {readingActivity.filter((_, index) => {
                  // if chỉ chạy nhánh này khi điều kiện period === 7 đúng.
                  if (period === 7) return true;
                  // Biến step nhận giá trị từ period === 30 ? 5 : 15. const không gán lại; let có thể cập nhật.
                  const step = period === 30 ? 5 : 15;
                  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: index % step === 0 || index === readingActivity.length - 1.
                  return index % step === 0 || index === readingActivity.length - 1;
                }).map((item) => (
                  <span key={item.date}>{new Date(`${item.date}T12:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                ))}
              </div>
              {summary && totalReads === 0 && (
                <p className="mt-3 text-center text-[11px] text-[#97A8B8]">Chưa có sự kiện đọc được ghi nhận trong giai đoạn này.</p>
              )}
            </div>

            {/* Genre distribution aggregated across the full book collection. */}
            <div className="rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
              <h3 className="mb-4 text-[14px] font-semibold text-[#153D31]">Thể loại sách</h3>
              <div className="flex items-center gap-4">
                {/* Simple donut via SVG */}
                <div className="relative h-[140px] w-[140px] shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    {(() => {
                      // Biến offset nhận giá trị từ 0. const không gán lại; let có thể cập nhật.
                      let offset = 0;
                      // Biến total nhận giá trị từ genreDist.reduce((s, g) => s + g.count, 0) || 1. const không gán lại; let có thể cập nhật.
                      const total = genreDist.reduce((s, g) => s + g.count, 0) || 1;
                      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: genreDist.map((g) => { const pct = (g.count / total) * 100; const el = ( <circle.
                      return genreDist.map((g) => {
                        // Biến pct nhận giá trị từ (g.count / total) * 100. const không gán lại; let có thể cập nhật.
                        const pct = (g.count / total) * 100;
                        // Biến el nhận giá trị từ ( <circle key={g.category} cx="18" cy="18" r="15.9155" . const không gán lại; let có thể cập nhật.
                        const el = (
                          <circle
                            key={g.category}
                            cx="18" cy="18" r="15.9155"
                            fill="transparent"
                            stroke={g.color}
                            strokeWidth="3.5"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={`${-offset}`}
                            strokeLinecap="round"
                          />
                        );
                        // Gọi/thực thi biểu thức để cập nhật logic/giao diện: offset += pct
                        offset += pct;
                        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: el.
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[22px] font-bold text-[#153D31]">{counts.books ?? '—'}</span>
                    <span className="text-[11px] text-[#526B86]">sách</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2.5">
                  {genreDist.length > 0 ? genreDist.map((g) => (
                    <div key={g.category} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-[#526B86]">{g.label}</span>
                      <span className="ml-auto font-semibold text-[#153D31]">{g.count}</span>
                      <span className="text-[#97A8B8]">({g.pct}%)</span>
                    </div>
                  )) : (
                    <p className="text-[12px] text-[#526B86]">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent Books Table ── */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF3F0] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E3F4EB] text-[#24795C]">
                  <BookOpen size={16} />
                </span>
                <h3 className="text-[14px] font-semibold text-[#153D31]">Sách mới thêm</h3>
              </div>
              <Link to="/admin/books" className="text-[12px] font-medium text-[#24795C] hover:underline">
                Xem tất cả ›
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="px-5 py-8 text-[13px] text-[#526B86]">Đang tải...</p>
              ) : recentBooks.length > 0 ? (
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#EEF3F0] bg-[#F8FBF9] text-[11px] font-medium uppercase tracking-wider text-[#526B86]">
                      <th className="px-5 py-3">#</th>
                      <th className="px-3 py-3">Bìa</th>
                      <th className="px-3 py-3">Tên sách</th>
                      <th className="px-3 py-3">Tác giả</th>
                      <th className="px-3 py-3">Thể loại</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3">Ngày thêm</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F0]">
                    {recentBooks.map((book, idx) => (
                      <tr key={book._id} className="transition-colors hover:bg-[#F8FBF9]">
                        <td className="px-5 py-3 text-[#526B86]">{idx + 1}</td>
                        <td className="px-3 py-3">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="h-[44px] w-[36px] rounded object-cover" />
                          ) : (
                            <span className="grid h-[44px] w-[36px] place-items-center rounded bg-[#EEF3F0] text-[#97A8B8]"><BookOpen size={14} /></span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-[#153D31]">{book.title}</td>
                        <td className="px-3 py-3 text-[#526B86]">{book.author_name}</td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: (categoryColor[book.category.toLowerCase()] || '#24795C') + '18', color: categoryColor[book.category.toLowerCase()] || '#24795C' }}
                          >
                            {categoryLabel[book.category.toLowerCase()] || book.category.replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge(book.status)}`}>
                            {book.status === 'published' ? 'Đã xuất bản' : 'Đang duyệt'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[#526B86]">
                          {new Date(book.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3 py-3">
                          <Link aria-label={`Chỉnh sửa ${book.title}`} className="text-[#97A8B8] hover:text-[#526B86]" to={`/admin/books?edit=${encodeURIComponent(book._id)}`}>
                            <MoreVertical size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-8 text-[13px] text-[#526B86]">Chưa có sách nào.</p>
              )}
            </div>
          </div>

          {/* ── Comments section (preserved from original) ── */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF3F0] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#153D31]">Bình luận & Đánh giá từ Độc giả</h3>
              <Link className="text-[12px] font-medium text-[#24795C] hover:underline" to="/admin/comments">
                Quản lý bình luận →
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="px-5 py-6 text-sm text-[#526B86]">Đang tải danh sách bình luận...</p>
              ) : comments.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EEF3F0] text-[#526B86] uppercase tracking-wider bg-[#F8FBF9]">
                      <th className="py-3 px-5 font-medium">Độc giả</th>
                      <th className="py-3 px-5 font-medium">Tên sách</th>
                      <th className="py-3 px-5 font-medium">Nội dung bình luận</th>
                      <th className="py-3 px-5 font-medium">Đánh giá</th>
                      <th className="py-3 px-5 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F0]">
                    {comments.map((comment) => (
                      <tr className="hover:bg-[#F8FBF9] transition-colors" key={comment._id}>
                        <td className="py-3.5 px-5 font-semibold text-[#153D31]">
                          {typeof comment.user === 'object' && comment.user !== null ? comment.user.name : 'Độc giả'}
                        </td>
                        <td className="py-3.5 px-5 text-[#526B86] font-medium">{comment.bookTitle || 'Sách'}</td>
                        <td className="py-3.5 px-5 text-[#526B86] max-w-xs truncate">{comment.body}</td>
                        <td className="py-3.5 px-5">
                          {comment.rating ? (
                            <div className="flex items-center text-amber-500 gap-0.5">
                              <Star size={13} fill="currentColor" />
                              <span className="font-bold text-[#153D31] ml-1">{comment.rating}</span>
                            </div>
                          ) : (
                            <span className="text-[#97A8B8]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => void handleDeleteComment(comment._id)}
                            className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline cursor-pointer"
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-6 text-sm text-[#526B86]">Chưa có bình luận nào trên các đầu sách hiện tại.</p>
              )}
            </div>
          </div>

          {/* ── Reports section (preserved) ── */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF3F0] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#153D31]">Báo cáo mới nhất</h3>
              <Link className="text-[12px] font-medium text-[#24795C] hover:underline" to="/admin/reports">Xem tất cả →</Link>
            </div>
            {loading ? (
              <p className="px-5 py-6 text-sm text-[#526B86]">Đang tải...</p>
            ) : recentReports.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EEF3F0] bg-[#F8FBF9] text-[#526B86] uppercase tracking-wider">
                      <th className="py-3 px-5 font-medium">Chủ đề</th>
                      <th className="py-3 px-5 font-medium">Trạng thái</th>
                      <th className="py-3 px-5 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F0]">
                    {recentReports.map((report) => (
                      <tr className="hover:bg-[#F8FBF9] transition-colors" key={report._id ?? report.id}>
                        <td className="py-3.5 px-5 font-semibold text-[#153D31]">{report.subject || 'Phản hồi'}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Link to="/admin/reports" className="inline-flex items-center gap-1 text-[#24795C] font-bold hover:underline">
                            Xử lý <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-[#526B86]">Không có báo cáo nào.</p>
            )}
          </div>

          {/* ── Recent users (preserved) ── */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF3F0] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#153D31]">Người dùng mới</h3>
              <Link className="text-[12px] font-medium text-[#24795C] hover:underline" to="/admin/users">Quản lý →</Link>
            </div>
            {loading ? <p className="px-5 py-6 text-sm text-[#526B86]">Đang tải...</p> : recentUsers.length ? (
              <ul className="divide-y divide-[#EEF3F0]">
                {recentUsers.map((u) => (
                  <li className="flex items-center justify-between gap-3 px-5 py-3" key={u._id ?? u.id}>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#153D31]">{u.name}</p>
                      <p className="truncate text-[11px] text-[#526B86]">{u.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#DDE9E6] bg-[#F8FBF9] px-2.5 py-1 text-[10px] font-bold text-[#526B86]">{u.role}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-6 text-sm text-[#526B86]">Chưa có tài khoản nào.</p>}
          </div>
        </div>

        {/* ──── RIGHT COLUMN ──── */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            {/* Mint header */}
            <div className="rounded-t-xl bg-[#E3F4EB] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#153D31]">Thao tác nhanh</h3>
              <p className="mt-0.5 text-[12px] text-[#526B86]">Quản lý hệ thống dễ dàng hơn</p>
            </div>
            <div className="space-y-2 p-4">
              {quickActions.map(({ title, desc, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-3 rounded-[10px] border border-[#DDE9E6] px-3 py-3 transition-colors hover:border-[#24795C]/30 hover:bg-[#F8FBF9]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E3F4EB] text-[#24795C]">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#153D31]">{title}</p>
                    <p className="text-[10px] text-[#526B86]">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[#97A8B8]" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF3F0] px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#24795C]" />
                <h3 className="text-[14px] font-semibold text-[#153D31]">Hoạt động gần đây</h3>
              </div>
              <Link to="/admin/reports" className="text-[12px] font-medium text-[#24795C] hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="divide-y divide-[#EEF3F0]">
              {recentActivity.length > 0 ? recentActivity.map((activity) => {
                // Biến ActivityIcon nhận giá trị từ activity.icon. const không gán lại; let có thể cập nhật.
                const ActivityIcon = activity.icon;
                // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <Link key={activity.id} to={activity.href} className="flex items-start gap-3 p.
                return (
                  <Link key={activity.id} to={activity.href} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[#F8FBF9]">
                    <span className="mt-0.5 grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#E3F4EB] text-[#24795C]">
                      <ActivityIcon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium text-[#153D31]">{activity.title}</span>
                      <span className="block truncate text-[11px] text-[#526B86]">{activity.detail}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-[#97A8B8]">
                      {new Date(activity.date!).toLocaleDateString('vi-VN')}
                    </span>
                  </Link>
                );
              }) : (
                <p className="px-5 py-6 text-[12px] text-[#526B86]">Chưa có hoạt động mới.</p>
              )}
            </div>
            {/* System status is reported by the authenticated backend endpoint. */}
            <div className="rounded-b-xl bg-[#E3F4EB] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${summary?.system.api === 'connected' && summary.system.database === 'connected' ? 'bg-[#24795C]' : 'bg-amber-500'}`} />
                <p className="text-[12px] font-semibold text-[#153D31]">
                  {summary?.system.api === 'connected' && summary.system.database === 'connected' ? 'API và cơ sở dữ liệu đã kết nối' : 'Chưa xác minh được trạng thái hệ thống'}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-[#526B86]">
                API server: {summary?.system.api === 'connected' ? 'Đã kết nối' : 'Không xác định'} · MongoDB: {summary?.system.database === 'connected' ? 'Đã kết nối' : 'Không xác định'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
