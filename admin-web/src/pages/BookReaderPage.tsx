import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Download, Printer, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { downloadProtectedBook, errorMessage, fetchPublicBook, streamPublicBook } from '../api/client';
import type { Book } from '../types';

// Hàm BookReaderPage: Hiển thị PDF trong một trang đọc toàn màn hình với thanh công cụ và điều khiển riêng.
export function BookReaderPage() {
  const { bookId = '' } = useParams();
  const { user, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [readerUrl, setReaderUrl] = useState('');
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [darkWorkspace, setDarkWorkspace] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (loadingAuth) return;

    let active = true;
    setLoadingBook(true);
    setError('');
    const loadBook = async () => {
      try {
        const bookResult = await fetchPublicBook(bookId);
        if (!active) return;
        setBook(bookResult);
        if (bookResult._id !== bookId) {
          navigate(`/books/${encodeURIComponent(bookResult._id)}/pdf`, { replace: true });
        }
        if (bookResult.reader_mode === 'chapters') {
          navigate(`/books/${encodeURIComponent(bookResult._id)}/read`, { replace: true });
          return;
        }
        if (bookResult.reader_mode !== 'pdf') {
          throw new Error(bookResult.reader_mode === 'unsupported'
            ? `Định dạng ${bookResult.file_format || 'này'} chưa có trình đọc trong ứng dụng.`
            : 'Sách chưa có chương đọc được hoặc tệp PDF gốc hợp lệ.');
        }
        const pdf = await streamPublicBook(bookResult._id);
        if (!active) return;
        if (pdf.type !== 'application/pdf' || pdf.size === 0) {
          throw new Error('Tệp sách không phải PDF hợp lệ hoặc đang rỗng.');
        }
        setReaderUrl(URL.createObjectURL(pdf));
      } catch (loadError: unknown) {
        if (!active) return;
        setError(errorMessage(loadError));
      } finally {
        if (active) setLoadingBook(false);
      }
    };
    void loadBook();

    return () => {
      active = false;
    };
  }, [bookId, loadingAuth, navigate, user]);

  useEffect(() => () => {
    if (readerUrl) URL.revokeObjectURL(readerUrl);
  }, [readerUrl]);

  // Hàm downloadPdf: Tải sách qua endpoint VIP/ADMIN thay vì dùng lại URL stream đọc thông thường.
  async function downloadPdf() {
    if (!book || downloading) return;
    setDownloading(true);
    setError('');
    try {
      await downloadProtectedBook(book._id, book.title);
    } catch (downloadError: unknown) {
      setError(errorMessage(downloadError));
    } finally {
      setDownloading(false);
    }
  }

  // Hàm printPdf: Gửi tài liệu đang mở trong trình xem PDF tới hộp thoại in của trình duyệt.
  function printPdf() {
    iframeRef.current?.contentWindow?.focus();
    iframeRef.current?.contentWindow?.print();
  }

  const returnPath = book?._id ? `/books/${encodeURIComponent(book._id)}` : '/';

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
