import { useEffect, useState } from 'react';
import { AlertCircle, MessageSquareText, Star, Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { errorMessage, fetchBooks, fetchBookComments, deleteBookComment } from '../api/client';

export interface CommentItem {
  _id: string;
  body: string;
  rating?: number | null;
  user?: any;
  book?: any;
  createdAt?: string;
  bookTitle?: string;
}

export function AdminCommentsPage() {
  const [comments, setComments] = useState<(CommentItem & { bookTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tải danh sách tất cả bình luận từ các sách
  async function loadAllComments() {
    setLoading(true);
    setError('');
    try {
      const booksRes = await fetchBooks({ page: 1, limit: 50 });
      let collected: (CommentItem & { bookTitle?: string })[] = [];
      
      if (booksRes && booksRes.books) {
        for (const book of booksRes.books) {
          try {
            const commentRes = await fetchBookComments(book._id);
            if (commentRes && commentRes.comments) {
              const mapped = commentRes.comments.map((c: any) => ({
                ...c,
                bookTitle: book.title,
              }));
              collected = [...collected, ...mapped];
            }
          } catch {
            // Bỏ qua nếu sách lỗi hoặc chưa có bình luận
          }
        }
      }
      setComments(collected);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAllComments();
  }, []);

  // Xử lý xóa bình luận thật
  async function handleDelete(commentId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    try {
      await deleteBookComment(commentId);
      setComments((prev: (CommentItem & { bookTitle?: string })[]) => prev.filter((c) => c._id !== commentId));
    } catch (err: unknown) {
      alert(errorMessage(err) || 'Không thể xóa bình luận.');
    }
  }

  return (
    <AdminLayout>
      <section className="mb-7 flex items-center justify-between">
        <div>
          <p className="eyebrow">OpenBook · Kiểm duyệt</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#202b28]">Quản lý Bình luận & Đánh giá</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Xem, theo dõi và kiểm duyệt toàn bộ phản hồi, đánh giá từ độc giả trên các đầu sách.</p>
        </div>
        <button 
          onClick={() => void loadAllComments()} 
          className="button-secondary text-xs"
          type="button"
        >
          Làm mới danh sách
        </button>
      </section>

      {error && (
        <div className="mb-5 flex items-start gap-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="border border-[#dfded7] bg-[#fbfaf7]">
        <div className="border-b border-[#e5e4de] px-5 py-4">
          <h2 className="text-sm font-bold text-[#26332e] flex items-center gap-2">
            <MessageSquareText size={16} className="text-[#31564a]" /> Danh sách toàn bộ bình luận ({comments.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-8 text-sm text-slate-500">Đang tải dữ liệu bình luận từ hệ thống...</p>
          ) : comments.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#efeee9] text-slate-400 uppercase tracking-wider bg-white/50">
                  <th className="py-3 px-5 font-semibold">Độc giả</th>
                  <th className="py-3 px-5 font-semibold">Tên sách</th>
                  <th className="py-3 px-5 font-semibold">Nội dung bình luận</th>
                  <th className="py-3 px-5 font-semibold">Đánh giá</th>
                  <th className="py-3 px-5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeee9]">
                {comments.map((comment) => (
                  <tr className="hover:bg-white/80 transition-colors" key={comment._id}>
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      {typeof comment.user === 'object' && comment.user !== null ? comment.user.name : 'Độc giả'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">{comment.bookTitle || 'Sách'}</td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-md">{comment.body}</td>
                    <td className="py-3.5 px-5">
                      {comment.rating ? (
                        <div className="flex items-center text-amber-500 gap-0.5">
                          <Star size={13} fill="currentColor" />
                          <span className="font-bold text-slate-700 ml-1">{comment.rating}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button 
                        onClick={() => void handleDelete(comment._id)}
                        className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline cursor-pointer"
                        type="button"
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">Chưa có bình luận nào trên hệ thống.</p>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}