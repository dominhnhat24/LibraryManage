// Import { useEffect, useRef, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderBookPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
// Import { Bookmark, BookOpen, LoaderCircle, Star, Trash2 } từ lucide-react để dùng trong giao diện.
import { Bookmark, BookOpen, LoaderCircle, Star, Trash2 } from 'lucide-react';
// Import { useNavigate, useParams } từ react-router-dom để dùng trong giao diện.
import { useNavigate, useParams } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import { createBookComment, deleteBookComment, errorMessage, fetchBookComments, fetchPu từ ../api/client để dùng trong giao diện.
import {
  createBookComment, deleteBookComment, errorMessage, fetchBookComments, fetchPublicBook, streamPublicBook,
  fetchReadableChapters, fetchReaderBookmarks, readBookChapter, saveReaderBookmark, updateBookComment,
} from '../api/client';
// Import type { Bookmark as BookmarkType, Book, Chapter, Comment, PaginationData, ReadCha từ ../types để dùng trong giao diện.
import type { Bookmark as BookmarkType, Book, Chapter, Comment, PaginationData, ReadChapterResult } from '../types';
// Import { cleanBookDescription } từ ../utils/book-description để dùng trong giao diện.
import { cleanBookDescription } from '../utils/book-description';

// Hàm ReaderBookPage: Hiển thị thông tin sách và đọc PDF qua endpoint riêng tư có kiểm tra entitlement.
/**
 * Hàm/thành phần ReaderBookPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useParams, useAuth, useNavigate, useRef, useState, useEffect, setBook, setLoadingBook.
 */
export function ReaderBookPage() {
  // Biến { bookId = '' } nhận giá trị từ useParams(). const không gán lại; let có thể cập nhật.
  const { bookId = '' } = useParams();
  // Biến { user, loading: loadingAuth } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: loadingAuth } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến previousBookIdRef nhận giá trị từ useRef(bookId). const không gán lại; let có thể cập nhật.
  const previousBookIdRef = useRef(bookId);
  // Biến [book, setBook] nhận giá trị từ useState<Book | null>(null). const không gán lại; let có thể cập nhật.
  const [book, setBook] = useState<Book | null>(null);
  // Biến [loadingBook, setLoadingBook] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loadingBook, setLoadingBook] = useState(true);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [comments, setComments] nhận giá trị từ useState<Comment[]>([]). const không gán lại; let có thể cập nhật.
  const [comments, setComments] = useState<Comment[]>([]);
  // Biến [commentPage, setCommentPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [commentPage, setCommentPage] = useState(1);
  // Biến [commentPagination, setCommentPagin nhận giá trị từ useState<PaginationData | null>(null). const không gán lại; let có thể cập nhật.
  const [commentPagination, setCommentPagination] = useState<PaginationData | null>(null);
  // Biến [commentsLoading, setCommentsLoadin nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [commentsLoading, setCommentsLoading] = useState(true);
  // Biến [commentError, setCommentError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [commentError, setCommentError] = useState('');
  // Biến [commentRetryKey, setCommentRetryKe nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [commentRetryKey, setCommentRetryKey] = useState(0);
  // Biến [commentNotice, setCommentNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [commentNotice, setCommentNotice] = useState('');
  // Biến [commentBody, setCommentBody] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [commentBody, setCommentBody] = useState('');
  // Biến [commentRating, setCommentRating] nhận giá trị từ useState(5). const không gán lại; let có thể cập nhật.
  const [commentRating, setCommentRating] = useState(5);
  // Biến [editingComment, setEditingComment] nhận giá trị từ useState<Comment | null>(null). const không gán lại; let có thể cập nhật.
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  // Biến [savingComment, setSavingComment] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [savingComment, setSavingComment] = useState(false);
  // Biến [chapters, setChapters] nhận giá trị từ useState<Chapter[]>([]). const không gán lại; let có thể cập nhật.
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Biến [chapterPagination, setChapterPagin nhận giá trị từ useState<PaginationData | null>(null). const không gán lại; let có thể cập nhật.
  const [chapterPagination, setChapterPagination] = useState<PaginationData | null>(null);
  // Biến [chapterPage, setChapterPage] nhận giá trị từ useState(1). const không gán lại; let có thể cập nhật.
  const [chapterPage, setChapterPage] = useState(1);
  // Biến [chapterLoading, setChapterLoading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [chapterLoading, setChapterLoading] = useState(false);
  // Biến [chapterError, setChapterError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [chapterError, setChapterError] = useState('');
  // Biến [chapterRetryKey, setChapterRetryKe nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [chapterRetryKey, setChapterRetryKey] = useState(0);
  // Biến [activeChapter, setActiveChapter] nhận giá trị từ useState<ReadChapterResult | null>(null). const không gán lại; let có thể cập nhật.
  const [activeChapter, setActiveChapter] = useState<ReadChapterResult | null>(null);
  // Biến [readingChapter, setReadingChapter] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [readingChapter, setReadingChapter] = useState(false);
  // Biến [savedBookmarks, setSavedBookmarks] nhận giá trị từ useState<BookmarkType[]>([]). const không gán lại; let có thể cập nhật.
  const [savedBookmarks, setSavedBookmarks] = useState<BookmarkType[]>([]);
  // Biến [savingBookmark, setSavingBookmark] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [savingBookmark, setSavingBookmark] = useState(false);
  // Biến [pdfUrl, setPdfUrl] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [pdfUrl, setPdfUrl] = useState('');
  // Biến [pdfLoading, setPdfLoading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [pdfLoading, setPdfLoading] = useState(false);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (previousBookIdRef.current === bookId) return; previousBook
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện previousBookIdRef.current === bookId đúng.
    if (previousBookIdRef.current === bookId) return;
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: previousBookIdRef.current = bookId
    previousBookIdRef.current = bookId;
    // Gọi/thực thi setBook với đối số để cập nhật logic/giao diện: setBook(null)
    setBook(null);
    // Gọi/thực thi setLoadingBook với đối số để cập nhật logic/giao diện: setLoadingBook(true)
    setLoadingBook(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments([])
    setComments([]);
    // Gọi/thực thi setCommentPage với đối số để cập nhật logic/giao diện: setCommentPage(1)
    setCommentPage(1);
    // Gọi/thực thi setCommentPagination với đối số để cập nhật logic/giao diện: setCommentPagination(null)
    setCommentPagination(null);
    // Gọi/thực thi setCommentsLoading với đối số để cập nhật logic/giao diện: setCommentsLoading(true)
    setCommentsLoading(true);
    // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError('')
    setCommentError('');
    // Gọi/thực thi setCommentNotice với đối số để cập nhật logic/giao diện: setCommentNotice('')
    setCommentNotice('');
    // Gọi/thực thi setCommentBody với đối số để cập nhật logic/giao diện: setCommentBody('')
    setCommentBody('');
    // Gọi/thực thi setEditingComment với đối số để cập nhật logic/giao diện: setEditingComment(null)
    setEditingComment(null);
    // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters([])
    setChapters([]);
    // Gọi/thực thi setChapterPagination với đối số để cập nhật logic/giao diện: setChapterPagination(null)
    setChapterPagination(null);
    // Gọi/thực thi setChapterPage với đối số để cập nhật logic/giao diện: setChapterPage(1)
    setChapterPage(1);
    // Gọi/thực thi setChapterLoading với đối số để cập nhật logic/giao diện: setChapterLoading(false)
    setChapterLoading(false);
    // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError('')
    setChapterError('');
    // Gọi/thực thi setActiveChapter với đối số để cập nhật logic/giao diện: setActiveChapter(null)
    setActiveChapter(null);
    // Gọi/thực thi setSavedBookmarks với đối số để cập nhật logic/giao diện: setSavedBookmarks([])
    setSavedBookmarks([]);
    // Gọi/thực thi setPdfUrl với đối số để cập nhật logic/giao diện: setPdfUrl('')
    setPdfUrl('');
  }, [bookId]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl])
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; setLoadingBook(true); setError(''); fetchPu
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setLoadingBook với đối số để cập nhật logic/giao diện: setLoadingBook(true)
    setLoadingBook(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi fetchPublicBook với đối số để cập nhật logic/giao diện: fetchPublicBook(bookId) .then((result) => { if (active) setBook(result); }) .cat
    fetchPublicBook(bookId)
      .then((result) => { if (active) setBook(result); })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoadingBook(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [bookId]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (loadingAuth) return; let active = true; setChapterLoading(
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện loadingAuth đúng.
    if (loadingAuth) return;
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setChapterLoading với đối số để cập nhật logic/giao diện: setChapterLoading(true)
    setChapterLoading(true);
    // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError('')
    setChapterError('');
    // Gọi/thực thi Promise.allSettled với đối số để cập nhật logic/giao diện: Promise.allSettled([fetchReadableChapters(bookId, chapterPage), user ? fetchRead
    Promise.allSettled([fetchReadableChapters(bookId, chapterPage), user ? fetchReaderBookmarks() : Promise.resolve(null)])
      .then(([catalogResult, bookmarkResult]) => {
        // if chỉ chạy nhánh này khi điều kiện !active || previousBookIdRef.current !== bookId đúng.
        if (!active || previousBookIdRef.current !== bookId) return;
        // Biến messages nhận giá trị từ []. const không gán lại; let có thể cập nhật.
        const messages: string[] = [];
        // if chỉ chạy nhánh này khi điều kiện catalogResult.status === 'fulfilled' đúng.
        if (catalogResult.status === 'fulfilled') {
          // Biến catalog nhận giá trị từ catalogResult.value. const không gán lại; let có thể cập nhật.
          const catalog = catalogResult.value;
          // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters((current) => chapterPage === 1 ? catalog.chapters : [...current, ...
          setChapters((current) => chapterPage === 1 ? catalog.chapters : [...current, ...catalog.chapters]);
          // Gọi/thực thi setChapterPagination với đối số để cập nhật logic/giao diện: setChapterPagination(catalog.pagination)
          setChapterPagination(catalog.pagination);
        } else {
          // Gọi/thực thi messages.push với đối số để cập nhật logic/giao diện: messages.push(`Không thể tải danh sách chương: ${errorMessage(catalogResult.reas
          messages.push(`Không thể tải danh sách chương: ${errorMessage(catalogResult.reason)}`);
        }
        // if chỉ chạy nhánh này khi điều kiện bookmarkResult.status === 'fulfilled' && bookmarkResult.value đúng.
        if (bookmarkResult.status === 'fulfilled' && bookmarkResult.value) {
          // Gọi/thực thi setSavedBookmarks với đối số để cập nhật logic/giao diện: setSavedBookmarks(bookmarkResult.value.bookmarks)
          setSavedBookmarks(bookmarkResult.value.bookmarks);
        } else if (bookmarkResult.status === 'rejected') {
          // Gọi/thực thi messages.push với đối số để cập nhật logic/giao diện: messages.push(`Không thể tải chương đã lưu: ${errorMessage(bookmarkResult.reason
          messages.push(`Không thể tải chương đã lưu: ${errorMessage(bookmarkResult.reason)}`);
        }
        // if chỉ chạy nhánh này khi điều kiện messages.length đúng.
        if (messages.length) setChapterError(messages.join(' '));
      })
      .finally(() => { if (active) setChapterLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [bookId, chapterPage, chapterRetryKey, loadingAuth, user]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; setCommentsLoading(true); setCommentError('
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi setCommentsLoading với đối số để cập nhật logic/giao diện: setCommentsLoading(true)
    setCommentsLoading(true);
    // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError('')
    setCommentError('');
    // Gọi/thực thi fetchBookComments với đối số để cập nhật logic/giao diện: fetchBookComments(bookId, commentPage) .then((result) => { if (!active || previo
    fetchBookComments(bookId, commentPage)
      .then((result) => {
        // if chỉ chạy nhánh này khi điều kiện !active || previousBookIdRef.current !== bookId đúng.
        if (!active || previousBookIdRef.current !== bookId) return;
        // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments((current) => commentPage === 1 ? result.comments : [...current, ...r
        setComments((current) => commentPage === 1 ? result.comments : [...current, ...result.comments]);
        // Gọi/thực thi setCommentPagination với đối số để cập nhật logic/giao diện: setCommentPagination(result.pagination)
        setCommentPagination(result.pagination);
      })
      .catch((loadError: unknown) => { if (active) setCommentError(errorMessage(loadError)); })
      .finally(() => { if (active) setCommentsLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [bookId, commentPage, commentRetryKey]);

  // Biến bookDescription nhận giá trị từ cleanBookDescription(book?.description). const không gán lại; let có thể cập nhật.
  const bookDescription = cleanBookDescription(book?.description);
  // Biến currentUserId nhận giá trị từ user?._id ?? user?.id. const không gán lại; let có thể cập nhật.
  const currentUserId = user?._id ?? user?.id;
  // Biến myComment nhận giá trị từ comments.find((comment) => referenceId(comment.user) ==. const không gán lại; let có thể cập nhật.
  const myComment = comments.find((comment) => referenceId(comment.user) === currentUserId);
  // Biến activeChapterId nhận giá trị từ activeChapter?.chapter.id. const không gán lại; let có thể cập nhật.
  const activeChapterId = activeChapter?.chapter.id;
  // Biến savedBookmark nhận giá trị từ savedBookmarks.find((bookmark) => { const bookRef = boo. const không gán lại; let có thể cập nhật.
  const savedBookmark = savedBookmarks.find((bookmark) => {
  // Biến bookRef nhận giá trị từ bookmark?.book. const không gán lại; let có thể cập nhật.
  const bookRef = bookmark?.book;
  // Biến bookIdStr nhận giá trị từ typeof bookRef === 'object' && bookRef !== null ? (book. const không gán lại; let có thể cập nhật.
  const bookIdStr = typeof bookRef === 'object' && bookRef !== null 
    ? (bookRef._id || bookRef.id || '') 
    : String(bookRef || '');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: referenceId(bookIdStr) === bookId.
  return referenceId(bookIdStr) === bookId;
});

/**
 * Hàm/thành phần referenceId: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: ref.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: String.
 * Được tham chiếu tại: admin-web/src/pages/ReaderAccountPage.tsx.
 */
function referenceId(ref: any): string {
  // if chỉ chạy nhánh này khi điều kiện !ref đúng.
  if (!ref) return '';
  // if chỉ chạy nhánh này khi điều kiện typeof ref === 'string' đúng.
  if (typeof ref === 'string') return ref;
  // if chỉ chạy nhánh này khi điều kiện typeof ref === 'object' đúng.
  if (typeof ref === 'object') {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ref._id || ref.id || ''.
    return ref._id || ref.id || '';
  }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: String(ref).
  return String(ref);
}

/**
 * Hàm/thành phần extractId: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: item.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function extractId(item: any): string {
  // if chỉ chạy nhánh này khi điều kiện !item đúng.
  if (!item) return '';
  // if chỉ chạy nhánh này khi điều kiện typeof item === 'string' đúng.
  if (typeof item === 'string') return item;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: item._id || item.id || ''.
  return item._id || item.id || '';
}

  // Hàm openChapter: Đọc chương qua endpoint được bảo vệ để backend kiểm tra quyền và ghi nhận lượt đọc.
  /**
   * Hàm/thành phần openChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: chapter.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: navigate, encodeURIComponent, setReadingChapter, setChapterError, readBookChapter, setActiveChapter, errorMessage.
   */
  async function openChapter(chapter: Chapter) {
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read`
      navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } });
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Gọi/thực thi setReadingChapter với đối số để cập nhật logic/giao diện: setReadingChapter(true)
    setReadingChapter(true);
    // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError('')
    setChapterError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await readBookChapter(bookId, chapter._id). const không gán lại; let có thể cập nhật.
      const result = await readBookChapter(bookId, chapter._id);
      // Gọi/thực thi setActiveChapter với đối số để cập nhật logic/giao diện: setActiveChapter(result)
      setActiveChapter(result);
    } catch (readError: unknown) {
      // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError(errorMessage(readError))
      setChapterError(errorMessage(readError));
    } finally {
      // Gọi/thực thi setReadingChapter với đối số để cập nhật logic/giao diện: setReadingChapter(false)
      setReadingChapter(false);
    }
  }

  // Hàm saveChapterBookmark: Tạo bookmark hoặc chuyển bookmark hiện tại sang chương đang chọn.
  /**
   * Hàm/thành phần saveChapterBookmark: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: chapterId.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSavingBookmark, setChapterError, saveReaderBookmark, setSavedBookmarks, map, errorMessage.
   */
  async function saveChapterBookmark(chapterId: string) {
    // Gọi/thực thi setSavingBookmark với đối số để cập nhật logic/giao diện: setSavingBookmark(true)
    setSavingBookmark(true);
    // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError('')
    setChapterError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến saved nhận giá trị từ await saveReaderBookmark(bookId, chapterId, savedBookma. const không gán lại; let có thể cập nhật.
      const saved = await saveReaderBookmark(bookId, chapterId, savedBookmark?._id);
      // Gọi/thực thi setSavedBookmarks với đối số để cập nhật logic/giao diện: setSavedBookmarks((current) => savedBookmark ? current.map((bookmark) => bookmar
      setSavedBookmarks((current) => savedBookmark
        ? current.map((bookmark) => bookmark._id === saved._id ? saved : bookmark)
        : [...current, saved]);
    } catch (saveError: unknown) {
      // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError(errorMessage(saveError))
      setChapterError(errorMessage(saveError));
    } finally {
      // Gọi/thực thi setSavingBookmark với đối số để cập nhật logic/giao diện: setSavingBookmark(false)
      setSavingBookmark(false);
    }
  }

  // Hàm saveComment: Tạo hoặc cập nhật đánh giá của người đọc theo quyền sở hữu do backend xác thực.
  /**
   * Hàm/thành phần saveComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, navigate, encodeURIComponent, trim, setCommentError, setSavingComment, setCommentNotice, updateBookComment.
   */
  async function saveComment(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}` } })
      navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}` } });
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Biến body nhận giá trị từ commentBody.trim(). const không gán lại; let có thể cập nhật.
    const body = commentBody.trim();
    // if chỉ chạy nhánh này khi điều kiện !body đúng.
    if (!body) {
      // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError('Vui lòng nhập nội dung đánh giá.')
      setCommentError('Vui lòng nhập nội dung đánh giá.');
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Gọi/thực thi setSavingComment với đối số để cập nhật logic/giao diện: setSavingComment(true)
    setSavingComment(true);
    // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError('')
    setCommentError('');
    // Gọi/thực thi setCommentNotice với đối số để cập nhật logic/giao diện: setCommentNotice('')
    setCommentNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến targetComment nhận giá trị từ editingComment ?? myComment. const không gán lại; let có thể cập nhật.
      const targetComment = editingComment ?? myComment;
      // Biến saved nhận giá trị từ targetComment ? await updateBookComment(targetComment._. const không gán lại; let có thể cập nhật.
      const saved = targetComment
        ? await updateBookComment(targetComment._id, { body, rating: commentRating })
        : await createBookComment(bookId, body, commentRating);
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments((current) => targetComment ? current.map((comment) => comment._id ==
      setComments((current) => targetComment
        ? current.map((comment) => comment._id === saved._id ? saved : comment)
        : [saved, ...current]);
      // Gọi/thực thi setEditingComment với đối số để cập nhật logic/giao diện: setEditingComment(null)
      setEditingComment(null);
      // Gọi/thực thi setCommentBody với đối số để cập nhật logic/giao diện: setCommentBody('')
      setCommentBody('');
      // Gọi/thực thi setCommentRating với đối số để cập nhật logic/giao diện: setCommentRating(5)
      setCommentRating(5);
      // Gọi/thực thi setCommentNotice với đối số để cập nhật logic/giao diện: setCommentNotice('Đã lưu đánh giá của bạn.')
      setCommentNotice('Đã lưu đánh giá của bạn.');
    } catch (saveError: unknown) {
      // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError(errorMessage(saveError))
      setCommentError(errorMessage(saveError));
    } finally {
      // Gọi/thực thi setSavingComment với đối số để cập nhật logic/giao diện: setSavingComment(false)
      setSavingComment(false);
    }
  }

  // Hàm removeComment: Xóa bình luận sau xác nhận và cập nhật danh sách đang hiển thị.
  /**
   * Hàm/thành phần removeComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: comment.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: confirm, setCommentError, deleteBookComment, setComments, filter, setCommentNotice, setEditingComment, setCommentBody.
   */
  async function removeComment(comment: Comment) {
    // if chỉ chạy nhánh này khi điều kiện !window.confirm('Bạn có chắc muốn xóa đánh giá này?') đúng.
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError('')
    setCommentError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await deleteBookComment(comment._id)
      await deleteBookComment(comment._id);
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments((current) => current.filter((item) => item._id !== comment._id))
      setComments((current) => current.filter((item) => item._id !== comment._id));
      // Gọi/thực thi setCommentNotice với đối số để cập nhật logic/giao diện: setCommentNotice('Đã xóa đánh giá.')
      setCommentNotice('Đã xóa đánh giá.');
      // if chỉ chạy nhánh này khi điều kiện editingComment?._id === comment._id đúng.
      if (editingComment?._id === comment._id) {
        // Gọi/thực thi setEditingComment với đối số để cập nhật logic/giao diện: setEditingComment(null)
        setEditingComment(null);
        // Gọi/thực thi setCommentBody với đối số để cập nhật logic/giao diện: setCommentBody('')
        setCommentBody('');
      }
    } catch (deleteError: unknown) {
      // Gọi/thực thi setCommentError với đối số để cập nhật logic/giao diện: setCommentError(errorMessage(deleteError))
      setCommentError(errorMessage(deleteError));
    }
  }

  // Hàm openReader: Mở trang đọc riêng cho tài khoản đã đăng nhập, kể cả ADMIN có quyền đọc nội dung.
  /**
   * Hàm/thành phần openReader: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setPdfLoading, setChapterError, streamPublicBook, setPdfUrl, createObjectURL, errorMessage, navigate, encodeURIComponent.
   */
  async function openReader() {
    // if chỉ chạy nhánh này khi điều kiện loadingAuth đúng.
    if (loadingAuth) return;
    // if chỉ chạy nhánh này khi điều kiện book?.reader_mode === 'pdf' đúng.
    if (book?.reader_mode === 'pdf') {
      // Gọi/thực thi setPdfLoading với đối số để cập nhật logic/giao diện: setPdfLoading(true)
      setPdfLoading(true);
      // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError('')
      setChapterError('');
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến blob nhận giá trị từ await streamPublicBook(book._id). const không gán lại; let có thể cập nhật.
        const blob = await streamPublicBook(book._id);
        // Gọi/thực thi setPdfUrl với đối số để cập nhật logic/giao diện: setPdfUrl(URL.createObjectURL(blob))
        setPdfUrl(URL.createObjectURL(blob));
      } catch (streamError: unknown) {
        // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError(errorMessage(streamError))
        setChapterError(errorMessage(streamError));
      } finally { setPdfLoading(false); }
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // if chỉ chạy nhánh này khi điều kiện book?.reader_mode === 'chapters' đúng.
    if (book?.reader_mode === 'chapters') {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(book._id)}/read`)
      navigate(`/books/${encodeURIComponent(book._id)}/read`);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Gọi/thực thi setChapterError với đối số để cập nhật logic/giao diện: setChapterError(book?.reader_mode === 'unsupported' ? `Định dạng ${book.file_for
    setChapterError(book?.reader_mode === 'unsupported'
      ? `Định dạng ${book.file_format || 'này'} chưa có trình đọc trong ứng dụng.`
      : 'Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <ReaderShell> <div className="harvey-detail"> <div className="harvey-detail-co.
  return (
    <ReaderShell>
      <div className="harvey-detail">
      <div className="harvey-detail-content">
        {loadingBook ? <p className="py-16 text-center text-sm text-slate-500">Đang tải sách…</p> : book ? (
          <>
            <section className="harvey-detail-hero">
              <img
                alt={`Bìa sách ${book.title}`}
                className="harvey-detail-cover"
                onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                src={book.cover_url || '/book-cover-placeholder.svg'}
              />
              <div className="harvey-detail-copy">
                <p className="harvey-eyebrow">{book.category === 'ebook' ? 'EBOOK' : book.category.toUpperCase()} · {book.access_level === 'free' ? 'FREE' : book.access_level.toUpperCase()}</p>
                <h1>{book.title}</h1>
                <p className="harvey-detail-author">Tác giả: {book.author_name}</p>
                <p className="harvey-detail-description">{bookDescription || 'Chưa có mô tả cho đầu sách này.'}</p>
                <div className="harvey-detail-tags"><span><BookOpen size={15} /> {genreLabel(book.genre)}</span><span>♙ {book.author_name}</span>{book.publication_year && <span>▦ {book.publication_year}</span>}</div>
                <div className="harvey-detail-actions"><button className="harvey-primary-button" disabled={loadingAuth || pdfLoading} onClick={() => void openReader()} type="button">
                  {loadingAuth ? 'Đang kiểm tra phiên…' : pdfLoading ? 'Đang tải PDF…' : 'Đọc sách'}
                </button><button className="harvey-round-button" disabled={!chapters[0]} onClick={() => user && chapters[0] ? void saveChapterBookmark(chapters[0]._id) : navigate('/login')} type="button" title="Lưu chương đầu"><Bookmark size={17} /></button><button className="harvey-round-button" onClick={() => navigator.clipboard?.writeText(window.location.href)} type="button" title="Chia sẻ"><span aria-hidden="true">↗</span></button></div>
              </div>
              <aside className="harvey-detail-quote"><BookOpen size={38} strokeWidth={1} /><span></span><blockquote>{bookDescription.split(/[.!?]/)[0] || `Khám phá ${book.title}, tác phẩm của ${book.author_name}.`}</blockquote><small>— {book.author_name}</small></aside>
            </section>
            <nav className="harvey-detail-tabs"><a href="#book-overview">Tổng quan</a><a href="#book-chapters">Mục lục</a><a href="#book-reviews">Đánh giá</a></nav>
            {error ? <p className="mt-4 border-l-2 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}
            <div className="harvey-detail-lower"><div className="harvey-detail-main-column">
            <section className="harvey-detail-overview" id="book-overview"><h2>Giới thiệu</h2><p>{bookDescription || 'Chưa có mô tả cho đầu sách này.'}</p></section>
            <section className="harvey-detail-section" aria-labelledby="book-chapters" id="book-chapters">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="eyebrow">Đọc theo chương</p><h2 className="mt-1 text-xl font-bold text-[#203a34]" id="book-chapters">Nội dung sách</h2></div>
                <span className="text-xs text-slate-500">{chapterPagination?.total ?? chapters.length} chương có thể đọc</span>
              </div>
              {chapterError && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-rose-700" role="alert"><span>{chapterError}</span><button className="button-secondary !min-h-8 !px-3 !py-1" onClick={() => setChapterRetryKey((key) => key + 1)} type="button">Thử lại</button></div>}
              {pdfUrl ? <iframe title={`Đọc ${book.title}`} src={pdfUrl} className="mt-4 h-[80vh] min-h-[640px] w-full border border-[#e5e4de] bg-white" />
                : chapterLoading && chapters.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Đang tải danh sách chương…</p>
                : chapters.length ? <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.3fr)]">
                  <ol className="max-h-[560px] divide-y divide-[#e9e8e2] overflow-y-auto border border-[#e5e4de] bg-white">
                    {chapters.map((chapter) => (
                      <li key={chapter._id}>
                        <button
                          aria-current={activeChapterId === chapter._id ? 'true' : undefined}
                          className={`w-full px-4 py-3 text-left transition-colors ${activeChapterId === chapter._id ? 'bg-[#edf2ed] text-[#203a34]' : 'hover:bg-slate-50'}`}
                          disabled={readingChapter}
                          onClick={() => void openChapter(chapter)}
                          type="button"
                        >
                          <span className="block text-xs font-bold">Chương {chapter.chapter_number}</span>
                          <span className="mt-1 block text-sm">{chapter.title}</span>
                          <span className="mt-1 block text-[10px] uppercase text-slate-400">{chapter.access_level}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                  <article className="min-h-64 border border-[#e5e4de] bg-white p-4 sm:p-6">
                    {readingChapter ? <p className="py-10 text-center text-sm text-slate-500">Đang mở chương…</p>
                      : activeChapter ? <>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                          <div><p className="eyebrow">Chương {activeChapter.chapter.order}</p><h3 className="mt-1 text-xl font-bold text-[#203a34]">{activeChapter.chapter.title}</h3></div>
                          <button 
                            className="button-secondary !min-h-9 !px-3 !py-2" 
                            disabled={savingBookmark || referenceId(extractId(savedBookmark?.chapter)) === extractId(activeChapter?.chapter)} 
                            onClick={() => void saveChapterBookmark(extractId(activeChapter?.chapter))} 
                            type="button">
                            <Bookmark size={14} /> {referenceId(extractId(savedBookmark?.chapter)) === extractId(activeChapter?.chapter) ? 'Đã lưu' : savingBookmark ? 'Đang lưu…' : 'Lưu chương'}
                          </button>
                        </div>
                        <div className="whitespace-pre-wrap py-5 text-[15px] leading-8 text-[#26332e]">{activeChapter.chapter.content}</div>
                      </> : <p className="grid min-h-56 place-items-center text-center text-sm text-slate-500">Chọn một chương để bắt đầu đọc.</p>}
                  </article>
                </div>
                : !chapterLoading ? <p className="py-8 text-center text-sm text-slate-500">Chưa có chương phù hợp với quyền đọc tài khoản này.</p> : null}
              {chapterPagination && chapterPage < chapterPagination.totalPages && <button className="button-secondary mt-4 w-full" disabled={chapterLoading} onClick={() => setChapterPage((page) => page + 1)} type="button">Tải thêm chương</button>}
            </section>
            <section className="harvey-detail-section" aria-labelledby="book-reviews" id="book-reviews">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="eyebrow">Cộng đồng độc giả</p>
                  <h2 className="mt-1 text-xl font-bold text-[#203a34]" id="book-reviews">Đánh giá & bình luận</h2>
                </div>
                <span className="text-xs text-slate-500">{commentPagination?.total ?? comments.length} đánh giá</span>
              </div>
              <form className="mt-5 border border-[#e5e4de] bg-white p-4" onSubmit={(event) => void saveComment(event)}>
                <label className="form-label" htmlFor="review-rating">Đánh giá sao</label>
                <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Điểm đánh giá">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      aria-label={`${rating} sao`}
                      aria-pressed={commentRating === rating}
                      className="p-1 text-amber-500"
                      key={rating}
                      onClick={() => setCommentRating(rating)}
                      type="button"
                    >
                      <Star fill={rating <= commentRating ? 'currentColor' : 'none'} size={19} />
                    </button>
                  ))}
                </div>
                <label className="form-label mt-4" htmlFor="review-body">Nội dung</label>
                <textarea
                  className="form-input mt-2 min-h-24"
                  id="review-body"
                  maxLength={3000}
                  onChange={(event) => setCommentBody(event.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
                  required
                  value={commentBody}
                />
                {commentError && <p className="mt-3 text-sm text-rose-700" role="alert">{commentError}</p>}
                {commentNotice && <p className="mt-3 text-sm text-emerald-700" role="status">{commentNotice}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="button-primary harvey-review-submit" disabled={savingComment} type="submit">
                    {savingComment ? 'Đang lưu…' : editingComment || myComment ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                  </button>
                  {editingComment && <button className="button-secondary" onClick={() => { setEditingComment(null); setCommentBody(''); }} type="button">Hủy sửa</button>}
                  {!user && <button className="button-secondary" onClick={() => navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}` } })} type="button">Đăng nhập để đánh giá</button>}
                </div>
              </form>
              {commentsLoading && comments.length === 0 ? (
             <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Đang tải đánh giá…</p>
              ) : comments.length ? (
                <ul className="mt-4 divide-y divide-[#e9e8e2]">
                  {comments.map((comment) => {
                    // Biến ownerId nhận giá trị từ referenceId(comment.user). const không gán lại; let có thể cập nhật.
                    const ownerId = referenceId(comment.user);
                    // Biến canManage nhận giá trị từ user?.role === 'ADMIN' || ownerId === currentUserId. const không gán lại; let có thể cập nhật.
                    const canManage = user?.role === 'ADMIN' || ownerId === currentUserId;
                    
                    // Xử lý an toàn trường hợp comment.user là chuỗi, object đầy đủ hoặc null
                    // Biến author nhận giá trị từ typeof comment.user === 'object' && comment.user !== nu. const không gán lại; let có thể cập nhật.
                    const author = typeof comment.user === 'object' && comment.user !== null
                      ? (comment.user.name || 'Thành viên')
                      : 'Độc giả';

                    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <li className="py-4" key={comment._id}> <div className="flex items-start justi.
                    return (
                      <li className="py-4" key={comment._id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-[#26332e]">{author}</p>
                            <div className="mt-1 flex items-center gap-1 text-amber-500" aria-label={comment.rating ? `${comment.rating} trên 5 sao` : 'Chưa chấm sao'}>
                              {comment.rating ? Array.from({ length: comment.rating }, (_, index) => <Star fill="currentColor" key={index} size={13} />) : <span className="text-xs text-slate-400">Chưa chấm sao</span>}
                            </div>
                          </div>
                          {canManage && <div className="flex shrink-0 gap-1">
                            <button aria-label="Sửa đánh giá" className="icon-button" onClick={() => { setEditingComment(comment); setCommentBody(comment.body); setCommentRating(comment.rating ?? 5); }} type="button">Sửa</button>
                            <button aria-label="Xóa đánh giá" className="icon-button icon-button-danger" onClick={() => void removeComment(comment)} type="button"><Trash2 size={14} /></button>
                          </div>}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.body}</p>
                        <time className="mt-2 block text-[11px] text-slate-400" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
                      </li>
                    );
                  })}
                </ul>
              ) : !commentsLoading && !commentError ? <p className="py-8 text-center text-sm text-slate-500">Chưa có đánh giá. Hãy chia sẻ cảm nhận đầu tiên.</p> : null}
              {commentPagination && commentPage < commentPagination.totalPages && (
                <button className="button-secondary mt-3 w-full" disabled={commentsLoading} onClick={() => setCommentPage((page) => page + 1)} type="button">
                  {commentsLoading ? 'Đang tải…' : 'Xem thêm đánh giá'}
                </button>
              )}
              {commentError && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-rose-700" role="alert"><span>{commentError}</span><button className="button-secondary !min-h-8 !px-3 !py-1" onClick={() => setCommentRetryKey((key) => key + 1)} type="button">Tải lại đánh giá</button></div>}
            </section></div><aside className="harvey-book-facts"><h2>Thông tin sách</h2><dl><div><dt>Tác giả</dt><dd>{book.author_name}</dd></div><div><dt>Thể loại</dt><dd>{genreLabel(book.genre)}</dd></div><div><dt>Nhà xuất bản</dt><dd>Tự do (bản điện tử)</dd></div><div><dt>Năm xuất bản</dt><dd>{book.publication_year || 'Chưa rõ'}</dd></div><div><dt>Số chương</dt><dd>{chapterPagination?.total ?? (chapters.length || '—')}</dd></div></dl><hr /><h3>Chia sẻ</h3><div className="harvey-share-buttons"><button onClick={() => navigator.clipboard?.writeText(window.location.href)} title="Sao chép liên kết" type="button">⛓</button><button onClick={() => navigator.clipboard?.writeText(window.location.href)} title="Chia sẻ" type="button">↗</button></div></aside></div>
          </>
        ) : <div className="py-16 text-center"><p className="text-sm text-slate-500">{error || 'Không tìm thấy sách.'}</p>{error && <button className="button-secondary mt-4" onClick={() => window.location.reload()} type="button">Thử tải lại</button>}</div>}
      </div>
      </div>
    </ReaderShell>
  );
}

/**
 * Hàm/thành phần genreLabel: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: genre optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
function genreLabel(genre?: Book['genre']) {
  // Biến labels nhận giá trị từ { van_hoc_viet_nam: 'Văn học Việt Nam', truyen_ngan_vie. const không gán lại; let có thể cập nhật.
  const labels: Record<NonNullable<Book['genre']>, string> = {
    van_hoc_viet_nam: 'Văn học Việt Nam',
    truyen_ngan_viet_nam: 'Truyện ngắn Việt Nam',
    tho_viet_nam: 'Thơ Việt Nam',
    van_hoc_dan_gian: 'Văn học dân gian',
    van_hoc_the_gioi: 'Văn học thế giới',
    kinh_doanh: 'Kinh doanh',
    phat_trien_ban_than: 'Phát triển bản thân',
    tam_ly_hoc: 'Tâm lý học',
    lich_su: 'Lịch sử',
    khoa_hoc: 'Khoa học',
  };
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: genre ? labels[genre] : labels.van_hoc_viet_nam.
  return genre ? labels[genre] : labels.van_hoc_viet_nam;
}

/* Hàm referenceId: Chuẩn hóa ID người dùng từ tham chiếu dạng chuỗi hoặc object populate.
function referenceId(reference: Comment['user']): string {
  return typeof reference === 'string' ? reference : reference._id ?? reference.id ?? '';
}*/

// Hàm formatDate: Hiển thị ngày bình luận theo múi giờ và định dạng tiếng Việt.
/**
 * Hàm/thành phần formatDate: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Date, isNaN, getTime, DateTimeFormat, format.
 * Được tham chiếu tại: admin-web/src/pages/UserManagement.tsx, admin-web/src/pages/SubscriptionManagement.tsx, admin-web/src/pages/ReportManagement.tsx, admin-web/src/pages/ReaderAccountPage.tsx.
 */
function formatDate(value: string): string {
  // Biến date nhận giá trị từ new Date(value). const không gán lại; let có thể cập nhật.
  const date = new Date(value);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyl.
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}
