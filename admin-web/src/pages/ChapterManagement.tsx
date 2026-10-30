// Import { useCallback, useEffect, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ChapterManagement.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useCallback, useEffect, useState } from 'react';
// Import { AlertCircle, BookPlus, Check, Filter, LoaderCircle, Search, Trash2, X, } từ lucide-react để dùng trong giao diện.
import {
  AlertCircle, BookPlus, Check, Filter, LoaderCircle, Search, Trash2, X,
} from 'lucide-react';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { ChapterModal } từ ../components/ChapterModal để dùng trong giao diện.
import { ChapterModal } from '../components/ChapterModal';
// Import { ChapterTable } từ ../components/ChapterTable để dùng trong giao diện.
import { ChapterTable } from '../components/ChapterTable';
// Import { Pagination } từ ../components/Pagination để dùng trong giao diện.
import { Pagination } from '../components/Pagination';
// Import { createChapter, deleteChapter, errorMessage, fetchChapters, updateChapter, type từ ../api/client để dùng trong giao diện.
import {
  createChapter, deleteChapter, errorMessage, fetchChapters, updateChapter,
  type ChapterFormPayload, type ChapterUpdatePayload,
} from '../api/client';
// Import type { Chapter, PaginationData } từ ../types để dùng trong giao diện.
import type { Chapter, PaginationData } from '../types';

// Biến emptyPagination nhận giá trị từ { total: 0, page: 1, limit: 20, totalPages: 0 }. const không gán lại; let có thể cập nhật.
const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Hàm ChapterManagement: Quản lý tìm kiếm, lọc quyền đọc, phân trang và CRUD chương bằng API ADMIN.
/**
 * Hàm/thành phần ChapterManagement: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, setTimeout, setPage, setSearch, trim, return, clearTimeout.
 */
export function ChapterManagement() {
  // Biến [chapters, setChapters] nhận giá trị từ useState<Chapter[]>([]). const không gán lại; let có thể cập nhật.
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Biến [pagination, setPagination] nhận giá trị từ useState(emptyPagination). const không gán lại; let có thể cập nhật.
  const [pagination, setPagination] = useState(emptyPagination);
  // Biến [searchInput, setSearchInput] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [searchInput, setSearchInput] = useState('');
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [accessLevel, setAccessLevel] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [accessLevel, setAccessLevel] = useState('');
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
  // Biến [selectedChapter, setSelectedChapte nhận giá trị từ useState<Chapter | null>(null). const không gán lại; let có thể cập nhật.
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  // Biến [modalOpen, setModalOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [modalOpen, setModalOpen] = useState(false);
  // Biến [pendingDelete, setPendingDelete] nhận giá trị từ useState<Chapter | null>(null). const không gán lại; let có thể cập nhật.
  const [pendingDelete, setPendingDelete] = useState<Chapter | null>(null);

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

  // Hàm loadChapters: Lấy trang chương theo các bộ lọc đang hoạt động và cập nhật metadata phân trang.
  // Biến loadChapters nhận giá trị từ useCallback(async () => { setLoading(true); setError(''. const không gán lại; let có thể cập nhật.
  const loadChapters = useCallback(async () => {
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await fetchChapters({ page, limit: pagination.limit, ... const không gán lại; let có thể cập nhật.
      const result = await fetchChapters({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(accessLevel ? { access_level: accessLevel } : {}),
      });
      // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters(result.chapters)
      setChapters(result.chapters);
      // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination(result.pagination)
      setPagination(result.pagination);
    } catch (loadError) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
      setError(errorMessage(loadError));
    } finally {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
  }, [page, pagination.limit, search, accessLevel]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { void loadChapters(); }, [loadChapters])
  useEffect(() => { void loadChapters(); }, [loadChapters]);

  // Hàm saveChapter: Tạo chương mới hoặc cập nhật chương đã chọn, sau đó tải lại danh sách hiện hành.
  /**
   * Hàm/thành phần saveChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: payload.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, createChapter, setNotice, setPage, updateChapter, Error, setModalOpen.
   */
  async function saveChapter(payload: ChapterFormPayload | ChapterUpdatePayload) {
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // if chỉ chạy nhánh này khi điều kiện 'book_id' in payload đúng.
      if ('book_id' in payload) {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await createChapter(payload)
        await createChapter(payload);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã thêm chương mới.')
        setNotice('Đã thêm chương mới.');
        // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
        setPage(1);
      } else if (selectedChapter) {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await updateChapter(selectedChapter._id, payload)
        await updateChapter(selectedChapter._id, payload);
        // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã cập nhật thông tin chương.')
        setNotice('Đã cập nhật thông tin chương.');
      } else {
        // throw phát sinh lỗi để hàm gọi phía trên xử lý.
        throw new Error('Không xác định được sách hoặc chương cần lưu.');
      }
      // Gọi/thực thi setModalOpen với đối số để cập nhật logic/giao diện: setModalOpen(false)
      setModalOpen(false);
      // Gọi/thực thi setSelectedChapter với đối số để cập nhật logic/giao diện: setSelectedChapter(null)
      setSelectedChapter(null);
      // if chỉ chạy nhánh này khi điều kiện page === 1 || !('book_id' in payload) đúng.
      if (page === 1 || !('book_id' in payload)) await loadChapters();
    } catch (saveError) {
      // throw phát sinh lỗi để hàm gọi phía trên xử lý.
      throw new Error(errorMessage(saveError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // Hàm confirmDelete: Xóa chương sau xác nhận và điều chỉnh trang nếu xóa bản ghi cuối cùng.
  /**
   * Hàm/thành phần confirmDelete: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSaving, setError, deleteChapter, setNotice, setPendingDelete, setPage, loadChapters, errorMessage.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx, admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
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
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteChapter(pendingDelete._id)
      await deleteChapter(pendingDelete._id);
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(`Đã xóa chương “${pendingDelete.title}”.`)
      setNotice(`Đã xóa chương “${pendingDelete.title}”.`);
      // Gọi/thực thi setPendingDelete với đối số để cập nhật logic/giao diện: setPendingDelete(null)
      setPendingDelete(null);
      // if chỉ chạy nhánh này khi điều kiện chapters.length === 1 && page > 1 đúng.
      if (chapters.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadChapters();
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

  // Hàm openCreateModal: Mở form trống để tìm sách cha và tạo chương mới.
  /**
   * Hàm/thành phần openCreateModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSelectedChapter, setModalOpen.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx.
   */
  function openCreateModal() {
    // Gọi/thực thi setSelectedChapter với đối số để cập nhật logic/giao diện: setSelectedChapter(null)
    setSelectedChapter(null);
    // Gọi/thực thi setModalOpen với đối số để cập nhật logic/giao diện: setModalOpen(true)
    setModalOpen(true);
  }

  // Hàm openEditModal: Mở form với metadata và nội dung của chương đã chọn.
  /**
   * Hàm/thành phần openEditModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: chapter.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSelectedChapter, setModalOpen.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx.
   */
  function openEditModal(chapter: Chapter) {
    // Gọi/thực thi setSelectedChapter với đối số để cập nhật logic/giao diện: setSelectedChapter(chapter)
    setSelectedChapter(chapter);
    // Gọi/thực thi setModalOpen với đối số để cập nhật logic/giao diện: setModalOpen(true)
    setModalOpen(true);
  }

  // Hàm clearFilters: Xóa đồng thời từ khóa và quyền truy cập để hiển thị toàn bộ chương.
  /**
   * Hàm/thành phần clearFilters: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSearchInput, setSearch, setAccessLevel, setPage.
   */
  function clearFilters() {
    // Gọi/thực thi setSearchInput với đối số để cập nhật logic/giao diện: setSearchInput('')
    setSearchInput('');
    // Gọi/thực thi setSearch với đối số để cập nhật logic/giao diện: setSearch('')
    setSearch('');
    // Gọi/thực thi setAccessLevel với đối số để cập nhật logic/giao diện: setAccessLevel('')
    setAccessLevel('');
    // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
    setPage(1);
  }

  // Hàm dismissNotice: Đóng thông báo thành công sau khi hoàn tất thao tác CRUD.
  /**
   * Hàm/thành phần dismissNotice: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setNotice.
   * Được tham chiếu tại: admin-web/src/pages/BookManagement.tsx, admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx.
   */
  function dismissNotice() {
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
  }

  // Biến hasFilters nhận giá trị từ Boolean(searchInput || accessLevel). const không gán lại; let có thể cập nhật.
  const hasFilters = Boolean(searchInput || accessLevel);

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <AdminLayout> <section className="mb-7 flex flex-col justify-between gap-5 md:.
  return (
    <AdminLayout>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Kho nội dung số · Chi tiết</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Quản lý chương</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Tổ chức nội dung, thứ tự và cấp quyền đọc cho từng chương trong thư viện HarveyBook.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => void loadChapters()} 
            className="button-secondary text-xs"
            type="button"
          >
            Làm mới danh sách
          </button>
          <button className="button-primary self-start md:self-auto" onClick={openCreateModal} type="button">
            <BookPlus size={17} /> Thêm chương
          </button>          
        </div>

      </section>

      <section aria-label="Thống kê chương" className="mb-5 grid gap-px border border-[#DDE9E6] bg-[#DDE9E6] sm:grid-cols-3">
        <div className="bg-[#FFFFFF] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng chương phù hợp</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#153D31]">{pagination.total.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-[#FFFFFF] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#153D31]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p>
        </div>
        <div className="bg-[#FFFFFF] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Bản ghi mỗi trang</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#153D31]">{pagination.limit}</p>
        </div>
      </section>

      <section className="border border-[#DDE9E6] bg-[#FFFFFF]">
        <div className="flex flex-col gap-4 border-b border-[#EEF3F0] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Filter className="text-[#526B86]" size={16} />
            <h2 className="text-sm font-bold text-[#153D31]">Danh mục chương</h2>
            {hasFilters && (
              <button className="button-secondary ml-auto !min-h-8 !px-2.5 !py-1.5" onClick={clearFilters} type="button">
                <X size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_200px]">
            <label className="relative block">
              <span className="sr-only">Tìm theo tiêu đề chương</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="form-input h-10 pl-10 pr-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm tiêu đề chương..."
                type="search"
                value={searchInput}
              />
              {searchInput && (
                <button
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-slate-400 hover:text-slate-700"
                  onClick={() => setSearchInput('')}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <label>
              <span className="sr-only">Lọc theo quyền truy cập</span>
              <select className="form-input h-10" onChange={(event) => { setAccessLevel(event.target.value); setPage(1); }} value={accessLevel}>
                <option value="">Mọi quyền truy cập</option>
                <option value="free">Miễn phí</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 sm:m-6" role="alert">
            <AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="m-4 flex items-start gap-2 border-l-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:m-6" role="status">
            <Check className="mt-0.5 shrink-0" size={16} /><span>{notice}</span>
            <button aria-label="Đóng thông báo" className="ml-auto text-emerald-800" onClick={dismissNotice} type="button"><X size={15} /></button>
          </div>
        )}
        <ChapterTable chapters={chapters} loading={loading} onDelete={setPendingDelete} onEdit={openEditModal} />
        {!loading && pagination.totalPages > 0 && (
          <Pagination itemLabel="chương" onPageChange={setPage} pagination={pagination} />
        )}
      </section>

      {modalOpen && (
        <ChapterModal
          chapter={selectedChapter}
          onClose={() => { setModalOpen(false); setSelectedChapter(null); }}
          onSave={saveChapter}
          saving={saving}
        />
      )}

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="delete-chapter-title" aria-modal="true" className="confirm-panel" role="alertdialog">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center bg-rose-50 text-rose-700"><Trash2 size={19} /></span>
              <div>
                <p className="eyebrow">Xác nhận thao tác</p>
                <h2 className="mt-1 text-lg font-bold text-[#202b28]" id="delete-chapter-title">Xóa chương này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chương <strong>“{pendingDelete.title}”</strong> sẽ bị xóa vĩnh viễn khỏi thư viện.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="button-secondary" disabled={saving} onClick={() => setPendingDelete(null)} type="button">Giữ lại</button>
              <button className="button-danger" disabled={saving} onClick={confirmDelete} type="button">
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Xóa chương
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
