// Import { useCallback, useEffect, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/SubscriptionManagement.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useCallback, useEffect, useState } from 'react';
// Import { AlertCircle, Check, CreditCard, Eye, LoaderCircle, Save, ShieldCheck, Trash2,  từ lucide-react để dùng trong giao diện.
import { AlertCircle, Check, CreditCard, Eye, LoaderCircle, Save, ShieldCheck, Trash2, X } from 'lucide-react';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { Pagination } từ ../components/Pagination để dùng trong giao diện.
import { Pagination } from '../components/Pagination';
// Import { deleteSubscription, errorMessage, fetchSubscription, fetchSubscriptions, revie từ ../api/client để dùng trong giao diện.
import {
  deleteSubscription, errorMessage, fetchSubscription, fetchSubscriptions, reviewSubscription,
  updateSubscriptionPaymentReference,
} from '../api/client';
// Import type { PaginationData, Subscription } từ ../types để dùng trong giao diện.
import type { PaginationData, Subscription } from '../types';

// Biến emptyPagination nhận giá trị từ { total: 0, page: 1, limit: 20, totalPages: 0 }. const không gán lại; let có thể cập nhật.
const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

/**
 * Hàm/thành phần subscriberName: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: user.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: slice.
 */
function subscriberName(user: Subscription['user']): string {
  // if chỉ chạy nhánh này khi điều kiện !user đúng.
  if (!user) return 'Chưa cập nhật';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof user === 'string' ? `Tài khoản ${user.slice(-6)}` : (user.name || 'Không .
  return typeof user === 'string' ? `Tài khoản ${user.slice(-6)}` : (user.name || 'Không rõ tên');
}

/**
 * Hàm/thành phần subscriberEmail: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: user.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function subscriberEmail(user: Subscription['user']): string {
  // if chỉ chạy nhánh này khi điều kiện !user đúng.
  if (!user) return 'Chưa có email';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof user === 'string' ? user : (user.email || 'Không có email').
  return typeof user === 'string' ? user : (user.email || 'Không có email');
}

/**
 * Hàm/thành phần formatDate: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, isNaN, getTime, DateTimeFormat, format.
 * Được tham chiếu tại: admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/ReportManagement.tsx, admin-web/src/pages/ReaderBookPage.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
 */
function formatDate(value?: string | null): string {
  // if chỉ chạy nhánh này khi điều kiện !value đúng.
  if (!value) return '—';
  // Biến date nhận giá trị từ new Date(value). const không gán lại; let có thể cập nhật.
  const date = new Date(value);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyl.
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/**
 * Hàm/thành phần SubscriptionManagement: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useCallback, async, setLoading, setError, fetchSubscriptions, setSubscriptions, setPagination.
 */
export function SubscriptionManagement() {
  // Biến [subscriptions, setSubscriptions] nhận giá trị từ useState<Subscription[]>([]). const không gán lại; let có thể cập nhật.
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  // Biến [pagination, setPagination] nhận giá trị từ useState(emptyPagination). const không gán lại; let có thể cập nhật.
  const [pagination, setPagination] = useState(emptyPagination);
  // Biến [status, setStatus] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [status, setStatus] = useState('');
  // Biến [plan, setPlan] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [plan, setPlan] = useState('');
  // Biến [page, setPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [page, setPage] = useState(1);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [saving, setSaving] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [saving, setSaving] = useState(false);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');
  // Biến [selectedSubscription, setSelectedS nhận giá trị từ useState<Subscription | null>(null). const không gán lại; let có thể cập nhật.
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  // Biến [detailLoading, setDetailLoading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [detailLoading, setDetailLoading] = useState(false);
  // Biến [paymentReference, setPaymentRefere nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [paymentReference, setPaymentReference] = useState('');
  // Biến [pendingAction, setPendingAction] nhận giá trị từ useState<{ subscription: Subscription; action: 'approve. const không gán lại; let có thể cập nhật.
  const [pendingAction, setPendingAction] = useState<{ subscription: Subscription; action: 'approve' | 'reject' | 'delete' } | null>(null);

  // Biến loadSubscriptions nhận giá trị từ useCallback(async () => { setLoading(true); setError(''. const không gán lại; let có thể cập nhật.
  const loadSubscriptions = useCallback(async () => {
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await fetchSubscriptions({ page, limit: pagination.limi. const không gán lại; let có thể cập nhật.
      const result = await fetchSubscriptions({
        page,
        limit: pagination.limit,
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
      });
      // Gọi/thực thi setSubscriptions với đối số để cập nhật logic/giao diện: setSubscriptions(result.subscriptions)
      setSubscriptions(result.subscriptions);
      // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination(result.pagination)
      setPagination(result.pagination);
    } catch (loadError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
      setError(errorMessage(loadError));
    } finally {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
  }, [page, pagination.limit, status, plan]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { void loadSubscriptions(); }, [loadSubscriptions])
  useEffect(() => { void loadSubscriptions(); }, [loadSubscriptions]);

  /**
   * Hàm/thành phần openSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: subscription.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSelectedSubscription, setPaymentReference, setDetailLoading, setError, fetchSubscription, errorMessage.
   */
  async function openSubscription(subscription: Subscription) {
    // Gọi/thực thi setSelectedSubscription với đối số để cập nhật logic/giao diện: setSelectedSubscription(subscription)
    setSelectedSubscription(subscription);
    // Gọi/thực thi setPaymentReference với đối số để cập nhật logic/giao diện: setPaymentReference(subscription.payment_reference ?? '')
    setPaymentReference(subscription.payment_reference ?? '');
    // Gọi/thực thi setDetailLoading với đối số để cập nhật logic/giao diện: setDetailLoading(true)
    setDetailLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến detail nhận giá trị từ await fetchSubscription(subscription._id). const không gán lại; let có thể cập nhật.
      const detail = await fetchSubscription(subscription._id);
      // Gọi/thực thi setSelectedSubscription với đối số để cập nhật logic/giao diện: setSelectedSubscription(detail)
      setSelectedSubscription(detail);
      // Gọi/thực thi setPaymentReference với đối số để cập nhật logic/giao diện: setPaymentReference(detail.payment_reference ?? '')
      setPaymentReference(detail.payment_reference ?? '');
    } catch (loadError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
      setError(errorMessage(loadError));
    } finally {
      // Gọi/thực thi setDetailLoading với đối số để cập nhật logic/giao diện: setDetailLoading(false)
      setDetailLoading(false);
    }
  }

  /**
   * Hàm/thành phần savePaymentReference: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, updateSubscriptionPaymentReference, trim, setSelectedSubscription, setSubscriptions, map, setNotice.
   */
  async function savePaymentReference() {
    // if chỉ chạy nhánh này khi điều kiện !selectedSubscription đúng.
    if (!selectedSubscription) return;
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến updated nhận giá trị từ await updateSubscriptionPaymentReference(selectedSubscr. const không gán lại; let có thể cập nhật.
      const updated = await updateSubscriptionPaymentReference(selectedSubscription._id, paymentReference.trim());
      // Gọi/thực thi setSelectedSubscription với đối số để cập nhật logic/giao diện: setSelectedSubscription(updated)
      setSelectedSubscription(updated);
      // Gọi/thực thi setSubscriptions với đối số để cập nhật logic/giao diện: setSubscriptions((current) => current.map((item) => item._id === updated._id ? u
      setSubscriptions((current) => current.map((item) => item._id === updated._id ? updated : item));
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã cập nhật mã giao dịch.')
      setNotice('Đã cập nhật mã giao dịch.');
    } catch (saveError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(saveError))
      setError(errorMessage(saveError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  /**
   * Hàm/thành phần confirmAction: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, deleteSubscription, setNotice, reviewSubscription, setPendingAction, setPage, loadSubscriptions.
   */
  async function confirmAction() {
    // if chỉ chạy nhánh này khi điều kiện !pendingAction đúng.
    if (!pendingAction) return;
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // if chỉ chạy nhánh này khi điều kiện pendingAction.action === 'delete' đúng.
      if (pendingAction.action === 'delete') {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteSubscription(pendingAction.subscription._id)
        await deleteSubscription(pendingAction.subscription._id);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã xóa yêu cầu thuê bao đang chờ.')
        setNotice('Đã xóa yêu cầu thuê bao đang chờ.');
      } else {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await reviewSubscription(pendingAction.subscription._id, pendingAction.action)
        await reviewSubscription(pendingAction.subscription._id, pendingAction.action);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(pendingAction.action === 'approve' ? 'Đã duyệt thuê bao và kích hoạt q
        setNotice(pendingAction.action === 'approve'
          ? 'Đã duyệt thuê bao và kích hoạt quyền đọc.'
          : 'Đã từ chối yêu cầu thuê bao.');
      }
      // Gọi/thực thi setPendingAction với đối số để cập nhật logic/giao diện: setPendingAction(null)
      setPendingAction(null);
      // if chỉ chạy nhánh này khi điều kiện subscriptions.length === 1 && page > 1 đúng.
      if (subscriptions.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadSubscriptions();
    } catch (actionError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(actionError))
      setError(errorMessage(actionError));
      // Gọi/thực thi setPendingAction với đối số để cập nhật logic/giao diện: setPendingAction(null)
      setPendingAction(null);
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  /**
   * Hàm/thành phần dismissNotice: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setNotice.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx, admin-web/src/pages/ChapterManagement.tsx, admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
   */
  function dismissNotice() {
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <AdminLayout> <section className="mb-7 flex flex-col justify-between gap-5 md:fl.
  return <AdminLayout>
    <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end w-full">
      <div>
        <p className="eyebrow">Quản trị hệ thống · Thanh toán</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Thuê bao</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Đối soát yêu cầu chuyển khoản và kích hoạt quyền Premium/VIP qua Webhook hoặc duyệt thủ công.</p>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto md:ml-auto">
        <button 
          onClick={() => void loadSubscriptions()} 
          className="button-secondary text-xs flex items-center gap-2"
          type="button"
        >
          Làm mới danh sách
        </button>
      </div>
    </section>

    {/* Thống kê đồng bộ cấu trúc với Report Management */}
    <section aria-label="Thống kê thuê bao" className="mb-5 grid gap-px border border-[#DDE9E6] bg-[#DDE9E6] sm:grid-cols-2">
      <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng theo bộ lọc</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.total.toLocaleString('vi-VN')}</p></div>
      <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p></div>
    </section>

    <section className="border border-[#DDE9E6] bg-[#FFFFFF]">
      {/* Bộ lọc đồng bộ cấu trúc 2 cột với Report Management */}
      <div className="grid gap-2 border-b border-[#EEF3F0] px-4 py-4 sm:grid-cols-[minmax(220px,1fr)_200px] sm:px-6">
        <label>
          <span className="sr-only">Lọc trạng thái thuê bao</span>
          <select className="form-input h-10" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
            <option value="">Mọi trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="active">Đã kích hoạt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="expired">Hết hạn</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc gói</span>
          <select className="form-input h-10" onChange={(event) => { setPlan(event.target.value); setPage(1); }} value={plan}>
            <option value="">Mọi gói</option>
            <option value="premium_monthly">Premium theo tháng</option>
            <option value="vip_monthly">VIP theo tháng</option>
          </select>
        </label>
      </div>

      {error && <div className="m-4 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:m-6" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{error}</span></div>}
      {notice && <div className="m-4 flex items-start gap-2 border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:m-6" role="status"><Check className="mt-0.5 shrink-0" size={16} /><span>{notice}</span><button aria-label="Đóng thông báo" className="ml-auto" onClick={dismissNotice} type="button"><X size={15} /></button></div>}

      {loading ? <div className="grid min-h-64 place-items-center text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={17} />Đang tải thuê bao...</span></div>
        : subscriptions.length === 0 ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><CreditCard className="mx-auto text-slate-400" size={28} /><h3 className="mt-3 text-sm font-bold">Không có yêu cầu thuê bao</h3><p className="mt-1 text-sm text-slate-500">Thử bộ lọc khác hoặc chờ yêu cầu mới.</p></div></div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#e9e8e2] bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-3.5">Người đăng ký</th>
                <th className="px-4 py-3.5">Gói</th>
                <th className="px-4 py-3.5">Thanh toán & Cổng</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F0]">{subscriptions.map((item: any) => <tr className="hover:bg-[#FFFFFF]" key={item._id}>
              <td className="px-5 py-3.5"><p className="text-sm font-bold text-[#202b28]">{subscriberName(item.user)}</p><p className="mt-1 text-xs text-slate-500">{subscriberEmail(item.user)}</p></td>
              <td className="px-4 py-3.5"><span className="text-xs font-semibold">{item.plan === 'vip_monthly' ? 'VIP' : 'Premium'} · Tháng</span><p className="mt-1 text-[11px] text-slate-500">{Number(item.amount_vnd).toLocaleString('vi-VN')} ₫</p></td>
              <td className="px-4 py-3.5">
                <p className="font-mono text-xs font-bold text-[#24795C]">{item.transfer_note}</p>
                <p className="mt-1 text-[11px] text-slate-500">Cổng: <span className="uppercase font-semibold text-slate-700">{item.gateway || 'manual'}</span> {item.auto_approved && <span className="text-emerald-600 font-semibold">(Tự động)</span>}</p>
              </td>
              <td className="px-4 py-3.5">
                <span className={`inline-flex border px-2.5 py-1 text-[10px] font-bold ${item.status === 'active' ? 'border-[#C3E5D0] bg-[#E3F4EB] text-[#24795C]' : item.status === 'pending' ? 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]' : 'border-[#DDE9E6] bg-white text-slate-500'}`}>
                  {statusLabel(item.status)}
                </span>
                {item.status === 'active' && <p className="mt-1 text-[10px] text-slate-500">Hết hạn {formatDate(item.expires_at)}</p>}
                {item.reviewed_by && <p className="mt-1 text-[10px] text-slate-500">Duyệt bởi {reviewName(item.reviewed_by)}</p>}
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
              <td className="px-5 py-3.5">
                <div className="flex justify-end gap-2">
                  <button aria-label={`Chi tiết ${subscriberName(item.user)}`} className="icon-button" onClick={() => void openSubscription(item)} title="Xem chi tiết" type="button"><Eye size={15} /></button>
                  {item.status === 'pending' ? <>
                    <button aria-label={`Duyệt ${subscriberName(item.user)}`} className="icon-button" onClick={() => setPendingAction({ subscription: item, action: 'approve' })} title="Duyệt và cấp quyền" type="button"><ShieldCheck size={15} /></button>
                    <button aria-label={`Từ chối ${subscriberName(item.user)}`} className="icon-button icon-button-danger" onClick={() => setPendingAction({ subscription: item, action: 'reject' })} title="Từ chối" type="button"><X size={15} /></button>
                    <button aria-label={`Xóa yêu cầu ${subscriberName(item.user)}`} className="icon-button icon-button-danger" onClick={() => setPendingAction({ subscription: item, action: 'delete' })} title="Xóa yêu cầu" type="button"><Trash2 size={15} /></button>
                  </> : <span className="text-[11px] text-slate-400">Đã xử lý</span>}
                </div>
              </td>
            </tr>)}</tbody>
          </table></div>}
      {!loading && pagination.totalPages > 0 && <Pagination itemLabel="yêu cầu" onPageChange={setPage} pagination={pagination} />}
    </section>

    {/* MODAL CHI TIẾT ĐỒNG BỘ CHUẨN GIAO DIỆN VỚI REPORT MODAL */}
    {selectedSubscription && (
      <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !detailLoading) setSelectedSubscription(null); }} role="presentation">
        <section aria-labelledby="subscription-detail-title" aria-modal="true" className="modal-panel !max-w-[640px]" role="dialog">
          <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5 sm:px-8">
            <div>
              <p className="eyebrow">Chi tiết giao dịch</p>
              <h2 className="mt-1 text-xl font-bold" id="subscription-detail-title">{subscriberName(selectedSubscription.user)}</h2>
              <p className="mt-1 text-xs text-slate-500">{subscriberEmail(selectedSubscription.user)}</p>
            </div>
            <button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={() => setSelectedSubscription(null)} type="button"><X size={17} /></button>
          </header>

          <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
            {detailLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Đang tải chi tiết…</p>
            ) : (
              <>
                <div className="grid gap-4 border-b border-[#DDE9E6] pb-4 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow">Gói đăng ký</p>
                    <p className="mt-1 text-sm font-semibold">{selectedSubscription.plan === 'vip_monthly' ? 'VIP' : 'Premium'} tháng</p>
                  </div>
                  <div>
                    <p className="eyebrow">Số tiền</p>
                    <p className="mt-1 text-sm font-semibold">{Number(selectedSubscription.amount_vnd).toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <div>
                    <p className="eyebrow">Trạng thái</p>
                    <p className="mt-1 text-sm font-semibold">{statusLabel(selectedSubscription.status)}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Ngày tạo</p>
                    <p className="mt-1 text-sm">{formatDate(selectedSubscription.createdAt)}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Cổng thanh toán</p>
                    <p className="mt-1 font-semibold uppercase text-[#24795C]">{(selectedSubscription as any).gateway || 'manual'} {(selectedSubscription as any).auto_approved ? '(Tự động)' : '(Thủ công)'}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Mã Transaction (Webhook)</p>
                    <p className="mt-1 font-mono text-xs">{(selectedSubscription as any).transaction_id || 'Chưa có'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="eyebrow">Nội dung chuyển khoản</p>
                    <p className="mt-1 font-mono font-semibold text-[#24795C]">{selectedSubscription.transfer_note}</p>
                  </div>
                </div>

                <label className="field-label block">Mã giao dịch đối soát thủ công
                  <input className="form-input mt-2" disabled={selectedSubscription.status !== 'pending' || saving} maxLength={120} onChange={(event) => setPaymentReference(event.target.value)} value={paymentReference} placeholder="Nhập mã giao dịch ngân hàng nếu cần" />
                </label>

                {error && <p className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}
                {notice && <p className="border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">{notice}</p>}
              </>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:px-8">
            {selectedSubscription && selectedSubscription.status === 'pending' && (
              <button className="button-primary text-xs" disabled={saving || detailLoading} onClick={() => void savePaymentReference()} type="button">
                <Save size={15} />{saving ? 'Đang lưu…' : 'Lưu mã giao dịch'}
              </button>
            )}
            <button className="button-secondary" disabled={saving} onClick={() => setSelectedSubscription(null)} type="button">Đóng</button>
          </footer>
        </section>
      </div>
    )}

    {pendingAction && <div className="modal-backdrop" role="presentation"><section aria-labelledby="subscription-action-title" aria-modal="true" className="confirm-panel" role="alertdialog"><p className="eyebrow">Xác nhận xét duyệt</p><h2 className="mt-1 text-lg font-bold" id="subscription-action-title">{actionTitle(pendingAction.action)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{actionDescription(pendingAction.action, pendingAction.subscription)}</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={() => setPendingAction(null)} type="button">Hủy</button><button className={pendingAction.action === 'approve' ? 'button-primary' : 'button-danger'} disabled={saving} onClick={() => void confirmAction()} type="button">{saving ? <LoaderCircle className="animate-spin" size={16} /> : pendingAction.action === 'approve' ? <ShieldCheck size={16} /> : <X size={16} />}{pendingAction.action === 'approve' ? 'Duyệt và kích hoạt' : pendingAction.action === 'reject' ? 'Từ chối yêu cầu' : 'Xóa yêu cầu'}</button></div></section></div>}
  </AdminLayout>;
}

/**
 * Hàm/thành phần statusLabel: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: status.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: admin-web/src/pages/ReportManagement.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
 */
function statusLabel(status: Subscription['status']): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { pending: 'Chờ duyệt', active: 'Đã kích hoạt', rejected: 'Đã từ chối', expired:.
  return { pending: 'Chờ duyệt', active: 'Đã kích hoạt', rejected: 'Đã từ chối', expired: 'Hết hạn' }[status];
}

/**
 * Hàm/thành phần reviewName: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: reviewer optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: slice.
 */
function reviewName(reviewer?: Subscription['reviewed_by']): string {
  // if chỉ chạy nhánh này khi điều kiện !reviewer đúng.
  if (!reviewer) return '—';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof reviewer === 'string' ? `ID ${reviewer.slice(-6)}` : reviewer.name.
  return typeof reviewer === 'string' ? `ID ${reviewer.slice(-6)}` : reviewer.name;
}

/**
 * Hàm/thành phần actionTitle: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: action.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function actionTitle(action: 'approve' | 'reject' | 'delete'): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: action === 'approve' ? 'Duyệt yêu cầu thuê bao?' : action === 'reject' ? 'Từ chố.
  return action === 'approve' ? 'Duyệt yêu cầu thuê bao?'
    : action === 'reject' ? 'Từ chối yêu cầu thuê bao?' : 'Xóa yêu cầu đang chờ?';
}

/**
 * Hàm/thành phần actionDescription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: action, subscription.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: subscriberName.
 */
function actionDescription(action: 'approve' | 'reject' | 'delete', subscription: Subscription): string {
  // Biến user nhận giá trị từ subscriberName(subscription.user). const không gán lại; let có thể cập nhật.
  const user = subscriberName(subscription.user);
  // if chỉ chạy nhánh này khi điều kiện action === 'approve' đúng.
  if (action === 'approve') return `Duyệt gói ${subscription.plan === 'vip_monthly' ? 'VIP' : 'Premium'} của ${user}; backend sẽ kích hoạt quyền một tháng trong transaction.`;
  // if chỉ chạy nhánh này khi điều kiện action === 'reject' đúng.
  if (action === 'reject') return `Từ chối yêu cầu thanh toán của ${user}. Quyền đọc hiện tại của tài khoản không bị thay đổi.`;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: `Xóa yêu cầu chuyển khoản ${subscription.transfer_note} của ${user}.`.
  return `Xóa yêu cầu chuyển khoản ${subscription.transfer_note} của ${user}.`;
}
