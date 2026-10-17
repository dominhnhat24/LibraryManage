import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, BookPlus, LoaderCircle, Search, X } from 'lucide-react';
import { errorMessage, fetchBooks, type ChapterFormPayload, type ChapterUpdatePayload } from '../api/client';
import type { Book, Chapter, ChapterBookReference } from '../types';

// Hàm toDateTimeLocal: Chuyển ISO date thành giá trị giờ địa phương phù hợp với input datetime-local.
function toDateTimeLocal(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// Hàm getBookReference: Chuẩn hóa sách đã populate hoặc ID sách thành thông tin hiển thị trong form sửa.
function getBookReference(book: Chapter['book_id']): ChapterBookReference {
  if (typeof book === 'string') {
    return { title: `Sách ${book.slice(-6)}` };
  }
  return {
    ...book,
    title: book?.title ?? '', // Đảm bảo title luôn là string, tránh lỗi undefined
  };
}

// Hàm ChapterModal: Hiển thị form tạo/sửa chương và tìm sách cha qua API phân trang, không tải toàn bộ catalog.
export function ChapterModal({ chapter, saving, onClose, onSave }: {
  chapter: Chapter | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: ChapterFormPayload | ChapterUpdatePayload) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [accessLevel, setAccessLevel] = useState<Book['access_level']>('free');
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal());
  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [bookSearchError, setBookSearchError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setTitle(chapter?.title ?? '');
    setContent(chapter?.content ?? '');
    setChapterNumber(chapter?.chapter_number ?? 1);
    setAccessLevel(chapter?.access_level ?? 'free');
    setPublishedAt(toDateTimeLocal(chapter?.published_at));
    setBookSearch('');
    setBookResults([]);
    setSelectedBook(null);
    setBookSearchError('');
    setFormError('');
  }, [chapter]);

  useEffect(() => {
    const query = bookSearch.trim();
    if (chapter || selectedBook || query.length < 2) {
      setBookResults([]);
      setSearchingBooks(false);
      setBookSearchError('');
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      setSearchingBooks(true);
      setBookSearchError('');
      try {
        const result = await fetchBooks({ page: 1, limit: 10, search: query });
        if (active) setBookResults(result.books);
      } catch (error) {
        if (active) setBookSearchError(errorMessage(error));
      } finally {
        if (active) setSearchingBooks(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [bookSearch, chapter, selectedBook]);

  // Hàm selectBook: Chọn một đầu sách làm cha cho chương mới.
  function selectBook(book: Book) {
    setSelectedBook(book);
    setBookSearch(book.title);
    setBookResults([]);
    setBookSearchError('');
  }

  // Hàm submitForm: Kiểm tra sách cha, chuẩn hóa dữ liệu và gửi payload theo chế độ tạo hoặc cập nhật.
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (!chapter && !selectedBook) {
      setFormError('Hãy tìm và chọn đầu sách chứa chương này.');
      return;
    }

    try {
      const chapterFields: ChapterUpdatePayload = {
        title: title.trim(),
        content,
        chapter_number: chapterNumber,
        access_level: accessLevel,
        published_at: new Date(publishedAt).toISOString(),
      };
      await onSave(chapter
        ? chapterFields
        : { ...chapterFields, book_id: selectedBook?._id ?? selectedBook?.id ?? '' });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin chương.');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }} role="presentation">
      <section aria-labelledby="chapter-modal-title" aria-modal="true" className="modal-panel" role="dialog">
        <header className="flex items-start justify-between border-b border-[#e9e7df] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-[#e9eee9] text-[#31564a]">
              {chapter ? <BookOpen size={19} /> : <BookPlus size={19} />}
            </span>
            <div>
              <p className="eyebrow">Nội dung thư viện</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#202b28]" id="chapter-modal-title">
                {chapter ? 'Chỉnh sửa chương' : 'Thêm chương mới'}
              </h2>
            </div>
          </div>
          <button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button">
            <X size={17} />
          </button>
        </header>

        <form className="max-h-[calc(100vh-11rem)] overflow-y-auto" onSubmit={submitForm}>
          <div className="grid gap-x-5 gap-y-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <label className="field-label sm:col-span-2">
              Sách cha <span className="text-rose-600">*</span>
              {chapter ? (
                <div className="mt-2 flex min-h-11 items-center gap-3 border border-[#deddd5] bg-[#f8f7f3] px-3">
                  <BookOpen className="shrink-0 text-[#567160]" size={16} />
                  <span className="truncate text-sm font-semibold text-[#26332e]">{getBookReference(chapter.book_id).title}</span>
                  <span className="ml-auto text-[10px] text-slate-500">Không thể đổi sách cha khi sửa</span>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    aria-autocomplete="list"
                    aria-expanded={bookResults.length > 0}
                    className="form-input pl-10"
                    onChange={(event) => {
                      setBookSearch(event.target.value);
                      setSelectedBook(null);
                    }}
                    placeholder="Nhập ít nhất 2 ký tự tên sách..."
                    role="combobox"
                    value={bookSearch}
                  />
                  {searchingBooks && <LoaderCircle className="absolute right-3 top-3 animate-spin text-slate-400" size={16} />}
                  {bookResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border border-[#deddd5] bg-white shadow-lg" role="listbox">
                      {bookResults.map((book) => (
                        <button
                          aria-selected={selectedBook?._id === book._id}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#f4f3ef]"
                          key={book._id}
                          onClick={() => selectBook(book)}
                          role="option"
                          type="button"
                        >
                          <img
                            alt=""
                            className="h-10 w-8 shrink-0 border border-[#e4e1d8] object-cover"
                            onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                            src={book.cover_url || '/book-cover-placeholder.svg'}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-[#26332e]">{book.title}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-slate-500">{book.author_name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!chapter && selectedBook && (
                <span className="mt-1.5 block text-[11px] font-semibold text-[#45704f]">Đã chọn: {selectedBook.title}</span>
              )}
              {!chapter && bookSearch.trim().length > 0 && bookSearch.trim().length < 2 && (
                <span className="mt-1.5 block text-[11px] font-normal text-slate-500">Nhập thêm để tìm sách.</span>
              )}
              {bookSearchError && <span className="mt-1.5 block text-[11px] font-normal text-rose-700" role="alert">{bookSearchError}</span>}
            </label>

            <label className="field-label sm:col-span-2">
              Tiêu đề chương <span className="text-rose-600">*</span>
              <input autoFocus className="form-input mt-2" maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Chương 1 — Khởi đầu" required value={title} />
            </label>
            <label className="field-label">
              Số thứ tự chương <span className="text-rose-600">*</span>
              <input className="form-input mt-2" min="1" onChange={(event) => setChapterNumber(Number(event.target.value))} required type="number" value={chapterNumber} />
            </label>
            <label className="field-label">
              Quyền truy cập
              <select className="form-input mt-2" onChange={(event) => setAccessLevel(event.target.value as Book['access_level'])} value={accessLevel}>
                <option value="free">Miễn phí</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </label>
            <label className="field-label sm:col-span-2">
              Ngày phát hành
              <input className="form-input mt-2" onChange={(event) => setPublishedAt(event.target.value)} required type="datetime-local" value={publishedAt} />
            </label>
            <label className="field-label sm:col-span-2">
              Nội dung chương
              <textarea className="form-input mt-2 min-h-56 resize-y leading-6" maxLength={200000} onChange={(event) => setContent(event.target.value)} placeholder="Nhập nội dung chương..." value={content} />
              <span className="mt-1 block text-right text-[10px] font-normal text-slate-500">{content.length.toLocaleString('vi-VN')} / 200.000 ký tự</span>
            </label>
            {formError && <p className="sm:col-span-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{formError}</p>}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-[#e9e7df] bg-[#fbfaf7] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button>
            <button className="button-primary" disabled={saving} type="submit">
              {saving ? <LoaderCircle className="animate-spin" size={16} /> : <BookPlus size={16} />}
              {saving ? 'Đang lưu...' : chapter ? 'Lưu thay đổi' : 'Tạo chương'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
