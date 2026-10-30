// Import { BookOpen, Pencil, Trash2 } từ lucide-react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ChapterTable.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
// Import type { Chapter, ChapterBookReference } từ ../types để dùng trong giao diện.
import type { Chapter, ChapterBookReference } from '../types';

// Biến accessLabels nhận giá trị từ { free: 'Miễn phí', premium: 'Premium', vip: 'VIP', }. const không gán lại; let có thể cập nhật.
const accessLabels: Record<Chapter['access_level'], string> = {
  free: 'Miễn phí',
  premium: 'Premium',
  vip: 'VIP',
};

// Hàm getBookTitle: Hiển thị tên sách cha đã populate hoặc mã sách nếu API chỉ trả ID.
/**
 * Hàm/thành phần getBookTitle: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: book.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: slice.
 */
function getBookTitle(book: Chapter['book_id']): string {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof book === 'string' ? `Sách ${book.slice(-6)}` : book.title.
  return typeof book === 'string' ? `Sách ${book.slice(-6)}` : book.title;
}

// Hàm getChapterBook: Lấy thông tin sách cha đã populate để hiển thị ảnh bìa và danh mục.
/**
 * Hàm/thành phần getChapterBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: book.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function getChapterBook(book: Chapter['book_id']): ChapterBookReference | null {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof book === 'string' ? null : book.
  return typeof book === 'string' ? null : book;
}

// Hàm ChapterTable: Hiển thị danh sách chương responsive, sách cha, số thứ tự, quyền đọc và thao tác CRUD.
/**
 * Hàm/thành phần ChapterTable: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { chapters, loading, onEdit, onDelete }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: return, map, getChapterBook, getBookTitle, DateTimeFormat, format, Date, onEdit.
 */
export function ChapterTable({ chapters, loading, onEdit, onDelete }: {
  chapters: Chapter[];
  loading: boolean;
  onEdit: (chapter: Chapter) => void;
  onDelete: (chapter: Chapter) => void;
}) {
  // if chỉ chạy nhánh này khi điều kiện loading đúng.
  if (loading) {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="grid min-h-64 place-items-center"> <div className="flex items-.
    return (
      <div className="grid min-h-64 place-items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span className="h-4 w-4 animate-spin border-2 border-[#24795C] border-t-transparent" />
          Đang tải danh sách chương...
        </div>
      </div>
    );
  }

  // if chỉ chạy nhánh này khi điều kiện chapters.length === 0 đúng.
  if (chapters.length === 0) {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="flex min-h-64 flex-col items-center justify-center px-6 text-c.
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

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="overflow-x-auto"> <table className="w-full min-w-[760px] borde.
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[#e9e8e2] bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <th className="px-5 py-3.5">Chương</th>
            <th className="px-4 py-3.5">Sách</th>
            <th className="px-4 py-3.5">Quyền đọc</th>
            <th className="px-4 py-3.5">Ngày phát hành</th>
            <th className="px-5 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF3F0]">
          {chapters.map((chapter) => {
            // Biến book nhận giá trị từ getChapterBook(chapter.book_id). const không gán lại; let có thể cập nhật.
            const book = getChapterBook(chapter.book_id);
            // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <tr className="group transition-colors hover:bg-[#FFFFFF]" key={chapter._id}> .
            return (
              <tr className="group transition-colors hover:bg-[#FFFFFF]" key={chapter._id}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#DDE9E6] bg-[#f1eee6] text-xs font-bold tabular-nums text-[#496a55]">
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
                        className="h-10 w-8 shrink-0 border border-[#DDE9E6] object-cover"
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
                      ? 'border-[#C3E5D0] bg-[#E3F4EB] text-[#24795C]'
                      : 'border-[#F5DDB0] bg-[#FFF9ED] text-[#B8860B]'
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
