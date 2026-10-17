import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Bookmark, CreditCard, History, LogOut, MessageSquareText, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createReaderSubscription, deleteReaderBookmark, deleteReadingProgress, errorMessage,
  fetchMySubscription, fetchReaderBookmarks, fetchReadingProgress, submitReaderReport,
  updateReadingProgress,
} from '../api/client';
import type { Bookmark as BookmarkType, ReadingProgress, Subscription } from '../types';

// Hàm ReaderAccountPage: Quản lý bookmark, thống kê lượt đọc, thuê bao và gửi phản hồi của độc giả.
export function ReaderAccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/account' } });
      return;
    }
    let active = true;
    Promise.all([fetchReaderBookmarks(), fetchReadingProgress(), fetchMySubscription()])
      .then(([bookmarkResult, progressResult, currentSubscription]) => {
        if (!active) return;
        setBookmarks(bookmarkResult.bookmarks);
        setProgress(progressResult.progress);
        setSubscription(currentSubscription);
      })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  // Hàm removeSavedChapter: Bỏ một chương khỏi bookmark và đồng bộ danh sách tài khoản.
  async function removeSavedChapter(bookmark: BookmarkType) {
    setSaving(true);
    setError('');
    try {
      await deleteReaderBookmark(bookmark._id);
      setBookmarks((current) => current.filter((item) => item._id !== bookmark._id));
      setNotice('Đã bỏ lưu chương.');
    } catch (removeError: unknown) {
      setError(errorMessage(removeError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm removeProgress: Xóa bản ghi thống kê lượt đọc được chọn sau khi độc giả xác nhận.
  async function removeProgress(item: ReadingProgress) {
    if (!window.confirm('Xóa thống kê lượt đọc của sách này?')) return;
    setSaving(true);
    setError('');
    try {
      await deleteReadingProgress(item._id);
      setProgress((current) => current.filter((progressItem) => progressItem._id !== item._id));
      setNotice('Đã xóa thống kê lượt đọc.');
    } catch (removeError: unknown) {
      setError(errorMessage(removeError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm resetProgress: Đặt lại hai bộ đếm hợp lệ của tiến độ sách mà không xóa bản ghi.
  async function resetProgress(item: ReadingProgress) {
    setSaving(true);
    setError('');
    try {
      const updated = await updateReadingProgress(item._id, { chapters_since_ad: 0, total_chapter_reads: 0 });
      setProgress((current) => current.map((progressItem) => progressItem._id === item._id ? updated : progressItem));
      setNotice('Đã đặt lại thống kê lượt đọc.');
    } catch (resetError: unknown) {
      setError(errorMessage(resetError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm requestSubscription: Gửi yêu cầu thuê bao và hiển thị chỉ dẫn thanh toán từ backend.
  async function requestSubscription(plan: 'premium_monthly' | 'vip_monthly') {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await createReaderSubscription(plan);
      setSubscription(result);
      setNotice('Đã tạo yêu cầu. Vui lòng chuyển khoản theo thông tin bên dưới và chờ quản trị viên xác nhận.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm sendReport: Gửi liên hệ hoặc báo lỗi với nội dung được backend kiểm tra.
  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await submitReaderReport({
        subject: String(form.get('subject') ?? '').trim(),
        message: String(form.get('message') ?? '').trim(),
        type: String(form.get('type')) === 'bug' ? 'bug' : 'contact',
      });
      setNotice(`Đã gửi phản hồi${result.id ? ` (mã ${result.id})` : ''}.`);
      formElement.reset();
    } catch (reportError: unknown) {
      setError(errorMessage(reportError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm handleLogout: Thu hồi phiên user và chuyển về trang đăng nhập độc giả.
  async function handleLogout() {
    setSaving(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (logoutError: unknown) {
      setError(errorMessage(logoutError));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8f6] text-sm text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  }
  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#202b28]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-7">
          <Link className="inline-flex items-center gap-2 font-extrabold tracking-[0.08em] text-[#203a34]" to="/">
            <BookOpen size={20} /> OPENBOOK
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">{user.name} · {user.email}</span>
            {user.role === 'ADMIN' && <Link className="button-secondary !min-h-9 !px-3 !py-2" to="/admin/dashboard">Quản trị</Link>}
            <button className="button-secondary !min-h-9 !px-3 !py-2" disabled={saving} onClick={() => void handleLogout()} type="button">
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] space-y-6 px-4 py-7 sm:px-7 sm:py-10">
        <section>
          <p className="eyebrow">Không gian độc giả</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#203a34]">Tài khoản của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">Quản lý chương đã lưu, lịch sử đọc, gói thành viên và yêu cầu hỗ trợ.</p>
        </section>
        {error && <p className="border-l-2 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
        {notice && <p className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
        {loading ? <p className="border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">Đang tải dữ liệu tài khoản…</p> : (
          <>
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2"><Bookmark className="text-[#31564a]" size={18} /><h2 className="font-bold">Chương đã lưu</h2></div>
                {bookmarks.length ? <ul className="mt-4 divide-y divide-slate-100">
                  {bookmarks.map((item) => {
                    const book = asObject(item.book);
                    const chapter = asObject(item.chapter);
                    const bookId = referenceId(item.book);
                    return <li className="flex items-center justify-between gap-3 py-3" key={item._id}>
                      <Link className="min-w-0 hover:text-[#31564a]" to={bookId ? `/books/${encodeURIComponent(bookId)}` : '/'}>
                        <span className="block truncate text-sm font-semibold">{book?.title ?? 'Sách'}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">{chapter?.chapter_number ? `Chương ${chapter.chapter_number}: ` : ''}{chapter?.title ?? 'Chương đã lưu'}</span>
                      </Link>
                      <button aria-label="Bỏ lưu chương" className="icon-button icon-button-danger" disabled={saving} onClick={() => void removeSavedChapter(item)} type="button"><Trash2 size={15} /></button>
                    </li>;
                  })}
                </ul> : <p className="mt-4 text-sm text-slate-500">Bạn chưa lưu chương nào. Hãy mở trang sách để lưu chương đang đọc.</p>}
              </div>

              <div className="border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2"><History className="text-[#31564a]" size={18} /><h2 className="font-bold">Thống kê lượt đọc</h2></div>
                {progress.length ? <ul className="mt-4 divide-y divide-slate-100">
                  {progress.map((item) => {
                    const book = asObject(item.book);
                    const bookId = referenceId(item.book);
                    return <li className="flex items-center justify-between gap-3 py-3" key={item._id}>
                      <Link className="min-w-0 truncate text-sm font-semibold hover:text-[#31564a]" to={bookId ? `/books/${encodeURIComponent(bookId)}` : '/'}>{book?.title ?? 'Sách'}</Link>
                      <span className="shrink-0 text-xs text-slate-500">{item.total_chapter_reads} lượt</span>
                      <button aria-label="Đặt lại thống kê" className="icon-button" disabled={saving || item.total_chapter_reads === 0} onClick={() => void resetProgress(item)} type="button">↻</button>
                      <button aria-label="Xóa thống kê" className="icon-button icon-button-danger" disabled={saving} onClick={() => void removeProgress(item)} type="button"><Trash2 size={15} /></button>
                    </li>;
                  })}
                </ul> : <p className="mt-4 text-sm text-slate-500">Chưa có lượt đọc được ghi nhận. Tiến độ được cập nhật khi bạn mở nội dung sách.</p>}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2"><CreditCard className="text-[#31564a]" size={18} /><h2 className="font-bold">Gói thành viên</h2></div>
              {subscription ? (
                <div className="mt-4 border border-slate-200 bg-[#fafbf9] p-4">
                  <p className="text-sm font-semibold">{planLabel(subscription.plan)} · {statusLabel(subscription.status)}</p>
                  {subscription.expires_at && <p className="mt-1 text-xs text-slate-500">Hết hạn: {formatDate(subscription.expires_at)}</p>}
                  {subscription.status === 'pending' && <PaymentInstructions subscription={subscription} />}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Bạn chưa có yêu cầu thuê bao.</p>}
              {!subscription || ['rejected', 'expired'].includes(subscription.status) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="button-secondary" disabled={saving} onClick={() => void requestSubscription('premium_monthly')} type="button">Đăng ký Premium tháng</button>
                  <button className="button-primary" disabled={saving} onClick={() => void requestSubscription('vip_monthly')} type="button">Đăng ký VIP tháng</button>
                </div>
              ) : null}
              {subscription?.status === 'pending' && <p className="mt-3 text-xs text-slate-500">Yêu cầu đang chờ ADMIN đối soát; quyền thành viên chỉ được bật sau khi duyệt.</p>}
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2"><MessageSquareText className="text-[#31564a]" size={18} /><h2 className="font-bold">Liên hệ & báo lỗi</h2></div>
              <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void sendReport(event)}>
                <label className="form-label">Loại yêu cầu
                  <select className="form-input mt-2" name="type"><option value="contact">Liên hệ hỗ trợ</option><option value="bug">Báo lỗi kỹ thuật</option></select>
                </label>
                <label className="form-label">Tiêu đề
                  <input className="form-input mt-2" maxLength={200} name="subject" required />
                </label>
                <label className="form-label sm:col-span-2">Nội dung
                  <textarea className="form-input mt-2 min-h-28" maxLength={5000} name="message" required />
                </label>
                <button className="button-primary sm:col-span-2 sm:justify-self-start" disabled={saving} type="submit">
                  <Send size={15} /> {saving ? 'Đang gửi…' : 'Gửi yêu cầu'}
                </button>
              </form>
              <p className="mt-3 text-xs text-slate-500">Hệ thống ghi nhận yêu cầu trước; nếu email quản trị chưa cấu hình, màn hình sẽ báo mã yêu cầu để tra cứu.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// Hàm asObject: Chuyển tham chiếu populate thành object an toàn để hiển thị tên sách/chương.
function asObject<T extends object>(value: string | T): T | null {
  return typeof value === 'object' && value !== null ? value : null;
}

// Hàm referenceId: Lấy ID từ tham chiếu chuỗi hoặc document populate.
function referenceId(value: string | { _id?: string; id?: string }): string {
  return typeof value === 'string' ? value : value._id ?? value.id ?? '';
}

// Hàm planLabel: Dịch mã gói thuê bao thành tên tiếng Việt.
function planLabel(plan: Subscription['plan']): string {
  return plan === 'vip_monthly' ? 'VIP tháng' : 'Premium tháng';
}

// Hàm statusLabel: Dịch trạng thái thuê bao sang nhãn thân thiện cho độc giả.
function statusLabel(status: Subscription['status']): string {
  return ({ pending: 'Chờ duyệt', active: 'Đang hoạt động', rejected: 'Đã từ chối', expired: 'Đã hết hạn' })[status];
}

// Hàm formatDate: Định dạng thời điểm thuê bao theo locale Việt Nam.
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

// Hàm PaymentInstructions: Hiển thị đầy đủ số tiền, nội dung và tài khoản nhận chuyển khoản từ API.
function PaymentInstructions({ subscription }: { subscription: Subscription }) {
  const instructions = subscription.payment_instructions;
  const amount = instructions?.amount_vnd ?? subscription.amount_vnd;
  const note = instructions?.transfer_note ?? subscription.transfer_note;
  return <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-xs sm:grid-cols-2">
    <div><dt className="text-slate-500">Số tiền</dt><dd className="mt-1 font-bold">{amount.toLocaleString('vi-VN')} ₫</dd></div>
    <div><dt className="text-slate-500">Nội dung chuyển khoản</dt><dd className="mt-1 font-bold">{note || '—'}</dd></div>
    <div><dt className="text-slate-500">Ngân hàng</dt><dd className="mt-1 font-semibold">{instructions?.bank_name || 'Chưa cấu hình'}</dd></div>
    <div><dt className="text-slate-500">Tài khoản nhận</dt><dd className="mt-1 font-semibold">{instructions?.bank_account || 'Chưa cấu hình'} {instructions?.bank_account_name ? `· ${instructions.bank_account_name}` : ''}</dd></div>
  </dl>;
}
