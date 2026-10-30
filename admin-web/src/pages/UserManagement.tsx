// Import { useCallback, useEffect, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/UserManagement.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
// Import { AlertCircle, Check, Gem, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Tras từ lucide-react để dùng trong giao diện.
import {
  AlertCircle, Check, Gem, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, X,
} from 'lucide-react';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { Pagination } từ ../components/Pagination để dùng trong giao diện.
import { Pagination } from '../components/Pagination';
// Import { createUser, deleteUser, errorMessage, fetchUser, fetchUsers, grantPremium, gra từ ../api/client để dùng trong giao diện.
import {
  createUser, deleteUser, errorMessage, fetchUser, fetchUsers, grantPremium, grantVip, updateUser,
  type UserFormPayload, type UserUpdatePayload,
} from '../api/client';
// Import type { PaginationData, User } từ ../types để dùng trong giao diện.
import type { PaginationData, User } from '../types';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { useSearchParams } từ react-router-dom để dùng trong giao diện.
import { useSearchParams } from 'react-router-dom';

// Biến emptyPagination nhận giá trị từ { total: 0, page: 1, limit: 20, totalPages: 0 }. const không gán lại; let có thể cập nhật.
const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Kiểu UserSaveRequest mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type UserSaveRequest =
  | { mode: 'create'; payload: UserFormPayload }
  | { mode: 'edit'; payload: UserUpdatePayload };

// Hàm userId: Chuẩn hóa định danh user từ DTO dạng lean hoặc public JSON.
/**
 * Hook userId: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: user.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function userId(user: User): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: user._id ?? user.id.
  return user._id ?? user.id;
}

// Hàm formatDate: Hiển thị ngày ISO theo định dạng địa phương và xử lý trường hợp chưa có ngày.
/**
 * Hàm/thành phần formatDate: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, isNaN, getTime, DateTimeFormat, format.
 * Được tham chiếu tại: admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx, admin-web/src/pages/ReaderBookPage.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
 */
function formatDate(value?: string | null): string {
  // if chỉ chạy nhánh này khi điều kiện !value đúng.
  if (!value) return '—';
  // Biến date nhận giá trị từ new Date(value). const không gán lại; let có thể cập nhật.
  const date = new Date(value);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyl.
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

// Hàm UserManagement: Quản lý tài khoản, role, VIP, tìm kiếm, lọc và phân trang trong trang ADMIN.
/**
 * Hàm/thành phần UserManagement: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useState, useSearchParams, get, useEffect, setSearchInput, setSearch, setPage.
 */
export function UserManagement() {
  // Biến { user: currentUser } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user: currentUser } = useAuth();
  // Biến [users, setUsers] nhận giá trị từ useState<User[]>([]). const không gán lại; let có thể cập nhật.
  const [users, setUsers] = useState<User[]>([]);
  // Biến [pagination, setPagination] nhận giá trị từ useState(emptyPagination). const không gán lại; let có thể cập nhật.
  const [pagination, setPagination] = useState(emptyPagination);
  // Biến [searchInput, setSearchInput] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [searchInput, setSearchInput] = useState('');
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [role, setRole] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [role, setRole] = useState('');
  // Biến [page, setPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [page, setPage] = useState(1);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [saving, setSaving] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [saving, setSaving] = useState(false);
  // Biến [loadingUserDetail, setLoadingUserD nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');
  // Biến [selectedUser, setSelectedUser] nhận giá trị từ useState<User | null>(null). const không gán lại; let có thể cập nhật.
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Biến [modalMode, setModalMode] nhận giá trị từ useState<'create' | 'edit' | 'vip' | 'premium' | null>(. const không gán lại; let có thể cập nhật.
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'vip' | 'premium' | null>(null);
  // Biến [pendingDelete, setPendingDelete] nhận giá trị từ useState<User | null>(null). const không gán lại; let có thể cập nhật.
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  // Biến [searchParams] nhận giá trị từ useSearchParams(). const không gán lại; let có thể cập nhật.
  const [searchParams] = useSearchParams();
  // Biến urlSearch nhận giá trị từ searchParams.get('search') ?? ''. const không gán lại; let có thể cập nhật.
  const urlSearch = searchParams.get('search') ?? '';

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { setSearchInput(urlSearch); setSearch(urlSearch); setPage(1); }
  useEffect(() => {
    // Gọi/thực thi setSearchInput với đối số để cập nhật logic/giao diện: setSearchInput(urlSearch)
    setSearchInput(urlSearch);
    // Gọi/thực thi setSearch với đối số để cập nhật logic/giao diện: setSearch(urlSearch)
    setSearch(urlSearch);
    // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
    setPage(1);
  }, [urlSearch]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { const timeout = window.setTimeout(() => { setPage(1); setSearc
  useEffect(() => {
    // Biến timeout nhận giá trị từ window.setTimeout(() => { setPage(1); setSearch(searchI. const không gán lại; let có thể cập nhật.
    const timeout = window.setTimeout(() => {
      // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
      setPage(1);
      // Gọi/thực thi setSearch với đối số để cập nhật logic/giao diện: setSearch(searchInput.trim())
      setSearch(searchInput.trim());
    }, 250);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => window.clearTimeout(timeout).
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Hàm loadUsers: Tải danh sách user theo trang, vai trò và chuỗi tìm kiếm.
  // Biến loadUsers nhận giá trị từ useCallback(async () => { setLoading(true); setError(''. const không gán lại; let có thể cập nhật.
  const loadUsers = useCallback(async () => {
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await fetchUsers({ page, limit: pagination.limit, ...(s. const không gán lại; let có thể cập nhật.
      const result = await fetchUsers({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
      });
      // Gọi/thực thi setUsers với đối số để cập nhật logic/giao diện: setUsers(result.users)
      setUsers(result.users);
      // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination(result.pagination)
      setPagination(result.pagination);
    } catch (loadError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
      setError(errorMessage(loadError));
    } finally {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
  }, [page, pagination.limit, search, role]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { void loadUsers(); }, [loadUsers])
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  // Hàm saveUser: Tạo tài khoản USER hoặc cập nhật hồ sơ, role của user được chọn.
  /**
   * Hàm/thành phần saveUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: request.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, createUser, setNotice, setPage, updateUser, userId, Error.
   */
  async function saveUser(request: UserSaveRequest) {
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // if chỉ chạy nhánh này khi điều kiện request.mode === 'create' đúng.
      if (request.mode === 'create') {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await createUser(request.payload)
        await createUser(request.payload);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã tạo tài khoản USER.')
        setNotice('Đã tạo tài khoản USER.');
        // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
        setPage(1);
      } else if (selectedUser) {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await updateUser(userId(selectedUser), request.payload)
        await updateUser(userId(selectedUser), request.payload);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã cập nhật tài khoản.')
        setNotice('Đã cập nhật tài khoản.');
      } else {
        // throw phát sinh lỗi để hàm gọi phía trên xử lý.
        throw new Error('Không xác định được thao tác tài khoản.');
      }
      // Gọi/thực thi setModalMode với đối số để cập nhật logic/giao diện: setModalMode(null)
      setModalMode(null);
      // Gọi/thực thi setSelectedUser với đối số để cập nhật logic/giao diện: setSelectedUser(null)
      setSelectedUser(null);
      // if chỉ chạy nhánh này khi điều kiện page === 1 || request.mode === 'edit' đúng.
      if (page === 1 || request.mode === 'edit') await loadUsers();
    } catch (saveError) {
      // throw phát sinh lỗi để hàm gọi phía trên xử lý.
      throw new Error(errorMessage(saveError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm saveVip: Cấp quyền VIP tới ngày đã chọn mà không thay đổi role ADMIN/USER.
  /**
   * Hàm/thành phần saveVip: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, FormData, String, get, setSaving, setError, grantVip, userId.
   */
  async function saveVip(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // if chỉ chạy nhánh này khi điều kiện !selectedUser đúng.
    if (!selectedUser) return;
    // Biến formData nhận giá trị từ new FormData(event.currentTarget). const không gán lại; let có thể cập nhật.
    const formData = new FormData(event.currentTarget);
    // Biến expiresAt nhận giá trị từ String(formData.get('vip_expires_at') || ''). const không gán lại; let có thể cập nhật.
    const expiresAt = String(formData.get('vip_expires_at') || '');
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await grantVip(userId(selectedUser), new Date(expiresAt).toISOString())
      await grantVip(userId(selectedUser), new Date(expiresAt).toISOString());
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(`Đã cấp quyền VIP cho ${selectedUser.name}.`)
      setNotice(`Đã cấp quyền VIP cho ${selectedUser.name}.`);
      // Gọi/thực thi setModalMode với đối số để cập nhật logic/giao diện: setModalMode(null)
      setModalMode(null);
      // Gọi/thực thi setSelectedUser với đối số để cập nhật logic/giao diện: setSelectedUser(null)
      setSelectedUser(null);
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await loadUsers()
      await loadUsers();
    } catch (grantError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(grantError))
      setError(errorMessage(grantError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  /**
   * Hàm/thành phần savePremium: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, String, FormData, get, setSaving, setError, grantPremium, userId.
   */
  async function savePremium(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // if chỉ chạy nhánh này khi điều kiện !selectedUser đúng.
    if (!selectedUser) return;
    // Biến expiresAt nhận giá trị từ String(new FormData(event.currentTarget).get('premium_e. const không gán lại; let có thể cập nhật.
    const expiresAt = String(new FormData(event.currentTarget).get('premium_expires_at') || '');
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await grantPremium(userId(selectedUser), new Date(expiresAt).toISOString())
      await grantPremium(userId(selectedUser), new Date(expiresAt).toISOString());
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(`Đã cấp quyền Premium cho ${selectedUser.name}.`)
      setNotice(`Đã cấp quyền Premium cho ${selectedUser.name}.`);
      // Gọi/thực thi setModalMode với đối số để cập nhật logic/giao diện: setModalMode(null)
      setModalMode(null);
      // Gọi/thực thi setSelectedUser với đối số để cập nhật logic/giao diện: setSelectedUser(null)
      setSelectedUser(null);
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await loadUsers()
      await loadUsers();
    } catch (grantError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(grantError))
      setError(errorMessage(grantError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm editUser: Tải hồ sơ đầy đủ theo ID trước khi mở biểu mẫu chỉnh sửa ADMIN.
  /**
   * Hàm/thành phần editUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: user.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setLoadingUserDetail, setError, fetchUser, userId, setSelectedUser, setModalMode, errorMessage.
   */
  async function editUser(user: User) {
    // Gọi/thực thi setLoadingUserDetail với đối số để cập nhật logic/giao diện: setLoadingUserDetail(true)
    setLoadingUserDetail(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến detail nhận giá trị từ await fetchUser(userId(user)). const không gán lại; let có thể cập nhật.
      const detail = await fetchUser(userId(user));
      // Gọi/thực thi setSelectedUser với đối số để cập nhật logic/giao diện: setSelectedUser(detail)
      setSelectedUser(detail);
      // Gọi/thực thi setModalMode với đối số để cập nhật logic/giao diện: setModalMode('edit')
      setModalMode('edit');
    } catch (detailError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(detailError))
      setError(errorMessage(detailError));
    } finally {
      // Gọi/thực thi setLoadingUserDetail với đối số để cập nhật logic/giao diện: setLoadingUserDetail(false)
      setLoadingUserDetail(false);
    }
  }

  // Hàm confirmDelete: Xóa tài khoản sau xác nhận của ADMIN và tải lại trang hiện tại.
  /**
   * Hàm/thành phần confirmDelete: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, deleteUser, userId, setNotice, setPendingDelete, setPage, loadUsers.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx, admin-web/src/pages/ChapterManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
   */
  async function confirmDelete() {
    // if chỉ chạy nhánh này khi điều kiện !pendingDelete đúng.
    if (!pendingDelete) return;
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteUser(userId(pendingDelete))
      await deleteUser(userId(pendingDelete));
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(`Đã xóa tài khoản ${pendingDelete.email} cùng dữ liệu liên quan.`)
      setNotice(`Đã xóa tài khoản ${pendingDelete.email} cùng dữ liệu liên quan.`);
      // Gọi/thực thi setPendingDelete với đối số để cập nhật logic/giao diện: setPendingDelete(null)
      setPendingDelete(null);
      // if chỉ chạy nhánh này khi điều kiện users.length === 1 && page > 1 đúng.
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (deleteError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(deleteError))
      setError(errorMessage(deleteError));
      // Gọi/thực thi setPendingDelete với đối số để cập nhật logic/giao diện: setPendingDelete(null)
      setPendingDelete(null);
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm dismissNotice: Đóng thông báo thành công hiển thị sau thao tác tài khoản.
  /**
   * Hàm/thành phần dismissNotice: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setNotice.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx, admin-web/src/pages/ChapterManagement.tsx, admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
   */
  function dismissNotice() {
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <AdminLayout> <section className="mb-7 flex flex-col justify-between gap-5 md:.
  return (
    <AdminLayout>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Quản trị hệ thống · Tài khoản</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Người dùng</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Quản lý hồ sơ, role hệ thống và quyền đọc Free, VIP, Premium của thành viên.</p>
          <p className="mt-1 text-xs font-medium text-[#76642D]">Cấp Premium bằng nút màu vàng ở cột “Thao tác” trên dòng tài khoản USER.</p>
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

      <section aria-label="Thống kê người dùng" className="mb-5 grid gap-px border border-[#DDE9E6] bg-[#DDE9E6] sm:grid-cols-2">
        <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng tài khoản</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.total.toLocaleString('vi-VN')}</p></div>
        <div className="bg-[#FFFFFF] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p><p className="mt-2 text-2xl font-bold text-[#153D31]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p></div>
      </section>

      <section className="border border-[#DDE9E6] bg-[#FFFFFF]">
        <div className="grid gap-2 border-b border-[#EEF3F0] px-4 py-4 sm:grid-cols-[minmax(220px,1fr)_200px] sm:px-6">
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
              <thead><tr className="border-y border-[#e9e8e2] bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3.5">Tài khoản</th><th className="px-4 py-3.5">Role</th><th className="px-4 py-3.5">Quyền đọc</th><th className="px-4 py-3.5">Ngày tham gia</th><th className="px-5 py-3.5 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-[#EEF3F0]">{users.map((item) => {
                // Biến isCurrentUser nhận giá trị từ item.id === currentUser?.id || userId(item) === current. const không gán lại; let có thể cập nhật.
                const isCurrentUser = item.id === currentUser?.id || userId(item) === currentUser?.id;
                // Biến premiumActive nhận giá trị từ Boolean(item.is_premium && item.premium_expires_at && n. const không gán lại; let có thể cập nhật.
                const premiumActive = Boolean(item.is_premium && item.premium_expires_at && new Date(item.premium_expires_at) > new Date());
                // Biến vipActive nhận giá trị từ Boolean(item.is_vip && item.vip_expires_at && new Date(. const không gán lại; let có thể cập nhật.
                const vipActive = Boolean(item.is_vip && item.vip_expires_at && new Date(item.vip_expires_at) > new Date());
                // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <tr className="hover:bg-[#FFFFFF]" key={userId(item)}> <td className="px-5 py-3..
                return <tr className="hover:bg-[#FFFFFF]" key={userId(item)}>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center border border-[#DDE9E6] bg-[#f1f0ea] text-[#496a55]"><UserRound size={16} /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#202b28]">{item.name}{isCurrentUser && <span className="ml-2 text-[10px] font-medium text-slate-400">(Bạn)</span>}</p><p className="truncate text-xs text-slate-500">{item.email}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.phone_number || 'Chưa có số điện thoại'}</p></div></div></td>
                  <td className="px-4 py-3.5"><span className={`inline-flex border px-2.5 py-1 text-[10px] font-bold ${item.role === 'ADMIN' ? 'border-[#cbd9d0] bg-[#E3F4EB] text-[#24795C]' : 'border-[#DDE9E6] bg-white text-slate-600'}`}>{item.role === 'ADMIN' ? 'ADMIN · Quản trị' : 'USER · Độc giả'}</span></td>
                  <td className="px-4 py-3.5"><div className="space-y-1"><span className={`block text-xs font-semibold ${item.role === 'ADMIN' || premiumActive ? 'text-[#B8860B]' : vipActive ? 'text-[#24795C]' : 'text-slate-500'}`}>{item.role === 'ADMIN' ? 'Đầy đủ quyền (ADMIN)' : premiumActive ? 'Premium đang hoạt động' : vipActive ? 'VIP đang hoạt động' : 'Free'}</span>{premiumActive && <span className="block text-[10px] text-slate-400">Premium hết hạn {formatDate(item.premium_expires_at)}</span>}{!premiumActive && vipActive && <span className="block text-[10px] text-slate-400">VIP hết hạn {formatDate(item.vip_expires_at)}</span>}</div></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-3.5"><div className="flex justify-end gap-2">
                    {item.role !== 'ADMIN' ? <><button aria-label={`Cấp Premium cho ${item.name}`} className="inline-flex min-h-8 items-center gap-1.5 border border-[#D9C58A] bg-[#FBF7E8] px-2.5 text-[11px] font-semibold text-[#76642D] hover:bg-[#F4EDCF]" onClick={() => { setSelectedUser(item); setModalMode('premium'); }} title="Cấp Premium: gồm quyền VIP và tải sách PDF" type="button"><Gem size={14} />Cấp Premium</button><button aria-label={`Cấp VIP cho ${item.name}`} className="inline-flex min-h-8 items-center gap-1.5 border border-[#C9DED3] bg-[#F2F8F4] px-2.5 text-[11px] font-semibold text-[#24795C] hover:bg-[#E3F4EB]" onClick={() => { setSelectedUser(item); setModalMode('vip'); }} title="Cấp VIP: tắt quảng cáo khi đọc" type="button"><ShieldCheck size={14} />Cấp VIP</button></> : <span className="self-center text-[10px] font-medium text-slate-500" title="ADMIN đã có đầy đủ quyền">Toàn quyền ADMIN</span>}
                    <button aria-label={`Sửa ${item.name}`} className="icon-button" disabled={loadingUserDetail} onClick={() => void editUser(item)} type="button"><Pencil size={15} /></button>
                    {!isCurrentUser && <button aria-label={`Xóa ${item.name}`} className="icon-button icon-button-danger" onClick={() => setPendingDelete(item)} type="button"><Trash2 size={15} /></button>}
                  </div></td>
                </tr>;
              })}</tbody>
            </table></div>}
        {!loading && pagination.totalPages > 0 && <Pagination itemLabel="tài khoản" onPageChange={setPage} pagination={pagination} />}
      </section>

      {(modalMode === 'create' || modalMode === 'edit') && <UserModal mode={modalMode} user={selectedUser} canChangeRole={!selectedUser || userId(selectedUser) !== currentUser?.id} saving={saving} onClose={() => { setModalMode(null); setSelectedUser(null); }} onSave={saveUser} />}
      {modalMode === 'vip' && selectedUser && <VipModal error={error} user={selectedUser} saving={saving} onClose={() => { setModalMode(null); setSelectedUser(null); }} onSubmit={saveVip} />}
      {modalMode === 'premium' && selectedUser && <PremiumModal error={error} user={selectedUser} saving={saving} onClose={() => { setModalMode(null); setSelectedUser(null); }} onSubmit={savePremium} />}
      {pendingDelete && <div className="modal-backdrop" role="presentation"><section aria-labelledby="delete-user-title" aria-modal="true" className="confirm-panel" role="alertdialog"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center bg-rose-50 text-rose-700"><Trash2 size={19} /></span><div><p className="eyebrow">Xác nhận thao tác</p><h2 className="mt-1 text-lg font-bold" id="delete-user-title">Xóa tài khoản?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Tài khoản <strong>{pendingDelete.email}</strong> cùng dữ liệu cá nhân, nội dung sở hữu và tệp sách liên quan sẽ bị xóa vĩnh viễn.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={() => setPendingDelete(null)} type="button">Giữ lại</button><button className="button-danger" disabled={saving} onClick={() => void confirmDelete()} type="button">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa tài khoản</button></div></section></div>}
    </AdminLayout>
  );
}

// Hàm UserModal: Thu thập thông tin tài khoản mới hoặc cho phép ADMIN chỉnh sửa role và hồ sơ hiện tại.
/**
 * Hàm/thành phần UserModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { mode, user, canChangeRole, saving, onC.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, submit, preventDefault, setFormError, onSave, trim, errorMessage, onClose.
 */
function UserModal({ mode, user, canChangeRole, saving, onClose, onSave }: {
  mode: 'create' | 'edit';
  user: User | null;
  canChangeRole: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (request: UserSaveRequest) => Promise<void>;
}) {
  // Biến [name, setName] nhận giá trị từ useState(user?.name ?? ''). const không gán lại; let có thể cập nhật.
  const [name, setName] = useState(user?.name ?? '');
  // Biến [email, setEmail] nhận giá trị từ useState(user?.email ?? ''). const không gán lại; let có thể cập nhật.
  const [email, setEmail] = useState(user?.email ?? '');
  // Biến [phone, setPhone] nhận giá trị từ useState(user?.phone_number ?? ''). const không gán lại; let có thể cập nhật.
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  // Biến [password, setPassword] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [password, setPassword] = useState('');
  // Biến [role, setRole] nhận giá trị từ useState<User['role']>(user?.role ?? 'USER'). const không gán lại; let có thể cập nhật.
  const [role, setRole] = useState<User['role']>(user?.role ?? 'USER');
  // Biến [formError, setFormError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [formError, setFormError] = useState('');

  // Hàm submit: Kiểm tra nhập liệu và truyền dữ liệu mới/cập nhật về trang quản lý.
  /**
   * Hàm/thành phần submit: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setFormError, onSave, trim, errorMessage.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('')
    setFormError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // if chỉ chạy nhánh này khi điều kiện mode === 'create' đúng.
      if (mode === 'create') {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await onSave({ mode: 'create', payload: { name: name.trim(), email: email.trim()
        await onSave({
          mode: 'create',
          payload: { name: name.trim(), email: email.trim(), phone_number: phone.trim(), password },
        });
      } else {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await onSave({ mode: 'edit', payload: { name: name.trim(), email: email.trim(),
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
      // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError(errorMessage(error))
      setFormError(errorMessage(error));
    }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === e.
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }} role="presentation"><section aria-labelledby="user-modal-title" aria-modal="true" className="modal-panel !max-w-[560px]" role="dialog">
    <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5"><div><p className="eyebrow">Quản trị tài khoản</p><h2 className="mt-1 text-xl font-bold" id="user-modal-title">{mode === 'create' ? 'Tạo tài khoản USER' : 'Chỉnh sửa tài khoản'}</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header>
    <form onSubmit={submit}><div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">Họ và tên<input autoComplete="name" className="form-input mt-2" maxLength={100} onChange={(event) => setName(event.target.value)} required value={name} /></label>
      <label className="field-label">Email<input autoComplete="email" className="form-input mt-2" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
      <label className="field-label">Số điện thoại<input autoComplete="tel" className="form-input mt-2" maxLength={12} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} /></label>
      <label className="field-label sm:col-span-2">Mật khẩu {mode === 'edit' && <span className="font-normal text-slate-500">(để trống nếu không đổi)</span>}<input autoComplete={mode === 'create' ? 'new-password' : 'off'} className="form-input mt-2" minLength={8} maxLength={128} onChange={(event) => setPassword(event.target.value)} required={mode === 'create'} type="password" value={password} /></label>
      {mode === 'edit' && <label className="field-label sm:col-span-2">Role hệ thống{canChangeRole ? <select className="form-input mt-2" onChange={(event) => setRole(event.target.value as User['role'])} value={role}><option value="USER">USER · Độc giả</option><option value="ADMIN">ADMIN · Quản trị</option></select> : <span className="mt-2 flex min-h-10 items-center border border-[#DDE9E6] bg-[#F8FBF9] px-3 text-sm">{role} · Không thể tự thay đổi role của phiên đang đăng nhập</span>}<span className="mt-1 block text-[11px] font-normal text-slate-500">Premium/VIP là quyền đọc độc lập, không phải role.</span></label>}
      {formError && <p className="sm:col-span-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{formError}</p>}
    </div><footer className="flex flex-col-reverse gap-2 border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button><button className="button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}</button></footer></form>
  </section></div>;
}

// Hàm VipModal: Yêu cầu ADMIN chọn thời điểm kết thúc trước khi gọi API cấp quyền VIP.
/**
 * Hàm/thành phần VipModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { user, saving, error, onClose, onSubmit.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, setMonth, getMonth, getTime, getTimezoneOffset, toISOString, slice.
 */
function VipModal({ user, saving, error, onClose, onSubmit }: {
  user: User;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  // Biến defaultExpiry nhận giá trị từ new Date(). const không gán lại; let có thể cập nhật.
  const defaultExpiry = new Date();
  // Gọi/thực thi defaultExpiry.setMonth với đối số để cập nhật logic/giao diện: defaultExpiry.setMonth(defaultExpiry.getMonth() + 1)
  defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
  // Biến localValue nhận giá trị từ new Date(defaultExpiry.getTime() - defaultExpiry.getTim. const không gán lại; let có thể cập nhật.
  const localValue = new Date(defaultExpiry.getTime() - defaultExpiry.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="modal-backdrop" role="presentation"><section aria-labelledby="vi.
  return <div className="modal-backdrop" role="presentation"><section aria-labelledby="vip-modal-title" aria-modal="true" className="confirm-panel" role="dialog"><header className="flex items-start justify-between"><div><p className="eyebrow">Quyền đọc</p><h2 className="mt-1 text-lg font-bold" id="vip-modal-title">Cấp quyền VIP</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header><p className="mt-3 text-sm text-slate-600">Tài khoản <strong>{user.name}</strong> sẽ được cấp quyền VIP tới thời điểm đã chọn.</p><form className="mt-5" onSubmit={onSubmit}><label className="field-label">VIP hết hạn lúc<input className="form-input mt-2" min={new Date().toISOString().slice(0, 16)} name="vip_expires_at" required type="datetime-local" defaultValue={localValue} /></label>{error && <p className="mt-3 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button><button className="button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <ShieldCheck size={16} />}Cấp VIP</button></div></form></section></div>;
}

/**
 * Hàm/thành phần PremiumModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { user, saving, error, onClose, onSubmit.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, setMonth, getMonth, getTime, getTimezoneOffset, toISOString, slice.
 */
function PremiumModal({ user, saving, error, onClose, onSubmit }: {
  user: User;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  // Biến defaultExpiry nhận giá trị từ new Date(). const không gán lại; let có thể cập nhật.
  const defaultExpiry = new Date();
  // Gọi/thực thi defaultExpiry.setMonth với đối số để cập nhật logic/giao diện: defaultExpiry.setMonth(defaultExpiry.getMonth() + 1)
  defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
  // Biến localValue nhận giá trị từ new Date(defaultExpiry.getTime() - defaultExpiry.getTim. const không gán lại; let có thể cập nhật.
  const localValue = new Date(defaultExpiry.getTime() - defaultExpiry.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="modal-backdrop" role="presentation"><section aria-labelledby="pr.
  return <div className="modal-backdrop" role="presentation"><section aria-labelledby="premium-modal-title" aria-modal="true" className="confirm-panel" role="dialog"><header className="flex items-start justify-between"><div><p className="eyebrow">Quyền đọc</p><h2 className="mt-1 text-lg font-bold" id="premium-modal-title">Cấp quyền Premium</h2></div><button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button"><X size={17} /></button></header><p className="mt-3 text-sm text-slate-600">Tài khoản <strong>{user.name}</strong> sẽ được cấp Premium, bao gồm quyền VIP và tải sách PDF, tới thời điểm đã chọn.</p><form className="mt-5" onSubmit={onSubmit}><label className="field-label">Premium hết hạn lúc<input className="form-input mt-2" min={new Date().toISOString().slice(0, 16)} name="premium_expires_at" required type="datetime-local" defaultValue={localValue} /></label>{error && <p className="mt-3 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button><button className="button-primary" disabled={saving} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <ShieldCheck size={16} />}Cấp Premium</button></div></form></section></div>;
}
