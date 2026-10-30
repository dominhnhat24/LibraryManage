// Import { useEffect, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ChapterModal.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState, type FormEvent } from 'react';
// Import { BookOpen, BookPlus, LoaderCircle, Search, X } từ lucide-react để dùng trong giao diện.
import { BookOpen, BookPlus, LoaderCircle, Search, X } from 'lucide-react';
// Import { errorMessage, fetchBooks, type ChapterFormPayload, type ChapterUpdatePayload } từ ../api/client để dùng trong giao diện.
import { errorMessage, fetchBooks, type ChapterFormPayload, type ChapterUpdatePayload } from '../api/client';
// Import type { Book, Chapter, ChapterBookReference } từ ../types để dùng trong giao diện.
import type { Book, Chapter, ChapterBookReference } from '../types';

// Hàm toDateTimeLocal: Chuyển ISO date thành giá trị giờ địa phương phù hợp với input datetime-local.
/**
 * Hàm/thành phần toDateTimeLocal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, isNaN, getTime, getTimezoneOffset, toISOString, slice.
 */
function toDateTimeLocal(value?: string): string {
  // Biến date nhận giá trị từ value ? new Date(value) : new Date(). const không gán lại; let có thể cập nhật.
  const date = value ? new Date(value) : new Date();
  // if chỉ chạy nhánh này khi điều kiện Number.isNaN(date.getTime()) đúng.
  if (Number.isNaN(date.getTime())) return '';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice.
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// Hàm getBookReference: Chuẩn hóa sách đã populate hoặc ID sách thành thông tin hiển thị trong form sửa.
/**
 * Hàm/thành phần getBookReference: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: book.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: slice.
 */
function getBookReference(book: Chapter['book_id']): ChapterBookReference {
  // if chỉ chạy nhánh này khi điều kiện typeof book === 'string' đúng.
  if (typeof book === 'string') {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { title: `Sách ${book.slice(-6)}` }.
    return { title: `Sách ${book.slice(-6)}` };
  }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { ...book, title: book?.title ?? '',.
  return {
    ...book,
    title: book?.title ?? '', // Đảm bảo title luôn là string, tránh lỗi undefined
  };
}

// Hàm ChapterModal: Hiển thị form tạo/sửa chương và tìm sách cha qua API phân trang, không tải toàn bộ catalog.
/**
 * Hàm/thành phần ChapterModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { chapter, saving, onClose, onSave }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, toDateTimeLocal, useEffect, setTitle, setContent, setChapterNumber, setAccessLevel, setPublishedAt.
 */
export function ChapterModal({ chapter, saving, onClose, onSave }: {
  chapter: Chapter | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: ChapterFormPayload | ChapterUpdatePayload) => Promise<void>;
}) {
  // Biến [title, setTitle] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [title, setTitle] = useState('');
  // Biến [content, setContent] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [content, setContent] = useState('');
  // Biến [chapterNumber, setChapterNumber] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [chapterNumber, setChapterNumber] = useState(1);
  // Biến [accessLevel, setAccessLevel] nhận giá trị từ useState<Book['access_level']>('free'). const không gán lại; let có thể cập nhật.
  const [accessLevel, setAccessLevel] = useState<Book['access_level']>('free');
  // Biến [publishedAt, setPublishedAt] nhận giá trị từ useState(toDateTimeLocal()). const không gán lại; let có thể cập nhật.
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal());
  // Biến [bookSearch, setBookSearch] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [bookSearch, setBookSearch] = useState('');
  // Biến [bookResults, setBookResults] nhận giá trị từ useState<Book[]>([]). const không gán lại; let có thể cập nhật.
  const [bookResults, setBookResults] = useState<Book[]>([]);
  // Biến [selectedBook, setSelectedBook] nhận giá trị từ useState<Book | null>(null). const không gán lại; let có thể cập nhật.
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  // Biến [searchingBooks, setSearchingBooks] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [searchingBooks, setSearchingBooks] = useState(false);
  // Biến [bookSearchError, setBookSearchErro nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [bookSearchError, setBookSearchError] = useState('');
  // Biến [formError, setFormError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [formError, setFormError] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { setTitle(chapter?.title ?? ''); setContent(chapter?.content ??
  useEffect(() => {
    // Gọi/thực thi setTitle với đối số để cập nhật logic/giao diện: setTitle(chapter?.title ?? '')
    setTitle(chapter?.title ?? '');
    // Gọi/thực thi setContent với đối số để cập nhật logic/giao diện: setContent(chapter?.content ?? '')
    setContent(chapter?.content ?? '');
    // Gọi/thực thi setChapterNumber với đối số để cập nhật logic/giao diện: setChapterNumber(chapter?.chapter_number ?? 1)
    setChapterNumber(chapter?.chapter_number ?? 1);
    // Gọi/thực thi setAccessLevel với đối số để cập nhật logic/giao diện: setAccessLevel(chapter?.access_level ?? 'free')
    setAccessLevel(chapter?.access_level ?? 'free');
    // Gọi/thực thi setPublishedAt với đối số để cập nhật logic/giao diện: setPublishedAt(toDateTimeLocal(chapter?.published_at))
    setPublishedAt(toDateTimeLocal(chapter?.published_at));
    // Gọi/thực thi setBookSearch với đối số để cập nhật logic/giao diện: setBookSearch('')
    setBookSearch('');
    // Gọi/thực thi setBookResults với đối số để cập nhật logic/giao diện: setBookResults([])
    setBookResults([]);
    // Gọi/thực thi setSelectedBook với đối số để cập nhật logic/giao diện: setSelectedBook(null)
    setSelectedBook(null);
    // Gọi/thực thi setBookSearchError với đối số để cập nhật logic/giao diện: setBookSearchError('')
    setBookSearchError('');
    // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('')
    setFormError('');
  }, [chapter]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { const query = bookSearch.trim(); if (chapter || selectedBook |
  useEffect(() => {
    // Biến query nhận giá trị từ bookSearch.trim(). const không gán lại; let có thể cập nhật.
    const query = bookSearch.trim();
    // if chỉ chạy nhánh này khi điều kiện chapter || selectedBook || query.length < 2 đúng.
    if (chapter || selectedBook || query.length < 2) {
      // Gọi/thực thi setBookResults với đối số để cập nhật logic/giao diện: setBookResults([])
      setBookResults([]);
      // Gọi/thực thi setSearchingBooks với đối số để cập nhật logic/giao diện: setSearchingBooks(false)
      setSearchingBooks(false);
      // Gọi/thực thi setBookSearchError với đối số để cập nhật logic/giao diện: setBookSearchError('')
      setBookSearchError('');
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }

    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Biến timeout nhận giá trị từ window.setTimeout(async () => { setSearchingBooks(true). const không gán lại; let có thể cập nhật.
    const timeout = window.setTimeout(async () => {
      // Gọi/thực thi setSearchingBooks với đối số để cập nhật logic/giao diện: setSearchingBooks(true)
      setSearchingBooks(true);
      // Gọi/thực thi setBookSearchError với đối số để cập nhật logic/giao diện: setBookSearchError('')
      setBookSearchError('');
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến result nhận giá trị từ await fetchBooks({ page: 1, limit: 10, search: query }). const không gán lại; let có thể cập nhật.
        const result = await fetchBooks({ page: 1, limit: 10, search: query });
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setBookResults(result.books);
      } catch (error) {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setBookSearchError(errorMessage(error));
      } finally {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setSearchingBooks(false);
      }
    }, 250);

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; window.clearTimeout(timeout); }.
    return () => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
      active = false;
      // Gọi/thực thi window.clearTimeout với đối số để cập nhật logic/giao diện: window.clearTimeout(timeout)
      window.clearTimeout(timeout);
    };
  }, [bookSearch, chapter, selectedBook]);

  // Hàm selectBook: Chọn một đầu sách làm cha cho chương mới.
  /**
   * Hàm/thành phần selectBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: book.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSelectedBook, setBookSearch, setBookResults, setBookSearchError.
   */
  function selectBook(book: Book) {
    // Gọi/thực thi setSelectedBook với đối số để cập nhật logic/giao diện: setSelectedBook(book)
    setSelectedBook(book);
    // Gọi/thực thi setBookSearch với đối số để cập nhật logic/giao diện: setBookSearch(book.title)
    setBookSearch(book.title);
    // Gọi/thực thi setBookResults với đối số để cập nhật logic/giao diện: setBookResults([])
    setBookResults([]);
    // Gọi/thực thi setBookSearchError với đối số để cập nhật logic/giao diện: setBookSearchError('')
    setBookSearchError('');
  }

  // Hàm submitForm: Kiểm tra sách cha, chuẩn hóa dữ liệu và gửi payload theo chế độ tạo hoặc cập nhật.
  /**
   * Hàm/thành phần submitForm: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setFormError, trim, Date, toISOString, onSave.
   * Được tham chiếu tại: admin-web/src/components/BookModal.tsx.
   */
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('')
    setFormError('');
    // if chỉ chạy nhánh này khi điều kiện !chapter && !selectedBook đúng.
    if (!chapter && !selectedBook) {
      // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('Hãy tìm và chọn đầu sách chứa chương này.')
      setFormError('Hãy tìm và chọn đầu sách chứa chương này.');
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }

    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến chapterFields nhận giá trị từ { title: title.trim(), content, chapter_number: chapter. const không gán lại; let có thể cập nhật.
      const chapterFields: ChapterUpdatePayload = {
        title: title.trim(),
        content,
        chapter_number: chapterNumber,
        access_level: accessLevel,
        published_at: new Date(publishedAt).toISOString(),
      };
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await onSave(chapter ? chapterFields : { ...chapterFields, book_id: selectedBook
      await onSave(chapter
        ? chapterFields
        : { ...chapterFields, book_id: selectedBook?._id ?? selectedBook?.id ?? '' });
    } catch (error) {
      // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin c
      setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin chương.');
    }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="modal-backdrop" onMouseDown={(event) => { if (event.target ===.
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      // if chỉ chạy nhánh này khi điều kiện event.target === event.currentTarget && !saving đúng.
      if (event.target === event.currentTarget && !saving) onClose();
    }} role="presentation">
      <section aria-labelledby="chapter-modal-title" aria-modal="true" className="modal-panel" role="dialog">
        <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-[#e9eee9] text-[#24795C]">
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
                <div className="mt-2 flex min-h-11 items-center gap-3 border border-[#DDE9E6] bg-[#F8FBF9] px-3">
                  <BookOpen className="shrink-0 text-[#526B86]" size={16} />
                  <span className="truncate text-sm font-semibold text-[#153D31]">{getBookReference(chapter.book_id).title}</span>
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
                      // Gọi/thực thi setBookSearch với đối số để cập nhật logic/giao diện: setBookSearch(event.target.value)
                      setBookSearch(event.target.value);
                      // Gọi/thực thi setSelectedBook với đối số để cập nhật logic/giao diện: setSelectedBook(null)
                      setSelectedBook(null);
                    }}
                    placeholder="Nhập ít nhất 2 ký tự tên sách..."
                    role="combobox"
                    value={bookSearch}
                  />
                  {searchingBooks && <LoaderCircle className="absolute right-3 top-3 animate-spin text-slate-400" size={16} />}
                  {bookResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border border-[#DDE9E6] bg-white shadow-lg" role="listbox">
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
                            className="h-10 w-8 shrink-0 border border-[#DDE9E6] object-cover"
                            onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                            src={book.cover_url || '/book-cover-placeholder.svg'}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-[#153D31]">{book.title}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-slate-500">{book.author_name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!chapter && selectedBook && (
                <span className="mt-1.5 block text-[11px] font-semibold text-[#24795C]">Đã chọn: {selectedBook.title}</span>
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
          <footer className="flex flex-col-reverse gap-2 border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
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
