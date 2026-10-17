import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import type { Chapter, ChapterBookReference } from '../types';

const accessLabels: Record<Chapter['access_level'], string> = {
  free: 'Miễn phí',
  premium: 'Premium',
  vip: 'VIP',
};

// Hàm getBookTitle: Hiển thị tên sách cha đã populate hoặc mã sách nếu API chỉ trả ID.
function getBookTitle(book: Chapter['book_id']): string {
  return typeof book === 'string' ? `Sách ${book.slice(-6)}` : book.title;
}

// Hàm getChapterBook: Lấy thông tin sách cha đã populate để hiển thị ảnh bìa và danh mục.
function getChapterBook(book: Chapter['book_id']): ChapterBookReference | null {
  return typeof book === 'string' ? null : book;
}

// Hàm ChapterTable: Hiển thị danh sách chương responsive, sách cha, số thứ tự, quyền đọc và thao tác CRUD.
export function ChapterTable({ chapters, loading, onEdit, onDelete }: {
  chapters: Chapter[];
  loading: boolean;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
}) {
  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span className="h-4 w-4 animate-spin border-2 border-[#31564a] border-t-transparent" />
          Đang tải danh sách chương...
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <span className="grid h-14 w-14 place-items-center border border-[#e6e4dc] bg-[#faf9f6] text-[#78837c]">
          <BookOpen size={24} strokeWidth={1.5} />
        </span>
        <h3 className="mt-4 text-sm font-bold text-slate-800">Chưa tìm thấy chương</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Thử đổi từ khóa hoặc bộ lọc, hoặc tạo chương mới cho một đầu sách.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[#e9e8e2] bg-[#f8f7f3] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <th className="px-5 py-3.5">Chương</th>
            <th className="px-4 py-3.5">Sách</th>
            <th className="px-4 py-3.5">Quyền đọc</th>
            <th className="px-4 py-3.5">Ngày phát hành</th>
            <th className="px-5 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#efeee9]">
          {chapters.map((chapter) => {
            const book = getChapterBook(chapter.book_id);
            return (
              <tr className="group transition-colors hover:bg-[#fbfaf7]" key={chapter._id}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#e4e1d8] bg-[#f1eee6] text-xs font-bold tabular-nums text-[#496a55]">
                      {chapter.chapter_number}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold leading-5 text-[#202b28]">{chapter.title}</p>
                      <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{chapter.slug || chapter._id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {book && (
                      <img
                        alt=""
                        className="h-10 w-8 shrink-0 border border-[#e4e1d8] object-cover"
                        onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                        src={book.cover_url || '/book-cover-placeholder.svg'}
                      />
                    )}
                    <span className="line-clamp-2 text-xs font-semibold text-slate-700">{getBookTitle(chapter.book_id)}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold ${
                    chapter.access_level === 'free'
                      ? 'border-[#d3e2d5] bg-[#edf5ee] text-[#45704f]'
                      : 'border-[#e7ddc5] bg-[#f8f3e8] text-[#94743c]'
                  }`}>
                    {accessLabels[chapter.access_level]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {chapter.published_at
                    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(chapter.published_at))
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button
                      aria-label={`Sửa ${chapter.title}`}
                      className="icon-button"
                      onClick={() => onEdit(chapter)}
                      type="button"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={`Xóa ${chapter.title}`}
                      className="icon-button icon-button-danger"
                      onClick={() => onDelete(chapter)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
