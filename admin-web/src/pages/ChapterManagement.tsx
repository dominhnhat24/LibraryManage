import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, BookPlus, Check, Filter, LoaderCircle, Search, Trash2, X,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { ChapterModal } from '../components/ChapterModal';
import { ChapterTable } from '../components/ChapterTable';
import { Pagination } from '../components/Pagination';
import {
  createChapter, deleteChapter, errorMessage, fetchChapters, updateChapter,
  type ChapterFormPayload, type ChapterUpdatePayload,
} from '../api/client';
import type { Chapter, PaginationData } from '../types';

const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Hàm ChapterManagement: Quản lý tìm kiếm, lọc quyền đọc, phân trang và CRUD chương bằng API ADMIN.
export function ChapterManagement() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Chapter | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Hàm loadChapters: Lấy trang chương theo các bộ lọc đang hoạt động và cập nhật metadata phân trang.
  const loadChapters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchChapters({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(accessLevel ? { access_level: accessLevel } : {}),
      });
      setChapters(result.chapters);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search, accessLevel]);

  useEffect(() => { void loadChapters(); }, [loadChapters]);

  // Hàm saveChapter: Tạo chương mới hoặc cập nhật chương đã chọn, sau đó tải lại danh sách hiện hành.
  async function saveChapter(payload: ChapterFormPayload | ChapterUpdatePayload) {
    setSaving(true);
    setError('');
    try {
      if ('book_id' in payload) {
        await createChapter(payload);
        setNotice('Đã thêm chương mới.');
        setPage(1);
      } else if (selectedChapter) {
        await updateChapter(selectedChapter._id, payload);
        setNotice('Đã cập nhật thông tin chương.');
      } else {
        throw new Error('Không xác định được sách hoặc chương cần lưu.');
      }
      setModalOpen(false);
      setSelectedChapter(null);
      if (page === 1 || !('book_id' in payload)) await loadChapters();
    } catch (saveError) {
      throw new Error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm confirmDelete: Xóa chương sau xác nhận và điều chỉnh trang nếu xóa bản ghi cuối cùng.
  async function confirmDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    setError('');
    try {
      await deleteChapter(pendingDelete._id);
      setNotice(`Đã xóa chương “${pendingDelete.title}”.`);
      setPendingDelete(null);
      if (chapters.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadChapters();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setPendingDelete(null);
    } finally {
      setSaving(false);
    }
  }

  // Hàm openCreateModal: Mở form trống để tìm sách cha và tạo chương mới.
  function openCreateModal() {
    setSelectedChapter(null);
    setModalOpen(true);
  }

  // Hàm openEditModal: Mở form với metadata và nội dung của chương đã chọn.
  function openEditModal(chapter: Chapter) {
    setSelectedChapter(chapter);
    setModalOpen(true);
  }

  // Hàm clearFilters: Xóa đồng thời từ khóa và quyền truy cập để hiển thị toàn bộ chương.
  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setAccessLevel('');
    setPage(1);
  }

  // Hàm dismissNotice: Đóng thông báo thành công sau khi hoàn tất thao tác CRUD.
  function dismissNotice() {
    setNotice('');
  }

  const hasFilters = Boolean(searchInput || accessLevel);

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
