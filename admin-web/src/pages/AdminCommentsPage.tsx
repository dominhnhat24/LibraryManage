// Import { useCallback, useEffect, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/AdminCommentsPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useCallback, useEffect, useState } from 'react';
// Import { AlertCircle, LoaderCircle, MessageSquareText, Search, Star, Trash2, X } từ lucide-react để dùng trong giao diện.
import { AlertCircle, LoaderCircle, MessageSquareText, Search, Star, Trash2, X } from 'lucide-react';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { Pagination } từ ../components/Pagination để dùng trong giao diện.
import { Pagination } from '../components/Pagination';
// Import { deleteBookComment, errorMessage, fetchAdminComments } từ ../api/client để dùng trong giao diện.
import { deleteBookComment, errorMessage, fetchAdminComments } from '../api/client';
// Import type { Comment, PaginationData } từ ../types để dùng trong giao diện.
import type { Comment, PaginationData } from '../types';

// Biến emptyPagination nhận giá trị từ { total: 0, page: 1, limit: 20, totalPages: 0 }. const không gán lại; let có thể cập nhật.
const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

/**
 * Hàm/thành phần AdminCommentsPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, setTimeout, setPage, setSearch, trim, return, clearTimeout.
 */
export function AdminCommentsPage() {
  // Biến [comments, setComments] nhận giá trị từ useState<Comment[]>([]). const không gán lại; let có thể cập nhật.
  const [comments, setComments] = useState<Comment[]>([]);
  // Biến [pagination, setPagination] nhận giá trị từ useState<PaginationData>(emptyPagination). const không gán lại; let có thể cập nhật.
  const [pagination, setPagination] = useState<PaginationData>(emptyPagination);
  // Biến [searchInput, setSearchInput] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [searchInput, setSearchInput] = useState('');
  // Biến [search, setSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [search, setSearch] = useState('');
  // Biến [page, setPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [page, setPage] = useState(1);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [deletingId, setDeletingId] nhận giá trị từ useState<string | null>(null). const không gán lại; let có thể cập nhật.
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setSearch(
  useEffect(() => {
    // Biến timer nhận giá trị từ window.setTimeout(() => { setPage(1); setSearch(searchI. const không gán lại; let có thể cập nhật.
    const timer = window.setTimeout(() => {
      // Gọi/thực thi setPage với đối số để cập nhật logic/giao diện: setPage(1)
      setPage(1);
      // Gọi/thực thi setSearch với đối số để cập nhật logic/giao diện: setSearch(searchInput.trim())
      setSearch(searchInput.trim());
    }, 250);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => window.clearTimeout(timer).
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Biến loadComments nhận giá trị từ useCallback(async () => { setLoading(true); setError(''. const không gán lại; let có thể cập nhật.
  const loadComments = useCallback(async () => {
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await fetchAdminComments({ page, limit: pagination.limi. const không gán lại; let có thể cập nhật.
      const result = await fetchAdminComments({
        page,
        limit: pagination.limit || 20,
        ...(search ? { search } : {}),
      });
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments(result.comments)
      setComments(result.comments);
      // Gọi/thực thi setPagination với đối số để cập nhật logic/giao diện: setPagination(result.pagination)
      setPagination(result.pagination);
    } catch (loadError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
      setError(errorMessage(loadError));
    } finally {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
  }, [page, pagination.limit, search]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { void loadComments(); }, [loadComments])
  useEffect(() => { void loadComments(); }, [loadComments]);

  /**
   * Hàm/thành phần handleDelete: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: commentId.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, setDeletingId, setError, deleteBookComment, setPage, loadComments, errorMessage.
   */
  async function handleDelete(commentId: string) {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?') đúng.
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    // Gọi/thực thi setDeletingId với đối số để cập nhật logic/giao diện: setDeletingId(commentId)
    setDeletingId(commentId);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteBookComment(commentId)
      await deleteBookComment(commentId);
      // if chỉ chạy nhánh này khi điều kiện comments.length === 1 && page > 1 đúng.
      if (comments.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadComments();
    } catch (deleteError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(deleteError) || 'Không thể xóa bình luận.')
      setError(errorMessage(deleteError) || 'Không thể xóa bình luận.');
    } finally {
      // Gọi/thực thi setDeletingId với đối số để cập nhật logic/giao diện: setDeletingId(null)
      setDeletingId(null);
    }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <AdminLayout> <section className="mb-6 flex flex-col justify-between gap-4 md:.
  return (
    <AdminLayout>
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">HarveyBook · Kiểm duyệt</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#153D31] sm:text-3xl">Quản lý bình luận & đánh giá</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#526B86]">Tìm kiếm và kiểm duyệt phản hồi của độc giả trên toàn bộ thư viện.</p>
        </div>
        <button onClick={() => void loadComments()} className="button-secondary text-xs" disabled={loading} type="button">
          {loading ? <LoaderCircle className="animate-spin" size={15} /> : null}
          Làm mới danh sách
        </button>
      </section>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#DDE9E6] bg-white shadow-[0_2px_8px_rgba(31,78,59,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#EEF3F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#153D31]">
            <MessageSquareText size={17} className="text-[#24795C]" />
            Danh sách bình luận ({pagination.total.toLocaleString('vi-VN')})
          </h2>
          <label className="relative block w-full sm:max-w-[340px]">
            <span className="sr-only">Tìm trong nội dung bình luận</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#97A8B8]" size={16} />
            <input className="form-input pl-10 pr-10" onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm nội dung bình luận..." type="search" value={searchInput} />
            {searchInput && <button aria-label="Xóa từ khóa" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-[#97A8B8]" onClick={() => setSearchInput('')} type="button"><X size={14} /></button>}
          </label>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="grid min-h-48 place-items-center text-sm text-[#526B86]"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={17} /> Đang tải bình luận từ API...</span></div>
          ) : comments.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#EEF3F0] bg-[#F8FBF9] uppercase tracking-wider text-[#526B86]">
                  <th className="px-5 py-3 font-semibold">Độc giả</th>
                  <th className="px-4 py-3 font-semibold">Tên sách</th>
                  <th className="px-4 py-3 font-semibold">Nội dung</th>
                  <th className="px-4 py-3 font-semibold">Đánh giá</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F0]">
                {comments.map((comment) => {
                  // Biến author nhận giá trị từ typeof comment.user === 'object' && comment.user !== nu. const không gán lại; let có thể cập nhật.
                  const author = typeof comment.user === 'object' && comment.user !== null ? comment.user : null;
                  // Biến book nhận giá trị từ typeof comment.book === 'object' && comment.book !== nu. const không gán lại; let có thể cập nhật.
                  const book = typeof comment.book === 'object' && comment.book !== null ? comment.book : null;
                  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <tr className="transition-colors hover:bg-[#F8FBF9]" key={comment._id}> <td cl.
                  return (
                    <tr className="transition-colors hover:bg-[#F8FBF9]" key={comment._id}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#153D31]">{author?.name || 'Độc giả'}</p>
                        {author?.email && <p className="mt-1 text-[11px] text-[#526B86]">{author.email}</p>}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#526B86]">{book?.title || 'Sách đã xóa'}</td>
                      <td className="max-w-md px-4 py-3.5 text-[#526B86]"><p className="whitespace-pre-wrap break-words">{comment.body}</p></td>
                      <td className="px-4 py-3.5">
                        {comment.rating ? <span className="inline-flex items-center gap-1 font-semibold text-amber-600"><Star size={13} fill="currentColor" />{comment.rating}/5</span> : <span className="text-[#97A8B8]">Chưa chấm</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button aria-label={`Xóa bình luận của ${author?.name || 'độc giả'}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50" disabled={deletingId === comment._id} onClick={() => void handleDelete(comment._id)} type="button">
                          {deletingId === comment._id ? <LoaderCircle className="animate-spin" size={14} /> : <Trash2 size={14} />} Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-12 text-center">
              <MessageSquareText className="mx-auto text-[#BFD5C8]" size={28} />
              <p className="mt-3 text-sm font-semibold text-[#153D31]">Không tìm thấy bình luận</p>
              <p className="mt-1 text-xs text-[#526B86]">Thử từ khóa khác hoặc danh sách hiện chưa có bình luận.</p>
            </div>
          )}
        </div>
        {!loading && pagination.totalPages > 0 && <Pagination pagination={pagination} onPageChange={setPage} itemLabel="bình luận" />}
      </section>
    </AdminLayout>
  );
}
