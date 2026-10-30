// Import { useEffect, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderAccountPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState, type FormEvent } from 'react';
// Import { Bookmark, CreditCard, History, LogOut, MessageSquareText, Send, Trash2 } từ lucide-react để dùng trong giao diện.
import { Bookmark, CreditCard, History, LogOut, MessageSquareText, Send, Trash2 } from 'lucide-react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import { createReaderSubscription, deleteReaderBookmark, deleteReadingProgress, errorMe từ ../api/client để dùng trong giao diện.
import {
  createReaderSubscription, deleteReaderBookmark, deleteReadingProgress, errorMessage,
  fetchMySubscription, fetchReaderBookmarks, fetchReadingProgress, submitReaderReport,
} from '../api/client';
// Import type { Bookmark as BookmarkType, ReadingProgress, Subscription } từ ../types để dùng trong giao diện.
import type { Bookmark as BookmarkType, ReadingProgress, Subscription } from '../types';

// Hàm ReaderAccountPage: Quản lý bookmark, thống kê lượt đọc, thuê bao và gửi phản hồi của độc giả.
/**
 * Hàm/thành phần ReaderAccountPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, useEffect, navigate, allSettled, fetchReaderBookmarks, fetchReadingProgress.
 */
export function ReaderAccountPage() {
  // Biến { user, loading: authLoading, logou nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading, logout } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [bookmarks, setBookmarks] nhận giá trị từ useState<BookmarkType[]>([]). const không gán lại; let có thể cập nhật.
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  // Biến [progress, setProgress] nhận giá trị từ useState<ReadingProgress[]>([]). const không gán lại; let có thể cập nhật.
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  // Biến [subscription, setSubscription] nhận giá trị từ useState<Subscription | null>(null). const không gán lại; let có thể cập nhật.
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [saving, setSaving] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [saving, setSaving] = useState(false);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (authLoading) return; if (!user) { navigate('/login', { rep
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return;
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/login', { replace: true, state: { from: '/account' } })
      navigate('/login', { replace: true, state: { from: '/account' } });
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi Promise.allSettled với đối số để cập nhật logic/giao diện: Promise.allSettled([fetchReaderBookmarks(), fetchReadingProgress(), fetchMySubsc
    Promise.allSettled([fetchReaderBookmarks(), fetchReadingProgress(), fetchMySubscription()])
      .then(([bookmarkResult, progressResult, subscriptionResult]) => {
        // if chỉ chạy nhánh này khi điều kiện !active đúng.
        if (!active) return;
        // Biến failures nhận giá trị từ []. const không gán lại; let có thể cập nhật.
        const failures: string[] = [];
        // if chỉ chạy nhánh này khi điều kiện bookmarkResult.status === 'fulfilled' đúng.
        if (bookmarkResult.status === 'fulfilled') setBookmarks(bookmarkResult.value.bookmarks);
        else failures.push(`Chương đã lưu: ${errorMessage(bookmarkResult.reason)}`);
        // if chỉ chạy nhánh này khi điều kiện progressResult.status === 'fulfilled' đúng.
        if (progressResult.status === 'fulfilled') setProgress(progressResult.value.progress);
        else failures.push(`Lịch sử đọc: ${errorMessage(progressResult.reason)}`);
        // if chỉ chạy nhánh này khi điều kiện subscriptionResult.status === 'fulfilled' đúng.
        if (subscriptionResult.status === 'fulfilled') setSubscription(subscriptionResult.value);
        else failures.push(`Thuê bao: ${errorMessage(subscriptionResult.reason)}`);
        // if chỉ chạy nhánh này khi điều kiện failures.length đúng.
        if (failures.length) setError(`Một số dữ liệu tài khoản chưa tải được. ${failures.join(' · ')}`);
      })
      .finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  // Hàm removeSavedChapter: Bỏ một chương khỏi bookmark và đồng bộ danh sách tài khoản.
  /**
   * Hàm/thành phần removeSavedChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: bookmark.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, deleteReaderBookmark, setBookmarks, filter, setNotice, errorMessage.
   */
  async function removeSavedChapter(bookmark: BookmarkType) {
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteReaderBookmark(bookmark._id)
      await deleteReaderBookmark(bookmark._id);
      // Gọi/thực thi setBookmarks với đối số để cập nhật logic/giao diện: setBookmarks((current) => current.filter((item) => item._id !== bookmark._id))
      setBookmarks((current) => current.filter((item) => item._id !== bookmark._id));
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã bỏ lưu chương.')
      setNotice('Đã bỏ lưu chương.');
    } catch (removeError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(removeError))
      setError(errorMessage(removeError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm removeProgress: Xóa bản ghi thống kê lượt đọc được chọn sau khi độc giả xác nhận.
  /**
   * Hàm/thành phần removeProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: item.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, setSaving, setError, deleteReadingProgress, setProgress, filter, setNotice, errorMessage.
   */
  async function removeProgress(item: ReadingProgress) {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Xóa thống kê lượt đọc của sách này?') đúng.
    if (!window.confirm('Xóa thống kê lượt đọc của sách này?')) return;
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteReadingProgress(item._id)
      await deleteReadingProgress(item._id);
      // Gọi/thực thi setProgress với đối số để cập nhật logic/giao diện: setProgress((current) => current.filter((progressItem) => progressItem._id !== i
      setProgress((current) => current.filter((progressItem) => progressItem._id !== item._id));
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã xóa thống kê lượt đọc.')
      setNotice('Đã xóa thống kê lượt đọc.');
    } catch (removeError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(removeError))
      setError(errorMessage(removeError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm requestSubscription: Gửi yêu cầu thuê bao và hiển thị chỉ dẫn thanh toán từ backend.
  /**
   * Hàm/thành phần requestSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: plan.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, setNotice, createReaderSubscription, setSubscription, errorMessage.
   */
  async function requestSubscription(plan: 'premium_monthly' | 'vip_monthly') {
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await createReaderSubscription(plan). const không gán lại; let có thể cập nhật.
      const result = await createReaderSubscription(plan);
      // Gọi/thực thi setSubscription với đối số để cập nhật logic/giao diện: setSubscription(result)
      setSubscription(result);
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã tạo yêu cầu. Vui lòng chuyển khoản theo thông tin bên dưới và chờ
      setNotice('Đã tạo yêu cầu. Vui lòng chuyển khoản theo thông tin bên dưới và chờ quản trị viên xác nhận.');
    } catch (requestError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(requestError))
      setError(errorMessage(requestError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm sendReport: Gửi liên hệ hoặc báo lỗi với nội dung được backend kiểm tra.
  /**
   * Hàm/thành phần sendReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, FormData, setSaving, setError, setNotice, submitReaderReport, String, get.
   * Được tham chiếu tại: admin-web/src/pages/ReaderSupportPage.tsx.
   */
  async function sendReport(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Biến formElement nhận giá trị từ event.currentTarget. const không gán lại; let có thể cập nhật.
    const formElement = event.currentTarget;
    // Biến form nhận giá trị từ new FormData(formElement). const không gán lại; let có thể cập nhật.
    const form = new FormData(formElement);
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await submitReaderReport({ subject: String(form.get('su. const không gán lại; let có thể cập nhật.
      const result = await submitReaderReport({
        subject: String(form.get('subject') ?? '').trim(),
        message: String(form.get('message') ?? '').trim(),
        type: String(form.get('type')) === 'bug' ? 'bug' : 'contact',
      });
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(result.confirmation_email_sent === false ? `Đã tiếp nhận yêu cầu${resu
      setNotice(result.confirmation_email_sent === false
        ? `Đã tiếp nhận yêu cầu${result.id ? ` (mã ${result.id})` : ''}, nhưng chưa gửi được email xác nhận.`
        : `Đã tiếp nhận yêu cầu và gửi email xác nhận${result.id ? ` (mã ${result.id})` : ''}.`);
      // Gọi/thực thi formElement.reset với đối số để cập nhật logic/giao diện: formElement.reset()
      formElement.reset();
    } catch (reportError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(reportError))
      setError(errorMessage(reportError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm handleLogout: Thu hồi phiên user và chuyển về trang đăng nhập độc giả.
  /**
   * Hàm/thành phần handleLogout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, logout, navigate, setError, errorMessage.
   * Được tham chiếu tại: admin-web/src/components/AdminLayout.tsx, admin-web/src/components/ReaderShell.tsx.
   */
  async function handleLogout() {
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await logout()
      await logout();
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/', { replace: true })
      navigate('/', { replace: true });
    } catch (logoutError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(logoutError))
      setError(errorMessage(logoutError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // if chỉ chạy nhánh này khi điều kiện authLoading || !user đúng.
  if (authLoading || !user) {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="grid min-h-screen place-items-center bg-[#f7f8f6] text-sm text-s.
    return <div className="grid min-h-screen place-items-center bg-[#f7f8f6] text-sm text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <ReaderShell title="Cài đặt tài khoản" subtitle="Quản lý thông tin cá nhân và .
  return (
    <ReaderShell title="Cài đặt tài khoản" subtitle="Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm đọc.">
      <div className="reader-account-page">
      <main className="space-y-6">
        <section className="account-summary-panel">
          <p className="eyebrow">Không gian độc giả</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Tài khoản của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">{user.name} · {user.email}</p>
          {user.role === 'ADMIN' && <Link className="button-secondary !min-h-9 !px-3 !py-2" to="/admin/dashboard">Quản trị</Link>}
          <button className="button-secondary !min-h-9 !px-3 !py-2" disabled={saving} onClick={() => void handleLogout()} type="button"><LogOut size={14} /> Đăng xuất</button>
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
                    // Biến book nhận giá trị từ asObject(item.book). const không gán lại; let có thể cập nhật.
                    const book = asObject(item.book);
                    // Biến chapter nhận giá trị từ asObject(item.chapter). const không gán lại; let có thể cập nhật.
                    const chapter = asObject(item.chapter);
                    // Biến bookId nhận giá trị từ referenceId(item.book). const không gán lại; let có thể cập nhật.
                    const bookId = referenceId(item.book);
                    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <li className="flex items-center justify-between gap-3 py-3" key={item._id}> <Li.
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
                    // Biến book nhận giá trị từ asObject(item.book). const không gán lại; let có thể cập nhật.
                    const book = asObject(item.book);
                    // Biến bookId nhận giá trị từ referenceId(item.book). const không gán lại; let có thể cập nhật.
                    const bookId = referenceId(item.book);
                    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <li className="flex items-center justify-between gap-3 py-3" key={item._id}> <Li.
                    return <li className="flex items-center justify-between gap-3 py-3" key={item._id}>
                      <Link className="min-w-0 truncate text-sm font-semibold hover:text-[#31564a]" to={bookId ? `/books/${encodeURIComponent(bookId)}` : '/'}>{book?.title ?? 'Sách'}</Link>
                      <span className="shrink-0 text-xs text-slate-500">{item.completed_chapter_count ?? 0} chương hoàn thành</span>
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
    </ReaderShell>
  );
}

// Hàm asObject: Chuyển tham chiếu populate thành object an toàn để hiển thị tên sách/chương.
/**
 * Hàm/thành phần asObject: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: admin-web/src/pages/ReaderFavoritePage.tsx.
 */
function asObject<T extends object>(value: string | T): T | null {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof value === 'object' && value !== null ? value : null.
  return typeof value === 'object' && value !== null ? value : null;
}

// Hàm referenceId: Lấy ID từ tham chiếu chuỗi hoặc document populate.
/**
 * Hàm/thành phần referenceId: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: admin-web/src/pages/ReaderBookPage.tsx.
 */
function referenceId(value: string | { _id?: string; id?: string }): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof value === 'string' ? value : value._id ?? value.id ?? ''.
  return typeof value === 'string' ? value : value._id ?? value.id ?? '';
}

// Hàm planLabel: Dịch mã gói thuê bao thành tên tiếng Việt.
/**
 * Hàm/thành phần planLabel: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: plan.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function planLabel(plan: Subscription['plan']): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: plan === 'vip_monthly' ? 'VIP tháng' : 'Premium tháng'.
  return plan === 'vip_monthly' ? 'VIP tháng' : 'Premium tháng';
}

// Hàm statusLabel: Dịch trạng thái thuê bao sang nhãn thân thiện cho độc giả.
/**
 * Hàm/thành phần statusLabel: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: status.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: return.
 * Được tham chiếu tại: admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
 */
function statusLabel(status: Subscription['status']): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ({ pending: 'Chờ duyệt', active: 'Đang hoạt động', rejected: 'Đã từ chối', expir.
  return ({ pending: 'Chờ duyệt', active: 'Đang hoạt động', rejected: 'Đã từ chối', expired: 'Đã hết hạn' })[status];
}

// Hàm formatDate: Định dạng thời điểm thuê bao theo locale Việt Nam.
/**
 * Hàm/thành phần formatDate: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, isNaN, getTime, DateTimeFormat, format.
 * Được tham chiếu tại: admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx, admin-web/src/pages/ReaderBookPage.tsx.
 */
function formatDate(value: string): string {
  // Biến date nhận giá trị từ new Date(value). const không gán lại; let có thể cập nhật.
  const date = new Date(value);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyl.
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

// Hàm PaymentInstructions: Hiển thị đầy đủ số tiền, nội dung và tài khoản nhận chuyển khoản từ API.
/**
 * Hàm/thành phần PaymentInstructions: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { subscription }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: toLocaleString.
 */
function PaymentInstructions({ subscription }: { subscription: Subscription }) {
  // Biến instructions nhận giá trị từ subscription.payment_instructions. const không gán lại; let có thể cập nhật.
  const instructions = subscription.payment_instructions;
  // Biến amount nhận giá trị từ instructions?.amount_vnd ?? subscription.amount_vnd. const không gán lại; let có thể cập nhật.
  const amount = instructions?.amount_vnd ?? subscription.amount_vnd;
  // Biến note nhận giá trị từ instructions?.transfer_note ?? subscription.transfer_no. const không gán lại; let có thể cập nhật.
  const note = instructions?.transfer_note ?? subscription.transfer_note;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-xs sm:grid-co.
  return <dl className="mt-4 grid gap-2 border-t border-slate-200 pt-3 text-xs sm:grid-cols-2">
    <div><dt className="text-slate-500">Số tiền</dt><dd className="mt-1 font-bold">{amount.toLocaleString('vi-VN')} ₫</dd></div>
    <div><dt className="text-slate-500">Nội dung chuyển khoản</dt><dd className="mt-1 font-bold">{note || '—'}</dd></div>
    <div><dt className="text-slate-500">Ngân hàng</dt><dd className="mt-1 font-semibold">{instructions?.bank_name || 'Chưa cấu hình'}</dd></div>
    <div><dt className="text-slate-500">Tài khoản nhận</dt><dd className="mt-1 font-semibold">{instructions?.bank_account || 'Chưa cấu hình'} {instructions?.bank_account_name ? `· ${instructions.bank_account_name}` : ''}</dd></div>
  </dl>;
}
