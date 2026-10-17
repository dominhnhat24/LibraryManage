import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRight, BookOpen, BookText, Calendar, ChevronRight,
  Clock, CreditCard, FileText, MoreVertical, Plus, Star, Trash2, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import {
  errorMessage, fetchBooks, fetchChapters, fetchPendingSubscriptions,
  fetchRecentUsers, fetchReports, fetchUsers, fetchBookComments, deleteBookComment,
} from '../api/client';
import type { Book, User, Report } from '../types';
import { useAuth } from '../auth/AuthContext';

/* ───── Comment type (kept from original) ───── */
export interface CommentItem {
  _id: string;
  body: string;
  rating?: number | null;
  user?: any;
  book?: any;
  createdAt?: string;
  bookTitle?: string;
}

/* ───── Dashboard counts ───── */
interface DashboardCounts {
  books: number | null;
  chapters: number | null;
  users: number | null;
  pendingSubscriptions: number | null;
  openReports: number | null;
}

const emptyCounts: DashboardCounts = {
  books: null, chapters: null, users: null, pendingSubscriptions: null, openReports: null,
};

/* ═══════════════════════════════════════════════ */
export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>(emptyCounts);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<(CommentItem & { bookTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Current date / time for the greeting */
  const now = useMemo(() => new Date(), []);
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  /* ── Load data ── */
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          fetchBooks({ page: 1, limit: 5 }),
          fetchChapters({ page: 1, limit: 1 }),
          fetchUsers({ page: 1, limit: 1 }),
          fetchPendingSubscriptions(),
          fetchReports({ page: 1, limit: 5, status: 'open' }),
          fetchRecentUsers(),
        ]);
        if (!active) return;

        const booksResult = results[0].status === 'fulfilled' ? results[0].value : null;
        setCounts({
          books: booksResult ? booksResult.pagination.total : null,
          chapters: results[1].status === 'fulfilled' ? results[1].value.pagination.total : null,
          users: results[2].status === 'fulfilled' ? results[2].value.pagination.total : null,
          pendingSubscriptions: results[3].status === 'fulfilled' ? results[3].value.pagination.total : null,
          openReports: results[4].status === 'fulfilled' ? results[4].value.pagination.total : null,
        });
        if (booksResult) setRecentBooks(booksResult.books);
        if (results[5].status === 'fulfilled') setRecentUsers(results[5].value.slice(0, 6));
        if (results[4].status === 'fulfilled') setRecentReports(results[4].value.reports.slice(0, 5));

        // Fetch comments from books
        if (booksResult && booksResult.books.length > 0) {
          let all: (CommentItem & { bookTitle?: string })[] = [];
          for (const book of booksResult.books) {
            try {
              const res = await fetchBookComments(book._id);
              if (res?.comments) all = [...all, ...res.comments.map((c) => ({ ...c, bookTitle: book.title }))];
            } catch { /* skip */ }
          }
          setComments(all.slice(0, 10));
        }

        const failed = results.find((r) => r.status === 'rejected');
        if (failed?.status === 'rejected') setError(errorMessage(failed.reason));
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
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

  /* ── Stat cards config ── */
  const stats = [
    { label: 'Tổng số sách', value: counts.books, icon: BookOpen, color: '#24795C' },
    { label: 'Người dùng', value: counts.users, icon: Users, color: '#5DAEFF' },
    { label: 'Thuê bao đang hoạt động', value: counts.pendingSubscriptions, icon: CreditCard, color: '#57A982' },
    { label: 'Báo cáo chờ xử lý', value: counts.openReports, icon: FileText, color: '#E8913A' },
  ];

  /* ── Quick actions ── */
  const quickActions = [
    { title: 'Thêm sách mới', desc: 'Tạo đầu sách và tải file PDF', href: '/admin/books', icon: Plus },
    { title: 'Quản lý người dùng', desc: 'Xem và chỉnh sửa tài khoản', href: '/admin/users', icon: Users },
    { title: 'Xử lý thuê bao', desc: 'Duyệt yêu cầu và cấp VIP', href: '/admin/subscriptions', icon: CreditCard },
    { title: 'Xem báo cáo', desc: 'Thống kê và phản hồi', href: '/admin/reports', icon: FileText },
  ];

  const categoryLabel: Record<string, string> = { ebook: 'Ebook', audiobook: 'Audiobook', comic: 'Truyện tranh', webnovel: 'Webnovel' };
  const categoryColor: Record<string, string> = { ebook: '#24795C', audiobook: '#5DAEFF', comic: '#8B5CF6', webnovel: '#F59E0B' };

  /* Genre distribution from real books */
  const genreDist = useMemo(() => {
    const map: Record<string, number> = {};
    recentBooks.forEach((b) => { map[b.category] = (map[b.category] || 0) + 1; });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map).map(([cat, count]) => ({
      category: cat,
      label: categoryLabel[cat] || cat,
      count,
      pct: Math.round((count / total) * 100),
      color: categoryColor[cat] || '#24795C',
    }));
  }, [recentBooks]);

  const statusBadge = (status: string) => {
    if (status === 'published') return 'border-[#C3E5D0] bg-[#EAFAF0] text-[#24795C]';
    return 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]';
  };

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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#153D31]">
            Xin chào, {currentUser?.name ?? 'Admin'} 👋
          </h1>
          <p className="mt-1 text-[14px] text-[#526B86]">
            Chào mừng bạn quay lại! Dưới đây là tổng quan hoạt động hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[#526B86]">
          <Calendar size={20} />
          <div className="text-right">
            <p className="text-[13px] font-medium text-[#153D31]">{dateStr}</p>
            <p className="text-[13px] text-[#526B86]">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* ═══ TWO-COLUMN DASHBOARD GRID ═══ */}
      <div className="grid grid-cols-[minmax(0,1fr)_292px] gap-4 items-start">
        {/* ──── LEFT / MAIN COLUMN ──── */}
        <div className="min-w-0 space-y-4">
          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="relative rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]"
              >
                <button className="absolute right-3 top-3 text-[#97A8B8] hover:text-[#526B86]" type="button">
                  <MoreVertical size={16} />
                </button>
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
          <div className="grid grid-cols-[1.34fr_1fr] gap-3">
            {/* Reading Activity (placeholder bar chart) */}
            <div className="rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E3F4EB] text-[#24795C]">
                    <BookOpen size={16} />
                  </span>
                  <h3 className="text-[14px] font-semibold text-[#153D31]">Thống kê lượt đọc</h3>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-lg bg-[#24795C] px-3 py-1 text-[11px] font-medium text-white" type="button">7 ngày</button>
                  <button className="rounded-lg border border-[#DDE9E6] px-3 py-1 text-[11px] font-medium text-[#526B86]" type="button">30 ngày</button>
                  <button className="rounded-lg border border-[#DDE9E6] px-3 py-1 text-[11px] font-medium text-[#526B86]" type="button">Tháng</button>
                </div>
              </div>
              {/* Simple CSS bar chart (no extra dependency) */}
              <div className="flex h-[180px] items-end gap-[18px] border-b border-[#EEF3F0] pt-2">
                {[65, 45, 80, 55, 70, 40, 90].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-[4px] transition-all"
                      style={{
                        height: `${h}%`,
                        backgroundColor: i === 6 ? '#24795C' : '#A8DCBE',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-[18px] text-[11px] text-[#526B86]">
                {(() => {
                  const labels: string[] = [];
                  for (let d = 6; d >= 0; d--) {
                    const dt = new Date(now);
                    dt.setDate(dt.getDate() - d);
                    labels.push(`${dt.getDate()}/${dt.getMonth() + 1}`);
                  }
                  return labels.map((l) => <span key={l} className="flex-1 text-center">{l}</span>);
                })()}
              </div>
            </div>

            {/* Genre Distribution (donut placeholder) */}
            <div className="rounded-xl border border-[#DDE9E6] bg-white p-5 shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
              <h3 className="mb-4 text-[14px] font-semibold text-[#153D31]">Thể loại sách</h3>
              <div className="flex items-center gap-4">
                {/* Simple donut via SVG */}
                <div className="relative h-[140px] w-[140px] shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    {(() => {
                      const colors = ['#24795C', '#5DAEFF', '#8B5CF6', '#F59E0B'];
                      let offset = 0;
                      const total = genreDist.reduce((s, g) => s + g.count, 0) || 1;
                      return genreDist.map((g, i) => {
                        const pct = (g.count / total) * 100;
                        const el = (
                          <circle
                            key={g.category}
                            cx="18" cy="18" r="15.9155"
                            fill="transparent"
                            stroke={colors[i % colors.length]}
                            strokeWidth="3.5"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={`${-offset}`}
                            strokeLinecap="round"
                          />
                        );
                        offset += pct;
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
                            style={{ backgroundColor: (categoryColor[book.category] || '#24795C') + '18', color: categoryColor[book.category] || '#24795C' }}
                          >
                            {categoryLabel[book.category] || book.category}
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
                          <button className="text-[#97A8B8] hover:text-[#526B86]" type="button">
                            <MoreVertical size={16} />
                          </button>
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
              {recentUsers.length > 0 ? recentUsers.slice(0, 5).map((u, i) => (
                <div key={u._id ?? u.id ?? i} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#E3F4EB] text-[#24795C]">
                    <Users size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[#153D31]">Người dùng mới đăng ký</p>
                    <p className="text-[11px] text-[#526B86]">{u.name}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#97A8B8]">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              )) : (
                <p className="px-5 py-6 text-[12px] text-[#526B86]">Chưa có hoạt động.</p>
              )}
            </div>
            {/* System status */}
            <div className="rounded-b-xl bg-[#E3F4EB] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#24795C]" />
                <p className="text-[12px] font-semibold text-[#153D31]">Hệ thống hoạt động ổn định</p>
              </div>
              <p className="mt-1 text-[11px] text-[#526B86]">
                API server: Đang kiểm tra · MongoDB: Đang kiểm tra
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}