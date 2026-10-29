import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, CreditCard, Eye, LoaderCircle, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Pagination } from '../components/Pagination';
import {
  deleteSubscription, errorMessage, fetchSubscription, fetchSubscriptions, reviewSubscription,
  updateSubscriptionPaymentReference,
} from '../api/client';
import type { PaginationData, Subscription } from '../types';

const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

function subscriberName(user: Subscription['user']): string {
  if (!user) return 'Chưa cập nhật';
  return typeof user === 'string' ? `Tài khoản ${user.slice(-6)}` : (user.name || 'Không rõ tên');
}

function subscriberEmail(user: Subscription['user']): string {
  if (!user) return 'Chưa có email';
  return typeof user === 'string' ? user : (user.email || 'Không có email');
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [pendingAction, setPendingAction] = useState<{ subscription: Subscription; action: 'approve' | 'reject' | 'delete' } | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSubscriptions({
        page,
        limit: pagination.limit,
        ...(status ? { status } : {}),
        ...(plan ? { plan } : {}),
      });
      setSubscriptions(result.subscriptions);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, status, plan]);

  useEffect(() => { void loadSubscriptions(); }, [loadSubscriptions]);

  async function openSubscription(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setPaymentReference(subscription.payment_reference ?? '');
    setDetailLoading(true);
    setError('');
    try {
      const detail = await fetchSubscription(subscription._id);
      setSelectedSubscription(detail);
      setPaymentReference(detail.payment_reference ?? '');
    } catch (loadError: unknown) {
      setError(errorMessage(loadError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function savePaymentReference() {
    if (!selectedSubscription) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateSubscriptionPaymentReference(selectedSubscription._id, paymentReference.trim());
      setSelectedSubscription(updated);
      setSubscriptions((current) => current.map((item) => item._id === updated._id ? updated : item));
      setNotice('Đã cập nhật mã giao dịch.');
    } catch (saveError: unknown) {
      setError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setSaving(true);
    setError('');
    try {
      if (pendingAction.action === 'delete') {
        await deleteSubscription(pendingAction.subscription._id);
        setNotice('Đã xóa yêu cầu thuê bao đang chờ.');
      } else {
        await reviewSubscription(pendingAction.subscription._id, pendingAction.action);
        setNotice(pendingAction.action === 'approve'
          ? 'Đã duyệt thuê bao và kích hoạt quyền đọc.'
          : 'Đã từ chối yêu cầu thuê bao.');
      }
      setPendingAction(null);
      if (subscriptions.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadSubscriptions();
    } catch (actionError) {
      setError(errorMessage(actionError));
      setPendingAction(null);
    } finally {
      setSaving(false);
    }
  }

  function dismissNotice() {
    setNotice('');
  }

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

function statusLabel(status: Subscription['status']): string {
  return { pending: 'Chờ duyệt', active: 'Đã kích hoạt', rejected: 'Đã từ chối', expired: 'Hết hạn' }[status];
}

function reviewName(reviewer?: Subscription['reviewed_by']): string {
  if (!reviewer) return '—';
  return typeof reviewer === 'string' ? `ID ${reviewer.slice(-6)}` : reviewer.name;
}

function actionTitle(action: 'approve' | 'reject' | 'delete'): string {
  return action === 'approve' ? 'Duyệt yêu cầu thuê bao?'
    : action === 'reject' ? 'Từ chối yêu cầu thuê bao?' : 'Xóa yêu cầu đang chờ?';
}

function actionDescription(action: 'approve' | 'reject' | 'delete', subscription: Subscription): string {
  const user = subscriberName(subscription.user);
  if (action === 'approve') return `Duyệt gói ${subscription.plan === 'vip_monthly' ? 'VIP' : 'Premium'} của ${user}; backend sẽ kích hoạt quyền một tháng trong transaction.`;
  if (action === 'reject') return `Từ chối yêu cầu thanh toán của ${user}. Quyền đọc hiện tại của tài khoản không bị thay đổi.`;
  return `Xóa yêu cầu chuyển khoản ${subscription.transfer_note} của ${user}.`;
}
