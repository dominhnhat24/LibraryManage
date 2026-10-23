import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Eye, LoaderCircle, MessageSquareText, Search, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Pagination } from '../components/Pagination';
import { deleteReport, errorMessage, fetchReport, fetchReports, updateReport } from '../api/client';
import type { PaginationData, Report } from '../types';

const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Hàm reportAuthor: Hiển thị tên tài khoản đã populate hoặc email của người gửi không đăng nhập.
function reportAuthor(report: Report): string {
  if (report.user && typeof report.user !== 'string') return report.user.name;
  return report.email;
}

// Hàm formatDate: Định dạng ngày tạo báo cáo theo locale Việt Nam.
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

// Hàm ReportManagement: Tìm, lọc, xem chi tiết, đổi trạng thái và xóa phản hồi/báo lỗi.
export function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Report | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Hàm loadReports: Tải danh sách báo cáo theo trang, trạng thái và tìm kiếm subject/email từ API.
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchReports({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      setReports(result.reports);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search, status]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  // Hàm changeStatus: Lưu trạng thái xử lý báo cáo và đồng bộ danh sách theo bộ lọc đang dùng.
  async function changeStatus(report: Report, nextStatus: Report['status']) {
    setSaving(true);
    setError('');
    try {
      const updated = await updateReport(report._id, nextStatus);
      setReports((current) => current.map((item) => item._id === report._id ? updated : item));
      setSelectedReport((current) => current?._id === report._id ? updated : current);
      setNotice('Đã cập nhật trạng thái báo cáo.');
      if (status && status !== nextStatus) await loadReports();
    } catch (updateError) {
      setError(errorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm openReport: Mở chi tiết báo cáo bằng truy vấn riêng theo ID của endpoint ADMIN.
  async function openReport(report: Report) {
    setSelectedReport(report);
    setError('');
    try {
      const detail = await fetchReport(report._id);
      setSelectedReport((current) => current?._id === detail._id ? detail : current);
    } catch (loadError: unknown) {
      setError(errorMessage(loadError));
    }
  }

  // Hàm confirmDelete: Xóa báo cáo sau xác nhận của ADMIN, cập nhật trang nếu bản ghi cuối bị xóa.
  async function confirmDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    setError('');
    try {
      await deleteReport(pendingDelete._id);
      setNotice('Đã xóa báo cáo.');
      setPendingDelete(null);
      setSelectedReport(null);
      if (reports.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadReports();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setPendingDelete(null);
    } finally {
      setSaving(false);
    }
  }

  // Hàm dismissNotice: Đóng thông báo cập nhật báo cáo thành công.
  function dismissNotice() {
    setNotice('');
  }

  return <AdminLayout>
    <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end w-full">
      <div>
        <p className="eyebrow">Quản trị hệ thống · Hỗ trợ</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Báo cáo & hỗ trợ</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Theo dõi phản hồi, yêu cầu liên hệ và báo lỗi từ độc giả.</p>
      </div>

      {/* Đưa nút vào trong section, dùng md:ml-auto để đẩy sang phải */}
      <div className="flex items-center gap-2 self-start md:self-auto md:ml-auto">
        <button 
          onClick={() => void loadReports()} 
          className="button-secondary text-xs flex items-center gap-2"
          type="button"
        >
          Làm mới danh sách
        </button>
      </div>
    </section>

    <section aria-label="Thống kê báo cáo" className="mb-5 grid gap-px border border-[#DDE9E6] bg-[#DDE9E6] sm:grid-cols-3">
      <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng theo bộ lọc</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.total.toLocaleString('vi-VN')}</p></div>
      <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p></div>
      <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Bản ghi mỗi trang</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.limit}</p></div>
    </section>
    <section className="border border-[#DDE9E6] bg-[#FFFFFF]">
      <div className="grid gap-2 border-b border-[#EEF3F0] px-4 py-4 sm:grid-cols-[minmax(220px,1fr)_200px] sm:px-6">
        <label className="relative block"><span className="sr-only">Tìm báo cáo theo tiêu đề hoặc email</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className="form-input h-10 pl-10 pr-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm tiêu đề hoặc email..." type="search" value={searchInput} />{searchInput && <button aria-label="Xóa từ khóa" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-slate-400" onClick={() => setSearchInput('')} type="button"><X size={14} /></button>}</label>
        <label><span className="sr-only">Lọc trạng thái báo cáo</span><select className="form-input h-10" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">Mọi trạng thái</option><option value="open">Mới tiếp nhận</option><option value="in_progress">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></label>
      </div>
      {error && <div className="m-4 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:m-6" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{error}</span></div>}
      {notice && <div className="m-4 flex items-start gap-2 border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:m-6" role="status"><Check className="mt-0.5 shrink-0" size={16} /><span>{notice}</span><button aria-label="Đóng thông báo" className="ml-auto" onClick={dismissNotice} type="button"><X size={15} /></button></div>}
      {loading ? <div className="grid min-h-64 place-items-center text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={17} />Đang tải báo cáo...</span></div>
        : reports.length === 0 ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><MessageSquareText className="mx-auto text-slate-400" size={28} /><h3 className="mt-3 text-sm font-bold">Chưa có báo cáo phù hợp</h3><p className="mt-1 text-sm text-slate-500">Hãy đổi từ khóa hoặc bộ lọc trạng thái.</p></div></div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left">
            <thead><tr className="border-y border-[#e9e8e2] bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3.5">Tiêu đề</th><th className="px-4 py-3.5">Người gửi</th><th className="px-4 py-3.5">Loại</th><th className="px-4 py-3.5">Trạng thái</th><th className="px-4 py-3.5">Ngày nhận</th><th className="px-5 py-3.5 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-[#EEF3F0]">{reports.map((report) => <tr className="hover:bg-[#FFFFFF]" key={report._id}>
              <td className="max-w-[300px] px-5 py-3.5"><p className="truncate text-sm font-bold text-[#202b28]">{report.subject}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{report.message}</p></td>
              <td className="px-4 py-3.5"><p className="text-xs font-semibold text-slate-700">{reportAuthor(report)}</p>{report.user && typeof report.user !== 'string' && <p className="mt-1 text-[10px] text-slate-500">{report.email}</p>}</td>
              <td className="px-4 py-3.5"><span className="inline-flex border border-[#DDE9E6] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">{report.type === 'bug' ? 'Báo lỗi' : 'Liên hệ'}</span></td>
              <td className="px-4 py-3.5"><span className={`inline-flex border px-2.5 py-1 text-[10px] font-bold ${report.status === 'resolved' ? 'border-[#C3E5D0] bg-[#E3F4EB] text-[#24795C]' : report.status === 'in_progress' ? 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]' : 'border-[#ead2ce] bg-[#fbefed] text-[#a34f43]'}`}>{statusLabel(report.status)}</span></td>
              <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(report.createdAt)}</td>
              <td className="px-5 py-3.5"><div className="flex justify-end gap-2"><button aria-label={`Xem ${report.subject}`} className="icon-button" onClick={() => void openReport(report)} type="button"><Eye size={15} /></button><button aria-label={`Xóa ${report.subject}`} className="icon-button icon-button-danger" onClick={() => setPendingDelete(report)} type="button"><Trash2 size={15} /></button></div></td>
            </tr>)}</tbody>
          </table></div>}
      {!loading && pagination.totalPages > 0 && <Pagination itemLabel="báo cáo" onPageChange={setPage} pagination={pagination} />}
    </section>
    {selectedReport && <ReportDetailModal error={error} report={selectedReport} saving={saving} onClose={() => setSelectedReport(null)} onStatusChange={(nextStatus) => void changeStatus(selectedReport, nextStatus)} />}
    {pendingDelete && <div className="modal-backdrop" role="presentation"><section aria-labelledby="delete-report-title" aria-modal="true" className="confirm-panel" role="alertdialog"><p className="eyebrow">Xác nhận thao tác</p><h2 className="mt-1 text-lg font-bold" id="delete-report-title">Xóa báo cáo này?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Báo cáo <strong>“{pendingDelete.subject}”</strong> sẽ bị xóa vĩnh viễn.</p><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={() => setPendingDelete(null)} type="button">Giữ lại</button><button className="button-danger" disabled={saving} onClick={() => void confirmDelete()} type="button">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa báo cáo</button></div></section></div>}
  </AdminLayout>;
}

// Hàm statusLabel: Chuyển trạng thái workflow báo cáo thành nhãn tiếng Việt trong bảng.
function statusLabel(status: Report['status']): string {
  return { open: 'Mới tiếp nhận', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết' }[status];
}

// Hàm ReportDetailModal: Hiển thị đầy đủ nội dung, người gửi và cho phép đổi trạng thái workflow.
function ReportDetailModal({ report, saving, error, onClose, onStatusChange }: {
  report: Report;
  saving: boolean;
  error: string;
  onClose: () => void;
  onStatusChange: (status: Report['status']) => void;
}) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }} role="presentation"><section aria-labelledby="report-detail-title" aria-modal="true" className="modal-panel !max-w-[640px]" role="dialog">
    <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5 sm:px-8"><div><p className="eyebrow">{report.type === 'bug' ? 'Báo lỗi' : 'Yêu cầu liên hệ'}</p><h2 className="mt-1 text-xl font-bold" id="report-detail-title">{report.subject}</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header>
    <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto px-6 py-6 sm:px-8"><div className="grid gap-4 border-b border-[#DDE9E6] pb-4 sm:grid-cols-2"><div><p className="eyebrow">Người gửi</p><p className="mt-1 text-sm font-semibold">{reportAuthor(report)}</p></div><div><p className="eyebrow">Email phản hồi</p><p className="mt-1 break-all text-sm font-semibold">{report.email}</p></div><div><p className="eyebrow">Ngày tiếp nhận</p><p className="mt-1 text-sm">{formatDate(report.createdAt)}</p></div><div><p className="eyebrow">Mã báo cáo</p><p className="mt-1 break-all font-mono text-xs">{report._id}</p></div></div><div><p className="eyebrow">Nội dung</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{report.message}</p></div><label className="field-label block">Cập nhật trạng thái<select className="form-input mt-2" disabled={saving} onChange={(event) => onStatusChange(event.target.value as Report['status'])} value={report.status}><option value="open">Mới tiếp nhận</option><option value="in_progress">Đang xử lý</option><option value="resolved">Đã giải quyết</option></select></label>{error && <p className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}</div>
    <footer className="flex justify-end border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:px-8"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Đóng</button></footer>
  </section></div>;
}
