import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, MessageSquareText, Search, Star, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Pagination } from '../components/Pagination';
import { deleteBookComment, errorMessage, fetchAdminComments } from '../api/client';
import type { Comment, PaginationData } from '../types';

const emptyPagination: PaginationData = { total: 0, page: 1, limit: 20, totalPages: 0 };

export function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<PaginationData>(emptyPagination);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminComments({
        page,
        limit: pagination.limit || 20,
        ...(search ? { search } : {}),
      });
      setComments(result.comments);
      setPagination(result.pagination);
    } catch (loadError: unknown) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, search]);

  useEffect(() => { void loadComments(); }, [loadComments]);

  async function handleDelete(commentId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    setDeletingId(commentId);
    setError('');
    try {
      await deleteBookComment(commentId);
      if (comments.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadComments();
    } catch (deleteError: unknown) {
      setError(errorMessage(deleteError) || 'Không thể xóa bình luận.');
    } finally {
      setDeletingId(null);
    }
  }

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
                  const author = typeof comment.user === 'object' && comment.user !== null ? comment.user : null;
                  const book = typeof comment.book === 'object' && comment.book !== null ? comment.book : null;
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
