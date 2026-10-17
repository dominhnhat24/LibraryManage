import { useEffect, useState } from 'react';
import {
  AlertCircle, ArrowRight, BookOpen, BookText, CreditCard, MessageSquareText, Users, Star, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { 
  errorMessage, fetchBooks, fetchChapters, fetchPendingSubscriptions, 
  fetchRecentUsers, fetchReports, fetchUsers, fetchBookComments, deleteBookComment 
} from '../api/client';
import type { User, Report } from '../types';

export interface CommentItem {
  _id: string;
  body: string;
  rating?: number | null;
  user?: any; // Dùng any hoặc mở rộng linh hoạt để tránh lệch kiểu UserReference
  book?: any;
  createdAt?: string;
  bookTitle?: string;
}

interface DashboardCounts {
  books: number | null;
  chapters: number | null;
  users: number | null;
  pendingSubscriptions: number | null;
  openReports: number | null;
}

const emptyCounts: DashboardCounts = {
  books: null,
  chapters: null,
  users: null,
  pendingSubscriptions: null,
  openReports: null,
};

export function AdminDashboard() {
  const [counts, setCounts] = useState<DashboardCounts>(emptyCounts);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  
  // State lưu danh sách bình luận thật từ DB
  const [comments, setComments] = useState<(CommentItem & { bookTitle?: string })[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        // 1. Gọi song song các API tổng quan và danh sách sách
        const results = await Promise.allSettled([
          fetchBooks({ page: 1, limit: 5 }), // Lấy 5 sách đầu tiên để check comment
          fetchChapters({ page: 1, limit: 1 }),
          fetchUsers({ page: 1, limit: 1 }),
          fetchPendingSubscriptions(),
          fetchReports({ page: 1, limit: 5, status: 'open' }),
          fetchRecentUsers(),
        ]);

        if (active) {
          const booksResult = results[0].status === 'fulfilled' ? results[0].value : null;

          setCounts({
            books: booksResult ? booksResult.pagination.total : null,
            chapters: results[1].status === 'fulfilled' ? results[1].value.pagination.total : null,
            users: results[2].status === 'fulfilled' ? results[2].value.pagination.total : null,
            pendingSubscriptions: results[3].status === 'fulfilled' ? results[3].value.pagination.total : null,
            openReports: results[4].status === 'fulfilled' ? results[4].value.pagination.total : null,
          });

          if (results[5].status === 'fulfilled') setRecentUsers(results[5].value.slice(0, 6));
          if (results[4].status === 'fulfilled') setRecentReports(results[4].value.reports.slice(0, 5));

          // 2. Tự động lấy bình luận thật từ các đầu sách có sẵn trên hệ thống
          if (booksResult && booksResult.books.length > 0) {
            let allCollectedComments: (CommentItem & { bookTitle?: string })[] = [];
            for (const book of booksResult.books) {
              try {
                const commentRes = await fetchBookComments(book._id);
                if (commentRes && commentRes.comments) {
                  const mapped = commentRes.comments.map((c) => ({
                    ...c,
                    bookTitle: book.title,
                  }));
                  allCollectedComments = [...allCollectedComments, ...mapped];
                }
              } catch {
                // Bỏ qua nếu sách chưa có comment
              }
            }
            setComments(allCollectedComments.slice(0, 10)); // Lấy tối đa 10 bình luận mới nhất
          }

          const failedRequest = results.find((result) => result.status === 'rejected');
          if (failedRequest?.status === 'rejected') setError(errorMessage(failedRequest.reason));
        }
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboardData();
    return () => { active = false; };
  }, []);

  // Hàm xử lý xóa bình luận thật qua API
  async function handleDeleteComment(commentId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    try {
      await deleteBookComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err: unknown) {
      alert(errorMessage(err) || 'Không thể xóa bình luận.');
    }
  }

  const cards = [
    { label: 'Đầu sách', value: counts.books, href: '/admin/books', icon: BookOpen, note: 'Quản lý metadata và file sách' },
    { label: 'Chương sách', value: counts.chapters, href: '/admin/chapters', icon: BookText, note: 'Sắp xếp nội dung và quyền đọc' },
    { label: 'Tài khoản', value: counts.users, href: '/admin/users', icon: Users, note: 'Quản lý role và quyền thành viên' },
    { label: 'Thuê bao chờ duyệt', value: counts.pendingSubscriptions, href: '/admin/subscriptions', icon: CreditCard, note: 'Đối soát yêu cầu thanh toán' },
    { label: 'Báo cáo mới', value: counts.openReports, href: '/admin/reports', icon: MessageSquareText, note: 'Phản hồi từ độc giả cần xử lý' },
  ];

  return (
    <AdminLayout>
      <section className="mb-7">
        <p className="eyebrow">OpenBook · Tổng quan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Bảng điều khiển</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Theo dõi hoạt động thư viện và truy cập nhanh các khu vực quản trị.</p>
      </section>

      {error && (
        <div className="mb-5 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. BẢNG BÁO CÁO SỐ LIỆU TỔNG QUAN */}
      <section aria-label="Chỉ số hệ thống" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon, note }) => (
          <Link className="group border border-[#dfded7] bg-[#fbfaf7] p-5 transition-colors hover:border-[#b9c7bd] hover:bg-white" key={href} to={href}>
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center border border-[#dfe5df] bg-[#edf2ed] text-[#31564a]"><Icon size={18} /></span>
              <ArrowRight className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#31564a]" size={17} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p aria-live="polite" className="mt-1 text-3xl font-bold tracking-tight text-[#203a34]">
              {loading || value === null ? '—' : value.toLocaleString('vi-VN')}
            </p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </Link>
        ))}
      </section>

      {/* 2. QUẢN LÝ BÌNH LUẬN THẬT TỪ DATABASE */}
      <section className="mt-7 border border-[#dfded7] bg-[#fbfaf7]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e5e4de] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#26332e]">Bình luận & Đánh giá từ Độc giả</h2>
            <p className="mt-1 text-xs text-slate-500">Xem và kiểm duyệt phản hồi thực tế trên các trang sách.</p>
          </div>
          <Link className="text-xs font-bold text-[#31564a] hover:underline" to="/admin/comments">
            Quản lý bình luận →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-6 text-sm text-slate-500">Đang tải danh sách bình luận...</p>
          ) : comments.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#efeee9] text-slate-400 uppercase tracking-wider bg-white/50">
                  <th className="py-3 px-5 font-semibold">Độc giả</th>
                  <th className="py-3 px-5 font-semibold">Tên sách</th>
                  <th className="py-3 px-5 font-semibold">Nội dung bình luận</th>
                  <th className="py-3 px-5 font-semibold">Đánh giá</th>
                  <th className="py-3 px-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeee9]">
                {comments.map((comment) => (
                  <tr className="hover:bg-white/80 transition-colors" key={comment._id}>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {typeof comment.user === 'object' && comment.user !== null ? comment.user.name : 'Độc giả'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">{comment.bookTitle || 'Sách'}</td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">{comment.body}</td>
                    <td className="py-3.5 px-5">
                      {comment.rating ? (
                        <div className="flex items-center text-amber-500 gap-0.5">
                          <Star size={13} fill="currentColor" />
                          <span className="font-bold text-slate-700 ml-1">{comment.rating}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
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
            <p className="px-5 py-6 text-sm text-slate-500">Chưa có bình luận nào trên các đầu sách hiện tại.</p>
          )}
        </div>
      </section>

      {/* 3. BẢNG BÁO CÁO PHẢN HỒI */}
      <section className="mt-7 border border-[#dfded7] bg-[#fbfaf7]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e5e4de] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#26332e]">Báo cáo mới nhất</h2>
            <p className="mt-1 text-xs text-slate-500">Các yêu cầu trợ giúp và báo cáo lỗi từ người dùng.</p>
          </div>
          <Link className="text-xs font-bold text-[#31564a] hover:underline" to="/admin/reports">Xem tất cả báo cáo →</Link>
        </div>

        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-500">Đang tải danh sách báo cáo…</p>
        ) : recentReports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#efeee9] text-slate-400 uppercase tracking-wider bg-white/50">
                  <th className="py-3 px-5 font-semibold">Chủ đề</th>
                  <th className="py-3 px-5 font-semibold">Trạng thái</th>
                  <th className="py-3 px-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeee9]">
                {recentReports.map((report) => (
                  <tr className="hover:bg-white/80 transition-colors" key={report._id ?? report.id}>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-800">{report.subject || 'Phản hồi từ độc giả'}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-block border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link to="/admin/reports" className="inline-flex items-center gap-1 text-[#31564a] font-bold hover:underline">
                        Xử lý <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-slate-500">Không có báo cáo nào cần xử lý.</p>
        )}
      </section>
      {/* DANH SÁCH NGƯỜI DÙNG MỚI */}
      <section className="mt-7 border border-[#dfded7] bg-[#fbfaf7]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e5e4de] px-5 py-4">
          <div><h2 className="text-sm font-bold text-[#26332e]">Người dùng mới</h2><p className="mt-1 text-xs text-slate-500">Tài khoản đăng ký gần đây nhất.</p></div>
          <Link className="text-xs font-bold text-[#31564a] hover:underline" to="/admin/users">Quản lý người dùng →</Link>
        </div>
        {loading ? <p className="px-5 py-6 text-sm text-slate-500">Đang tải danh sách…</p> : recentUsers.length ? (
          <ul className="divide-y divide-[#efeee9]">
            {recentUsers.map((recentUser) => (
              <li className="flex items-center justify-between gap-3 px-5 py-3" key={recentUser._id ?? recentUser.id}>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{recentUser.name}</p><p className="truncate text-xs text-slate-500">{recentUser.email}</p></div>
                <span className="shrink-0 border border-[#e2e0d8] bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{recentUser.role}</span>
              </li>
            ))}
          </ul>
        ) : <p className="px-5 py-6 text-sm text-slate-500">Chưa có tài khoản nào.</p>}
      </section>
    </AdminLayout>
  );
}