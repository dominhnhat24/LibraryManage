import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle, Check, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, X,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Pagination } from '../components/Pagination';
import {
  createUser, deleteUser, errorMessage, fetchUser, fetchUsers, grantVip, updateUser,
  type UserFormPayload, type UserUpdatePayload,
} from '../api/client';
import type { PaginationData, User } from '../types';
import { useAuth } from '../auth/AuthContext';

const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

type UserSaveRequest =
  | { mode: 'create'; payload: UserFormPayload }
  | { mode: 'edit'; payload: UserUpdatePayload };

// Hàm userId: Chuẩn hóa định danh user từ DTO dạng lean hoặc public JSON.
function userId(user: User): string {
  return user._id ?? user.id;
}

// Hàm formatDate: Hiển thị ngày ISO theo định dạng địa phương và xử lý trường hợp chưa có ngày.
function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

// Hàm UserManagement: Quản lý tài khoản, role, VIP, tìm kiếm, lọc và phân trang trong trang ADMIN.
export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'vip' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Hàm loadUsers: Tải danh sách user theo trang, vai trò và chuỗi tìm kiếm.
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchUsers({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search, role]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  // Hàm saveUser: Tạo tài khoản USER hoặc cập nhật hồ sơ, role của user được chọn.
  async function saveUser(request: UserSaveRequest) {
    setSaving(true);
    setError('');
    try {
      if (request.mode === 'create') {
        await createUser(request.payload);
        setNotice('Đã tạo tài khoản USER.');
        setPage(1);
      } else if (selectedUser) {
        await updateUser(userId(selectedUser), request.payload);
        setNotice('Đã cập nhật tài khoản.');
      } else {
        throw new Error('Không xác định được thao tác tài khoản.');
      }
      setModalMode(null);
      setSelectedUser(null);
      if (page === 1 || request.mode === 'edit') await loadUsers();
    } catch (saveError) {
      throw new Error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm saveVip: Cấp quyền VIP tới ngày đã chọn mà không thay đổi role ADMIN/USER.
  async function saveVip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    const formData = new FormData(event.currentTarget);
    const expiresAt = String(formData.get('vip_expires_at') || '');
    setSaving(true);
    setError('');
    try {
      await grantVip(userId(selectedUser), new Date(expiresAt).toISOString());
      setNotice(`Đã cấp quyền VIP cho ${selectedUser.name}.`);
      setModalMode(null);
      setSelectedUser(null);
      await loadUsers();
    } catch (grantError) {
      setError(errorMessage(grantError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm editUser: Tải hồ sơ đầy đủ theo ID trước khi mở biểu mẫu chỉnh sửa ADMIN.
  async function editUser(user: User) {
    setLoadingUserDetail(true);
    setError('');
    try {
      const detail = await fetchUser(userId(user));
      setSelectedUser(detail);
      setModalMode('edit');
    } catch (detailError: unknown) {
      setError(errorMessage(detailError));
    } finally {
      setLoadingUserDetail(false);
    }
  }

  // Hàm confirmDelete: Xóa tài khoản sau xác nhận của ADMIN và tải lại trang hiện tại.
  async function confirmDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    setError('');
    try {
      await deleteUser(userId(pendingDelete));
      setNotice(`Đã xóa tài khoản ${pendingDelete.email} cùng dữ liệu liên quan.`);
      setPendingDelete(null);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setPendingDelete(null);
    } finally {
      setSaving(false);
    }
  }

  // Hàm dismissNotice: Đóng thông báo thành công hiển thị sau thao tác tài khoản.
  function dismissNotice() {
    setNotice('');
  }

  return (
    <AdminLayout>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Quản trị hệ thống · Tài khoản</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Người dùng</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Quản lý hồ sơ, role hệ thống và quyền đọc VIP của thành viên.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => void loadUsers()} 
            className="button-secondary text-xs"
            type="button">
            Làm mới danh sách
          </button>
          <button className="button-primary self-start md:self-auto" onClick={() => { setSelectedUser(null); setModalMode('create'); }} type="button">
            <Plus size={17} /> Tạo người dùng
          </button>
        </div>
      </section>

      <section aria-label="Thống kê người dùng" className="mb-5 grid gap-px border border-[#dfded7] bg-[#dfded7] sm:grid-cols-3">
        <div className="bg-[#fbfaf7] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng tài khoản</p><p className="mt-2 text-2xl font-bold text-[#203a34]">{pagination.total.toLocaleString('vi-VN')}</p></div>
        <div className="bg-[#fbfaf7] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p><p className="mt-2 text-2xl font-bold text-[#203a34]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p></div>
        <div className="bg-[#fbfaf7] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Bản ghi mỗi trang</p><p className="mt-2 text-2xl font-bold text-[#203a34]">{pagination.limit}</p></div>
      </section>

      <section className="border border-[#dfded7] bg-[#fbfaf7]">
        <div className="grid gap-2 border-b border-[#e5e4de] px-4 py-4 sm:grid-cols-[minmax(220px,1fr)_200px] sm:px-6">
          <label className="relative block">
            <span className="sr-only">Tìm theo tên hoặc email</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="form-input h-10 pl-10 pr-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm tên hoặc email..." type="search" value={searchInput} />
            {searchInput && <button aria-label="Xóa từ khóa" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-slate-400" onClick={() => setSearchInput('')} type="button"><X size={14} /></button>}
          </label>
          <label>
            <span className="sr-only">Lọc theo role</span>
            <select className="form-input h-10" onChange={(event) => { setRole(event.target.value); setPage(1); }} value={role}>
              <option value="">Mọi vai trò</option><option value="USER">Độc giả · USER</option><option value="ADMIN">Quản trị viên · ADMIN</option>
            </select>
          </label>
        </div>
        {error && <div className="m-4 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:m-6" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{error}</span></div>}
        {notice && <div className="m-4 flex items-start gap-2 border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:m-6" role="status"><Check className="mt-0.5 shrink-0" size={16} /><span>{notice}</span><button aria-label="Đóng thông báo" className="ml-auto" onClick={dismissNotice} type="button"><X size={15} /></button></div>}
        {loading ? <div className="grid min-h-64 place-items-center text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={17} />Đang tải người dùng...</span></div>
          : users.length === 0 ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><UserRound className="mx-auto text-slate-400" size={28} /><h3 className="mt-3 text-sm font-bold">Chưa tìm thấy người dùng</h3><p className="mt-1 text-sm text-slate-500">Hãy đổi từ khóa hoặc bộ lọc để thử lại.</p></div></div>
            : <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left">
              <thead><tr className="border-y border-[#e9e8e2] bg-[#f8f7f3] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3.5">Tài khoản</th><th className="px-4 py-3.5">Role</th><th className="px-4 py-3.5">Quyền đọc</th><th className="px-4 py-3.5">Ngày tham gia</th><th className="px-5 py-3.5 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-[#efeee9]">{users.map((item) => {
                const isCurrentUser = item.id === currentUser?.id || userId(item) === currentUser?.id;
                const vipActive = Boolean(item.is_vip && item.vip_expires_at && new Date(item.vip_expires_at) > new Date());
                return <tr className="hover:bg-[#fbfaf7]" key={userId(item)}>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center border border-[#e4e1d8] bg-[#f1f0ea] text-[#496a55]"><UserRound size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#202b28]">{item.name}{isCurrentUser && <span className="ml-2 text-[10px] font-medium text-slate-400">(Bạn)</span>}</p><p className="truncate text-xs text-slate-500">{item.email}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.phone_number || 'Chưa có số điện thoại'}</p></div></div></td>
                  <td className="px-4 py-3.5"><span className={`inline-flex border px-2.5 py-1 text-[10px] font-bold ${item.role === 'ADMIN' ? 'border-[#cbd9d0] bg-[#edf2ed] text-[#31564a]' : 'border-[#e9e7df] bg-white text-slate-600'}`}>{item.role === 'ADMIN' ? 'ADMIN · Quản trị' : 'USER · Độc giả'}</span></td>
                  <td className="px-4 py-3.5"><div className="space-y-1"><span className={`block text-xs font-semibold ${vipActive ? 'text-[#94743c]' : 'text-slate-500'}`}>{vipActive ? 'VIP đang hoạt động' : item.is_premium ? 'Premium đang hoạt động' : 'Free'}</span>{vipActive && <span className="block text-[10px] text-slate-400">Hạn {formatDate(item.vip_expires_at)}</span>}</div></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-3.5"><div className="flex justify-end gap-2">
                    {item.role !== 'ADMIN' && <button aria-label={`Cấp VIP cho ${item.name}`} className="icon-button" onClick={() => { setSelectedUser(item); setModalMode('vip'); }} title="Cấp VIP" type="button"><ShieldCheck size={15} /></button>}
                    <button aria-label={`Sửa ${item.name}`} className="icon-button" disabled={loadingUserDetail} onClick={() => void editUser(item)} type="button"><Pencil size={15} /></button>
                    {!isCurrentUser && <button aria-label={`Xóa ${item.name}`} className="icon-button icon-button-danger" onClick={() => setPendingDelete(item)} type="button"><Trash2 size={15} /></button>}
                  </div></td>
                </tr>;
              })}</tbody>
            </table></div>}
        {!loading && pagination.totalPages > 0 && <Pagination itemLabel="tài khoản" onPageChange={setPage} pagination={pagination} />}
      </section>

      {modalMode && modalMode !== 'vip' && <UserModal mode={modalMode} user={selectedUser} canChangeRole={!selectedUser || userId(selectedUser) !== currentUser?.id} saving={saving} onClose={() => { setModalMode(null); setSelectedUser(null); }} onSave={saveUser} />}
      {modalMode === 'vip' && selectedUser && <VipModal error={error} user={selectedUser} saving={saving} onClose={() => { setModalMode(null); setSelectedUser(null); }} onSubmit={saveVip} />}
      {pendingDelete && <div className="modal-backdrop" role="presentation"><section aria-labelledby="delete-user-title" aria-modal="true" className="confirm-panel" role="alertdialog"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center bg-rose-50 text-rose-700"><Trash2 size={19} /></span><div><p className="eyebrow">Xác nhận thao tác</p><h2 className="mt-1 text-lg font-bold" id="delete-user-title">Xóa tài khoản?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Tài khoản <strong>{pendingDelete.email}</strong> cùng dữ liệu cá nhân, nội dung sở hữu và tệp sách liên quan sẽ bị xóa vĩnh viễn.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={() => setPendingDelete(null)} type="button">Giữ lại</button><button className="button-danger" disabled={saving} onClick={() => void confirmDelete()} type="button">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa tài khoản</button></div></section></div>}
    </AdminLayout>
  );
}

// Hàm UserModal: Thu thập thông tin tài khoản mới hoặc cho phép ADMIN chỉnh sửa role và hồ sơ hiện tại.
function UserModal({ mode, user, canChangeRole, saving, onClose, onSave }: {
  mode: 'create' | 'edit';
  user: User | null;
  canChangeRole: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (request: UserSaveRequest) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>(user?.role ?? 'USER');
  const [formError, setFormError] = useState('');

  // Hàm submit: Kiểm tra nhập liệu và truyền dữ liệu mới/cập nhật về trang quản lý.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    try {
      if (mode === 'create') {
        await onSave({
          mode: 'create',
          payload: { name: name.trim(), email: email.trim(), phone_number: phone.trim(), password },
        });
      } else {
        await onSave({
          mode: 'edit',
          payload: {
            name: name.trim(),
            email: email.trim(),
            phone_number: phone.trim(),
            ...(password ? { password } : {}),
            ...(canChangeRole ? { role } : {}),
          },
        });
      }
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }} role="presentation"><section aria-labelledby="user-modal-title" aria-modal="true" className="modal-panel !max-w-[560px]" role="dialog">
    <header className="flex items-start justify-between border-b border-[#e9e7df] px-6 py-5"><div><p className="eyebrow">Quản trị tài khoản</p><h2 className="mt-1 text-xl font-bold" id="user-modal-title">{mode === 'create' ? 'Tạo tài khoản USER' : 'Chỉnh sửa tài khoản'}</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header>
    <form onSubmit={submit}><div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">Họ và tên<input autoComplete="name" className="form-input mt-2" maxLength={100} onChange={(event) => setName(event.target.value)} required value={name} /></label>
      <label className="field-label">Email<input autoComplete="email" className="form-input mt-2" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
      <label className="field-label">Số điện thoại<input autoComplete="tel" className="form-input mt-2" maxLength={12} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} /></label>
      <label className="field-label sm:col-span-2">Mật khẩu {mode === 'edit' && <span className="font-normal text-slate-500">(để trống nếu không đổi)</span>}<input autoComplete={mode === 'create' ? 'new-password' : 'off'} className="form-input mt-2" minLength={8} maxLength={128} onChange={(event) => setPassword(event.target.value)} required={mode === 'create'} type="password" value={password} /></label>
      {mode === 'edit' && <label className="field-label sm:col-span-2">Role hệ thống{canChangeRole ? <select className="form-input mt-2" onChange={(event) => setRole(event.target.value as User['role'])} value={role}><option value="USER">USER · Độc giả</option><option value="ADMIN">ADMIN · Quản trị</option></select> : <span className="mt-2 flex min-h-10 items-center border border-[#deddd5] bg-[#f8f7f3] px-3 text-sm">{role} · Không thể tự thay đổi role của phiên đang đăng nhập</span>}<span className="mt-1 block text-[11px] font-normal text-slate-500">Premium/VIP là quyền đọc độc lập, không phải role.</span></label>}
      {formError && <p className="sm:col-span-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{formError}</p>}
    </div><footer className="flex flex-col-reverse gap-2 border-t border-[#e9e7df] bg-[#fbfaf7] px-6 py-4 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button><button className="button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}</button></footer></form>
  </section></div>;
}

// Hàm VipModal: Yêu cầu ADMIN chọn thời điểm kết thúc trước khi gọi API cấp quyền VIP.
function VipModal({ user, saving, error, onClose, onSubmit }: {
  user: User;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const defaultExpiry = new Date();
  defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
  const localValue = new Date(defaultExpiry.getTime() - defaultExpiry.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return <div className="modal-backdrop" role="presentation"><section aria-labelledby="vip-modal-title" aria-modal="true" className="confirm-panel" role="dialog"><header className="flex items-start justify-between"><div><p className="eyebrow">Quyền đọc</p><h2 className="mt-1 text-lg font-bold" id="vip-modal-title">Cấp quyền VIP</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header><p className="mt-3 text-sm text-slate-600">Tài khoản <strong>{user.name}</strong> sẽ được cấp quyền VIP tới thời điểm đã chọn.</p><form className="mt-5" onSubmit={onSubmit}><label className="field-label">VIP hết hạn lúc<input className="form-input mt-2" min={new Date().toISOString().slice(0, 16)} name="vip_expires_at" required type="datetime-local" defaultValue={localValue} /></label>{error && <p className="mt-3 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button><button className="button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <ShieldCheck size={16} />}Cấp VIP</button></div></form></section></div>;
}
