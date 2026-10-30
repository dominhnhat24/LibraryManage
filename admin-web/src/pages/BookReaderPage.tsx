// Import { useEffect, useRef, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/BookReaderPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useRef, useState } from 'react';
// Import { ArrowLeft, BookOpen, Download, Printer, Sun, Moon } từ lucide-react để dùng trong giao diện.
import { ArrowLeft, BookOpen, Download, Printer, Sun, Moon } from 'lucide-react';
// Import { Link, useNavigate, useParams } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate, useParams } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { downloadProtectedBook, errorMessage, fetchPublicBook, streamPublicBook } từ ../api/client để dùng trong giao diện.
import { downloadProtectedBook, errorMessage, fetchPublicBook, streamPublicBook } from '../api/client';
// Import type { Book } từ ../types để dùng trong giao diện.
import type { Book } from '../types';

// Hàm BookReaderPage: Hiển thị PDF trong một trang đọc toàn màn hình với thanh công cụ và điều khiển riêng.
/**
 * Hàm/thành phần BookReaderPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useParams, useAuth, useNavigate, useState, useEffect, setLoadingBook, setError, async.
 */
export function BookReaderPage() {
  // Biến { bookId = '' } nhận giá trị từ useParams(). const không gán lại; let có thể cập nhật.
  const { bookId = '' } = useParams();
  // Biến { user, loading: loadingAuth } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: loadingAuth } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến iframeRef nhận giá trị từ useRef<HTMLIFrameElement>(null). const không gán lại; let có thể cập nhật.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Biến [book, setBook] nhận giá trị từ useState<Book | null>(null). const không gán lại; let có thể cập nhật.
  const [book, setBook] = useState<Book | null>(null);
  // Biến [readerUrl, setReaderUrl] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [readerUrl, setReaderUrl] = useState('');
  // Biến [loadingBook, setLoadingBook] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loadingBook, setLoadingBook] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [darkWorkspace, setDarkWorkspace] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [darkWorkspace, setDarkWorkspace] = useState(false);
  // Biến [downloading, setDownloading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [downloading, setDownloading] = useState(false);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (loadingAuth) return; let active = true; setLoadingBook(tru
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện loadingAuth đúng.
    if (loadingAuth) return;

    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setLoadingBook với đối số để cập nhật logic/giao diện: setLoadingBook(true)
    setLoadingBook(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    /**
     * Hàm/thành phần loadBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: fetchPublicBook, setBook, navigate, encodeURIComponent, Error, streamPublicBook, setReaderUrl, createObjectURL.
     */
    const loadBook = async () => {
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến bookResult nhận giá trị từ await fetchPublicBook(bookId). const không gán lại; let có thể cập nhật.
        const bookResult = await fetchPublicBook(bookId);
        // if chỉ chạy nhánh này khi điều kiện !active đúng.
        if (!active) return;
        // Gọi/thực thi setBook với đối số để cập nhật logic/giao diện: setBook(bookResult)
        setBook(bookResult);
        // if chỉ chạy nhánh này khi điều kiện bookResult._id !== bookId đúng.
        if (bookResult._id !== bookId) {
          // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(bookResult._id)}/pdf`, { replace: true })
          navigate(`/books/${encodeURIComponent(bookResult._id)}/pdf`, { replace: true });
        }
        // if chỉ chạy nhánh này khi điều kiện bookResult.reader_mode === 'chapters' đúng.
        if (bookResult.reader_mode === 'chapters') {
          // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(bookResult._id)}/read`, { replace: true })
          navigate(`/books/${encodeURIComponent(bookResult._id)}/read`, { replace: true });
          // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
          return;
        }
        // if chỉ chạy nhánh này khi điều kiện bookResult.reader_mode !== 'pdf' đúng.
        if (bookResult.reader_mode !== 'pdf') {
          // throw phát sinh lỗi để hàm gọi phía trên xử lý.
          throw new Error(bookResult.reader_mode === 'unsupported'
            ? `Định dạng ${bookResult.file_format || 'này'} chưa có trình đọc trong ứng dụng.`
            : 'Sách chưa có chương đọc được hoặc tệp PDF gốc hợp lệ.');
        }
        // Biến pdf nhận giá trị từ await streamPublicBook(bookResult._id). const không gán lại; let có thể cập nhật.
        const pdf = await streamPublicBook(bookResult._id);
        // if chỉ chạy nhánh này khi điều kiện !active đúng.
        if (!active) return;
        // if chỉ chạy nhánh này khi điều kiện pdf.type !== 'application/pdf' || pdf.size === 0 đúng.
        if (pdf.type !== 'application/pdf' || pdf.size === 0) {
          // throw phát sinh lỗi để hàm gọi phía trên xử lý.
          throw new Error('Tệp sách không phải PDF hợp lệ hoặc đang rỗng.');
        }
        // Gọi/thực thi setReaderUrl với đối số để cập nhật logic/giao diện: setReaderUrl(URL.createObjectURL(pdf))
        setReaderUrl(URL.createObjectURL(pdf));
      } catch (loadError: unknown) {
        // if chỉ chạy nhánh này khi điều kiện !active đúng.
        if (!active) return;
        // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(loadError))
        setError(errorMessage(loadError));
      } finally {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) setLoadingBook(false);
      }
    };
    // Gọi/thực thi loadBook với đối số để cập nhật logic/giao diện: void loadBook()
    void loadBook();

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
      active = false;
    };
  }, [bookId, loadingAuth, navigate, user]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => () => { if (readerUrl) URL.revokeObjectURL(readerUrl); }, [reade
  useEffect(() => () => {
    // if chỉ chạy nhánh này khi điều kiện readerUrl đúng.
    if (readerUrl) URL.revokeObjectURL(readerUrl);
  }, [readerUrl]);

  // Hàm downloadPdf: Tải sách qua endpoint VIP/ADMIN thay vì dùng lại URL stream đọc thông thường.
  /**
   * Hàm/thành phần downloadPdf: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setDownloading, setError, downloadProtectedBook, errorMessage.
   */
  async function downloadPdf() {
    // if chỉ chạy nhánh này khi điều kiện !book || downloading đúng.
    if (!book || downloading) return;
    // Gọi/thực thi setDownloading với đối số để cập nhật logic/giao diện: setDownloading(true)
    setDownloading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await downloadProtectedBook(book._id, book.title)
      await downloadProtectedBook(book._id, book.title);
    } catch (downloadError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(downloadError))
      setError(errorMessage(downloadError));
    } finally {
      // Gọi/thực thi setDownloading với đối số để cập nhật logic/giao diện: setDownloading(false)
      setDownloading(false);
    }
  }

  // Hàm printPdf: Gửi tài liệu đang mở trong trình xem PDF tới hộp thoại in của trình duyệt.
  /**
   * Hàm/thành phần printPdf: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: focus, print.
   */
  function printPdf() {
    // Gọi/thực thi .focus với đối số để cập nhật logic/giao diện: iframeRef.current?.contentWindow?.focus()
    iframeRef.current?.contentWindow?.focus();
    // Gọi/thực thi .print với đối số để cập nhật logic/giao diện: iframeRef.current?.contentWindow?.print()
    iframeRef.current?.contentWindow?.print();
  }

  // Biến returnPath nhận giá trị từ book?._id ? `/books/${encodeURIComponent(book._id)}` : . const không gán lại; let có thể cập nhật.
  const returnPath = book?._id ? `/books/${encodeURIComponent(book._id)}` : '/';

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <main className={`reader-pdf-workspace ${darkWorkspace ? 'reader-pdf-dark' : '.
  return (
    <main className={`reader-pdf-workspace ${darkWorkspace ? 'reader-pdf-dark' : 'reader-pdf-light'} flex h-screen min-h-[420px] flex-col overflow-hidden ${darkWorkspace ? 'bg-[#20252b]' : 'bg-[#edf2f7]'}`}>
      <header className={`z-10 grid min-h-[58px] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center border-b px-3 sm:px-5 ${
        darkWorkspace ? 'border-slate-700 bg-[#171b20] text-slate-100' : 'border-slate-200 bg-white text-[#26332e]'
      }`}>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            aria-label="Quay lại thông tin sách"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${darkWorkspace ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            to={returnPath}
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold sm:text-sm">{book?.title || 'Đang mở sách…'}</p>
            {book ? <p className={`hidden truncate text-[10px] sm:block ${darkWorkspace ? 'text-slate-400' : 'text-slate-500'}`}>{book.author_name}</p> : null}
          </div>
        </div>

        <nav aria-label="Điều khiển trình đọc" className="flex items-center justify-end gap-1">
          <button
            aria-label="In sách"
            className={`grid h-9 w-9 place-items-center rounded-md ${darkWorkspace ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            disabled={!readerUrl}
            onClick={printPdf}
            type="button"
          >
            <Printer size={16} />
          </button>
          {user?.role === 'ADMIN' || user?.is_premium ? (
            <button
              aria-label="Tải sách ngoại tuyến"
              className={`grid h-9 w-9 place-items-center rounded-md ${darkWorkspace ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              disabled={!readerUrl || downloading}
              onClick={() => void downloadPdf()}
              type="button"
              title="Tải sách ngoại tuyến"
            >
              <Download size={16} />
            </button>
          ) : (
            <Link
              aria-label="Đăng ký Premium để tải sách"
              className={`grid h-9 w-9 place-items-center rounded-md ${darkWorkspace ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              title="Đăng ký Premium để tải sách ngoại tuyến"
              to="/account"
            >
              <Download size={16} />
            </Link>
          )}
          <button
            aria-label={darkWorkspace ? 'Dùng nền sáng' : 'Dùng nền tối'}
            className={`grid h-9 w-9 place-items-center rounded-md ${darkWorkspace ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            onClick={() => setDarkWorkspace((current) => !current)}
            type="button"
          >
            {darkWorkspace ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </nav>
      </header>

      <section aria-label="Trình đọc PDF" className="relative min-h-0 flex-1">
        {loadingBook ? (
          <div className="grid h-full place-items-center text-sm text-slate-500">Đang tải sách…</div>
        ) : error ? (
          <div className="grid h-full place-items-center px-5">
            <div className={`max-w-md border p-6 text-center ${darkWorkspace ? 'border-slate-700 bg-[#171b20] text-slate-100' : 'border-slate-200 bg-white text-[#26332e]'}`}>
              <BookOpen className="mx-auto text-[#567160]" size={30} />
              <h1 className="mt-4 text-lg font-bold">Không thể mở sách</h1>
              <p className={`mt-2 text-sm ${darkWorkspace ? 'text-slate-300' : 'text-slate-600'}`} role="alert">{error}</p>
              <button className="button-primary mt-5" onClick={() => window.location.reload()} type="button">Thử lại</button>
            </div>
          </div>
        ) : readerUrl && book ? (
          <iframe
            className="h-full w-full border-0"
            ref={iframeRef}
            src={readerUrl}
            title={`Đọc sách ${book.title}`}
          />
        ) : null}
      </section>
    </main>
  );
}
