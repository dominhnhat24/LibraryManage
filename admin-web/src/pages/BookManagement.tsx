import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowDownWideNarrow, BookPlus, Check, FileUp, Filter, LoaderCircle, Search, Trash2, X } from 'lucide-react';
import { BookModal } from '../components/BookModal';
import { BookTable } from '../components/BookTable';
import { Pagination } from '../components/Pagination';
import { AdminLayout } from '../components/AdminLayout';
import {
  api, createBook, deleteBook, errorMessage, fetchBooks, updateBook, uploadBookFile, 
  type BookFormPayload,
} from '../api/client';
import type { Book, PaginationData } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

const token = localStorage.getItem('openbook.access_token') ?? '';
const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

// Hàm BookManagement: Quản lý tìm kiếm, lọc, phân trang và CRUD danh sách sách dùng API admin.
export function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Book | null>(null);
  const [uploadBook, setUploadBook] = useState<Book | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  useEffect(() => {
    setSearchInput(urlSearch);
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  // Hỗ trợ điều hướng từ thanh tìm kiếm toàn cục và thao tác nhanh trên dashboard.
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setSelectedBook(null);
      setModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const editId = searchParams.get('edit');
    if (editId && books.length > 0) {
      const bookToEdit = books.find((book) => book._id === editId);
      if (bookToEdit) {
        setSelectedBook(bookToEdit);
        setModalOpen(true);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('edit');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, books]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Hàm loadBooks: Tải dữ liệu trang hiện tại, đồng bộ filter và phân trang trả từ backend.
  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchBooks({
        page,
        limit: pagination.limit,
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      });
      setBooks(result.books);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search, category, status]);

  useEffect(() => { void loadBooks(); }, [loadBooks]);

  // Hàm saveBook: Tạo sách mới kèm PDF trong một multipart request; sách hiện có cập nhật rồi tải file riêng.
  async function saveBook(payload: BookFormPayload, pdfFile: File | null) {
    setSaving(true);
    setError('');
    try {
      if (pdfFile && (pdfFile.type !== 'application/pdf' || !pdfFile.name.toLowerCase().endsWith('.pdf'))) {
        throw new Error('Chỉ chấp nhận file PDF.');
      }
      if (pdfFile && pdfFile.size > 100 * 1024 * 1024) {
        throw new Error('File PDF vượt quá giới hạn 100 MiB.');
      }
      if (selectedBook) {
        const savedBook = await updateBook(selectedBook._id, payload);
        setModalOpen(false);
        setSelectedBook(null);
        if (pdfFile) {
          setUploadBook(savedBook);
          setUploadFile(pdfFile);
          setUploadProgress(0);
          try {
            const result = await uploadBookFile(savedBook._id, pdfFile, setUploadProgress);
            setNotice(`Đã cập nhật sách và tải lên file PDF “${result.original_name}”.`);
            setUploadBook(null);
            setUploadFile(null);
          } catch (uploadError) {
            setError(`Thông tin sách đã lưu nhưng PDF chưa được tải lên: ${errorMessage(uploadError)}`);
          }
        } else {
          setNotice('Đã cập nhật thông tin sách.');
        }
      } else {
        await createBook(payload, pdfFile, setUploadProgress);
        setModalOpen(false);
        setNotice(pdfFile ? 'Đã tạo đầu sách và tải lên file PDF.' : 'Đã thêm đầu sách mới.');
      }
      if (!selectedBook && page > 1) {
        setPage(1);
        return;
      }
      await loadBooks();
    } catch (saveError) {
      throw new Error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    setLoading(true);

    // Lấy token xác thực của admin từ localStorage (khóa 'openbook.access_token' được thấy trong code của bạn)
    const token = localStorage.getItem('openbook.access_token');

    const response = await api.post('/books/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = response.data;
    setNotice(result.message || 'Đã nhập dữ liệu sách thành công.');
    await loadBooks();
  } catch (err) {
    setError(errorMessage(err));
  } finally {
    setLoading(false);
    e.target.value = '';
  }
}

  // Hàm confirmDelete: Gửi lệnh xóa sau xác nhận và tải lại danh sách hiện tại.
  async function confirmDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    setError('');
    try {
      await deleteBook(pendingDelete._id);
      setNotice(`Đã xóa “${pendingDelete.title}” và dữ liệu liên quan.`);
      setPendingDelete(null);
      if (books.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadBooks();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
      setPendingDelete(null);
    } finally {
      setSaving(false);
    }
  }

  // Hàm submitBookFile: Gửi file riêng tư theo loại sách và hiển thị tiến độ upload.
  async function submitBookFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadBook || !uploadFile) return;
    if (uploadFile.size > 100 * 1024 * 1024) {
      setError('File vượt quá giới hạn 100 MiB.');
      return;
    }
    setSaving(true);
    setError('');
    setUploadProgress(0);
    try {
      const result = await uploadBookFile(uploadBook._id, uploadFile, setUploadProgress);
      setNotice(`Đã tải lên file “${result.original_name}” cho sách “${uploadBook.title}”.`);
      setUploadBook(null);
      setUploadFile(null);
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setSaving(false);
    }
  }

  // Hàm openCreateModal: Chuẩn bị form trống để tạo một đầu sách mới.
  function openCreateModal() {
    setSelectedBook(null);
    setModalOpen(true);
  }

  // Hàm openEditModal: Nạp sách đã chọn vào form chỉnh sửa.
  function openEditModal(book: Book) {
    setSelectedBook(book);
    setModalOpen(true);
  }

  // Hàm dismissNotice: Ẩn thông báo thành công khi người dùng chủ động đóng.
  function dismissNotice() {
    setNotice('');
  }

  return (
    <AdminLayout>
      <section className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Kho nội dung số · Danh mục</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28] sm:text-[2.15rem]">Quản lý sách</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Quản lý danh mục, quyền truy cập và trạng thái xuất bản trong thư viện HarveyBook.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="button-secondary cursor-pointer flex items-center gap-2 text-xs">
            <FileUp size={15} />
            Nhập từ Excel
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              onChange={(e) => void handleImportExcel(e)} 
            />
          </label>
          <button 
            onClick={() => void loadBooks()} 
            className="button-secondary text-xs"
            type="button"
          >
            Làm mới danh sách
          </button>        
          <button className="button-primary self-start md:self-auto" onClick={openCreateModal} type="button">
            <BookPlus size={17} /> Thêm đầu sách
          </button>
        </div>
      </section>

      <section aria-label="Thống kê sách" className="mb-5 grid gap-px border border-[#DDE9E6] bg-[#DDE9E6] sm:grid-cols-2">
        <div className="bg-[#FFFFFF] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Tổng đầu sách</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#153D31]">{pagination.total.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-[#FFFFFF] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Trang hiện tại</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#153D31]">{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</p>
        </div>
      </section>

      <section className="border border-[#DDE9E6] bg-[#FFFFFF]">
        <div className="flex flex-col gap-4 border-b border-[#EEF3F0] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Filter className="text-[#526B86]" size={16} />
            <h2 className="text-sm font-bold text-[#153D31]">Danh mục đầu sách</h2>
            <span className="ml-auto hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:flex">
              <ArrowDownWideNarrow size={13} /> Sắp xếp mới nhất
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px_170px]">
            <label className="relative block">
              <span className="sr-only">Tìm theo tên sách</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="form-input h-10 pl-10 pr-10"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm tên sách hoặc tác giả..."
                type="search"
                value={searchInput}
              />
              {searchInput && (
                <button aria-label="Xóa từ khóa tìm kiếm" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-slate-400 hover:text-slate-700" onClick={() => setSearchInput('')} type="button">
                  <X size={14} />
                </button>
              )}
            </label>
            <label>
              <span className="sr-only">Lọc theo thể loại</span>
              <select className="form-input h-10" onChange={(event) => { setCategory(event.target.value); setPage(1); }} value={category}>
                <option value="">Tất cả thể loại</option>
                <option value="ebook">E-book</option>
                <option value="audiobook">Sách nói</option>
                <option value="comic">Truyện tranh</option>
                <option value="webnovel">Web novel</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Lọc theo trạng thái xuất bản</span>
              <select className="form-input h-10" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
                <option value="">Mọi trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
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
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <LoaderCircle className="animate-spin" size={17} /> Đang tải danh mục...
            </div>
          </div>
        ) : (
        <BookTable
          books={books}
          setBooks={setBooks}
          token={token}
          onDelete={setPendingDelete}
          onEdit={openEditModal}
          onUpload={(book) => {
            setUploadBook(book);
            setUploadFile(null);
            setUploadProgress(0);
          }}
          onRead={(book) => {
            navigate(`/books/${book._id}/read`);
          }}
        />
        )}
        {!loading && pagination.totalPages > 0 && (
          <Pagination onPageChange={setPage} pagination={pagination} />
        )}
      </section>

      {modalOpen && (
        <BookModal
          book={selectedBook}
          onClose={() => { setModalOpen(false); setSelectedBook(null); }}
          onSave={saveBook}
          saving={saving}
          uploadProgress={uploadProgress}
        />
      )}

      {uploadBook && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setUploadBook(null); }} role="presentation">
          <section aria-labelledby="upload-book-title" aria-modal="true" className="modal-panel !max-w-[560px]" role="dialog">
            <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5 sm:px-8">
              <div><p className="eyebrow">Kho lưu trữ riêng tư</p><h2 className="mt-1 text-xl font-bold" id="upload-book-title">Tải file sách</h2></div>
              <button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={() => setUploadBook(null)} type="button"><X size={17} /></button>
            </header>
            <form onSubmit={submitBookFile}>
              <div className="space-y-4 px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3 border border-[#DDE9E6] bg-[#F8FBF9] p-3">
                  <img alt={`Bìa sách ${uploadBook.title}`} className="h-14 w-11 border border-[#DDE9E6] object-cover" onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }} src={uploadBook.cover_url || '/book-cover-placeholder.svg'} />
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{uploadBook.title}</p><p className="mt-1 text-xs text-slate-500">{uploadBook.category}</p></div>
                </div>
                <label className="field-label block">File nội dung <span className="text-rose-600">*</span>
                  <input
                    accept={uploadBook.category === 'ebook' ? '.epub,.pdf,application/epub+zip,application/pdf'
                      : uploadBook.category === 'audiobook' ? '.mp3,.m4a,audio/mpeg,audio/mp4'
                        : uploadBook.category === 'comic' ? '.pdf,.epub,.mp4,.webm,application/pdf,application/epub+zip,video/mp4,video/webm'
                          : '.epub,.pdf,.mp3,.m4a,.mp4,.webm'}
                    className="form-input mt-2 file:mr-3 file:border-0 file:bg-[#E3F4EB] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#24795C]"
                    disabled={saving}
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    required={!uploadFile}
                    type="file"
                  />
                  {uploadFile && <span className="mt-1.5 block text-xs text-[#24795C]">Đã chọn: {uploadFile.name}</span>}
                  <span className="mt-1.5 block text-[11px] font-normal text-slate-500">Tối đa 100 MiB. Backend sẽ kiểm tra định dạng, MIME và chữ ký file.</span>
                </label>
                {uploadProgress > 0 && <div aria-live="polite"><div className="flex justify-between text-xs text-slate-600"><span>Đang tải lên</span><span>{uploadProgress}%</span></div><div className="mt-1 h-2 bg-[#DDE9E6]"><div className="h-full bg-[#24795C] transition-[width]" style={{ width: `${uploadProgress}%` }} /></div></div>}
                {error && <p className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}
              </div>
              <footer className="flex flex-col-reverse gap-2 border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                <button className="button-secondary" disabled={saving} onClick={() => setUploadBook(null)} type="button">Hủy</button>
                <button className="button-primary" disabled={saving || !uploadFile} type="submit">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <FileUp size={16} />}{saving ? 'Đang tải...' : 'Tải file lên'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="delete-book-title" aria-modal="true" className="confirm-panel" role="alertdialog">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center bg-rose-50 text-rose-700"><Trash2 size={19} /></span>
              <div>
                <p className="eyebrow">Xác nhận thao tác</p>
                <h2 className="mt-1 text-lg font-bold text-[#202b28]" id="delete-book-title">Xóa đầu sách này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <strong>“{pendingDelete.title}”</strong> cùng các chương, bình luận, bookmark và tiến độ đọc liên quan sẽ bị xóa.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="button-secondary" disabled={saving} onClick={() => setPendingDelete(null)} type="button">Giữ lại</button>
              <button className="button-danger" disabled={saving} onClick={confirmDelete} type="button">
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Xóa vĩnh viễn
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
