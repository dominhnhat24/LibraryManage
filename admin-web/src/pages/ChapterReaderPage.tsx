// Import { useEffect, useState, useMemo } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ChapterReaderPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState, useMemo } from 'react';
// Import { ArrowLeft, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight, Sun, Moon, Typ từ lucide-react để dùng trong giao diện.
import {
  ArrowLeft, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight,
  Sun, Moon, Type, MessageSquare, Send
} from 'lucide-react';
// Import { Link, useNavigate, useParams } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate, useParams } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { fetchPublicBook, fetchReadableChapterMetadata, fetchReadableChapters, fetchRea từ ../api/client để dùng trong giao diện.
import {
  fetchPublicBook, fetchReadableChapterMetadata, fetchReadableChapters, fetchReadingProgress, readBookChapter,
  saveReaderBookmark, fetchReaderBookmarks, deleteReaderBookmark, fetchBookComments, createBookComment
} from '../api/client';
// Import type { Book, Chapter, Comment } từ ../types để dùng trong giao diện.
import type { Book, Chapter, Comment } from '../types';

/**
 * Hàm/thành phần ChapterReaderPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, getItem, useState, useEffect, setItem, fetchPublicBook, then.
 */
export function ChapterReaderPage() {
  // Biến { bookId = '', chapterId = '' } nhận giá trị từ useParams<{ bookId: string; chapterId: string }>(). const không gán lại; let có thể cập nhật.
  const { bookId = '', chapterId = '' } = useParams<{ bookId: string; chapterId: string }>();
  // Biến { user } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();

  // Biến [book, setBook] nhận giá trị từ useState<Book | null>(null). const không gán lại; let có thể cập nhật.
  const [book, setBook] = useState<Book | null>(null);
  // Biến [chapters, setChapters] nhận giá trị từ useState<Chapter[]>([]). const không gán lại; let có thể cập nhật.
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Biến [currentChapterId, setCurrentChapte nhận giá trị từ useState<string>(''). const không gán lại; let có thể cập nhật.
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  // Biến [chapterContent, setChapterContent] nhận giá trị từ useState<string>(''). const không gán lại; let có thể cập nhật.
  const [chapterContent, setChapterContent] = useState<string>('');
  // Biến [fontSize, setFontSize] nhận giá trị từ useState<'sm' | 'md' | 'lg'>(() => { const preference =. const không gán lại; let có thể cập nhật.
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    // Biến preference nhận giá trị từ localStorage.getItem('openbook.reading-size'). const không gán lại; let có thể cập nhật.
    const preference = localStorage.getItem('openbook.reading-size');
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: preference === 'small' ? 'sm' : preference === 'large' ? 'lg' : 'md'.
    return preference === 'small' ? 'sm' : preference === 'large' ? 'lg' : 'md';
  });
  // Biến [theme, setTheme] nhận giá trị từ useState<'light' | 'sepia' | 'dark'>('light'). const không gán lại; let có thể cập nhật.
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  // Biến [isBookmarked, setIsBookmarked] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [isBookmarked, setIsBookmarked] = useState(false);
  // Biến [bookmarkId, setBookmarkId] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [bookmarkId, setBookmarkId] = useState('');
  // Biến [showAd, setShowAd] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [showAd, setShowAd] = useState(false);
  // Biến [panelMode, setPanelMode] nhận giá trị từ useState<'toc' | 'comments'>('toc'). const không gán lại; let có thể cập nhật.
  const [panelMode, setPanelMode] = useState<'toc' | 'comments'>('toc');
  // Biến [comments, setComments] nhận giá trị từ useState<Comment[]>([]). const không gán lại; let có thể cập nhật.
  const [comments, setComments] = useState<Comment[]>([]);
  // Biến [commentsTotal, setCommentsTotal] nhận giá trị từ useState(0). const không gán lại; let có thể cập nhật.
  const [commentsTotal, setCommentsTotal] = useState(0);
  // Biến [commentDraft, setCommentDraft] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [commentDraft, setCommentDraft] = useState('');
  // Biến [commentError, setCommentError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [commentError, setCommentError] = useState('');
  // Biến [commentSaving, setCommentSaving] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [commentSaving, setCommentSaving] = useState(false);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { localStorage.setItem('openbook.reading-size', fontSize === 'sm
  useEffect(() => {
    // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('openbook.reading-size', fontSize === 'sm' ? 'small' : font
    localStorage.setItem('openbook.reading-size', fontSize === 'sm' ? 'small' : fontSize === 'lg' ? 'large' : 'medium');
  }, [fontSize]);

  // Tải dữ liệu sách và danh mục chương thật từ API
  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; if (bookId) { fetchPublicBook(bookId) .then
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;

    // if chỉ chạy nhánh này khi điều kiện bookId đúng.
    if (bookId) {
      // Gọi/thực thi fetchPublicBook với đối số để cập nhật logic/giao diện: fetchPublicBook(bookId) .then((b) => { if (!active) return; setBook(b); if (b._i
      fetchPublicBook(bookId)
        .then((b) => {
          // if chỉ chạy nhánh này khi điều kiện !active đúng.
          if (!active) return;
          // Gọi/thực thi setBook với đối số để cập nhật logic/giao diện: setBook(b)
          setBook(b);
          // if chỉ chạy nhánh này khi điều kiện b._id !== bookId đúng.
          if (b._id !== bookId) {
            // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(b._id)}/read${chapterId ? `/${encodeURICom
            navigate(`/books/${encodeURIComponent(b._id)}/read${chapterId ? `/${encodeURIComponent(chapterId)}` : ''}`, { replace: true });
          } else if (b.reader_mode === 'pdf') {
            // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(b._id)}/pdf`, { replace: true })
            navigate(`/books/${encodeURIComponent(b._id)}/pdf`, { replace: true });
          } else if (b.reader_mode === 'unsupported') {
            // Gọi/thực thi setChapterContent với đối số để cập nhật logic/giao diện: setChapterContent(`Định dạng ${b.file_format || 'này'} chưa có trình đọc trong ứ
            setChapterContent(`Định dạng ${b.file_format || 'này'} chưa có trình đọc trong ứng dụng.`);
          } else if (b.reader_mode === 'unavailable') {
            // Gọi/thực thi setChapterContent với đối số để cập nhật logic/giao diện: setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.')
            setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
          }
        })
        .catch(() => {});

      // Gọi/thực thi fetchReadableChapters với đối số để cập nhật logic/giao diện: fetchReadableChapters(bookId, 1, 50) .then(async (res) => { if (!active) return;
      fetchReadableChapters(bookId, 1, 50)
        .then(async (res) => {
          // if chỉ chạy nhánh này khi điều kiện !active đúng.
          if (!active) return;
          // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters(res.chapters)
          setChapters(res.chapters);
          // Biến firstChapterId nhận giá trị từ res.chapters[0]?._id. const không gán lại; let có thể cập nhật.
          const firstChapterId = res.chapters[0]?._id;
          /**
           * Hàm/thành phần selectChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
           * Tham số/props: targetId, updateRoute.
           * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
           * Gọi tiếp: find, fetchReadableChapterMetadata, setChapters, some, sort, setCurrentChapterId, navigate, encodeURIComponent.
           */
          const selectChapter = async (targetId: string, updateRoute: boolean) => {
            // Biến target nhận giá trị từ res.chapters.find((chapter) => chapter._id === targetId. const không gán lại; let có thể cập nhật.
            let target = res.chapters.find((chapter) => chapter._id === targetId);
            // if chỉ chạy nhánh này khi điều kiện !target đúng.
            if (!target) {
              // Direct metadata lookup avoids scanning all catalog pages for a saved chapter.
              // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: target = await fetchReadableChapterMetadata(bookId, targetId)
              target = await fetchReadableChapterMetadata(bookId, targetId);
              // if chỉ chạy nhánh này khi điều kiện !active đúng.
              if (!active) return;
              // Gọi/thực thi setChapters với đối số để cập nhật logic/giao diện: setChapters((current) => current.some((chapter) => chapter._id === targetId) ? c
              setChapters((current) => current.some((chapter) => chapter._id === targetId)
                ? current
                : [...current, target!].sort((a, b) => a.chapter_number - b.chapter_number));
            }
            // if chỉ chạy nhánh này khi điều kiện !active đúng.
            if (!active) return;
            // Gọi/thực thi setCurrentChapterId với đối số để cập nhật logic/giao diện: setCurrentChapterId(targetId)
            setCurrentChapterId(targetId);
            // if chỉ chạy nhánh này khi điều kiện updateRoute đúng.
            if (updateRoute) navigate(`/books/${encodeURIComponent(bookId)}/read/${encodeURIComponent(targetId)}`, { replace: true });
          };

          // if chỉ chạy nhánh này khi điều kiện chapterId đúng.
          if (chapterId) {
            // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
            try { await selectChapter(chapterId, false); }
            catch { if (active && firstChapterId) setCurrentChapterId(firstChapterId); }
          } else if (!user) {
            // if chỉ chạy nhánh này khi điều kiện firstChapterId đúng.
            if (firstChapterId) setCurrentChapterId(firstChapterId);
            else setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
          } else {
            // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
            try {
              // Biến progressResult nhận giá trị từ await fetchReadingProgress(1, 1, '', bookId). const không gán lại; let có thể cập nhật.
              const progressResult = await fetchReadingProgress(1, 1, '', bookId);
              // if chỉ chạy nhánh này khi điều kiện !active đúng.
              if (!active) return;
              // Biến lastRead nhận giá trị từ progressResult.progress[0]?.last_read_chapter. const không gán lại; let có thể cập nhật.
              const lastRead = progressResult.progress[0]?.last_read_chapter;
              // Biến lastReadId nhận giá trị từ typeof lastRead === 'string' ? lastRead : lastRead?._id. const không gán lại; let có thể cập nhật.
              const lastReadId = typeof lastRead === 'string' ? lastRead : lastRead?._id || lastRead?.id;
              // if chỉ chạy nhánh này khi điều kiện lastReadId đúng.
              if (lastReadId) {
                // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
                try { await selectChapter(lastReadId, true); }
                catch { if (active && firstChapterId) setCurrentChapterId(firstChapterId); }
              } else if (firstChapterId) setCurrentChapterId(firstChapterId);
              else setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
            } catch {
              // if chỉ chạy nhánh này khi điều kiện active && firstChapterId đúng.
              if (active && firstChapterId) setCurrentChapterId(firstChapterId);
              else if (active) setChapterContent('Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
            }
          }
        })
        .catch(() => { if (active) setChapterContent('Không thể tải danh sách chương hoặc sách không còn khả dụng.'); });
    }

    // if chỉ chạy nhánh này khi điều kiện user && bookId đúng.
    if (user && bookId) {
      // Gọi/thực thi fetchReaderBookmarks với đối số để cập nhật logic/giao diện: fetchReaderBookmarks().then((bm) => { if (active) { const found = bm.bookmarks.f
      fetchReaderBookmarks().then((bm) => {
        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) {
          // Biến found nhận giá trị từ bm.bookmarks.find((b) => { const bId = typeof b.book ==. const không gán lại; let có thể cập nhật.
          const found = bm.bookmarks.find((b) => {
            // Biến bId nhận giá trị từ typeof b.book === 'string' ? b.book : b.book?._id. const không gán lại; let có thể cập nhật.
            const bId = typeof b.book === 'string' ? b.book : b.book?._id;
            // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: bId === bookId.
            return bId === bookId;
          });
          // Gọi/thực thi setBookmarkId với đối số để cập nhật logic/giao diện: setBookmarkId(found?._id || '')
          setBookmarkId(found?._id || '');
          // Gọi/thực thi setIsBookmarked với đối số để cập nhật logic/giao diện: setIsBookmarked(Boolean(found))
          setIsBookmarked(Boolean(found));
        }
      }).catch(() => {});
    }

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [bookId, chapterId, user, navigate]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (user?.role === 'ADMIN' || user?.is_vip || user?.is_premium
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện user?.role === 'ADMIN' || user?.is_vip || user?.is_premium || showAd đúng.
    if (user?.role === 'ADMIN' || user?.is_vip || user?.is_premium || showAd) return;
    // Biến key nhận giá trị từ `harvey-free-ad-time:${bookId}`. const không gán lại; let có thể cập nhật.
    const key = `harvey-free-ad-time:${bookId}`;
    // Biến lastAdAt nhận giá trị từ Number(sessionStorage.getItem(key) || Date.now()). const không gán lại; let có thể cập nhật.
    const lastAdAt = Number(sessionStorage.getItem(key) || Date.now());
    // if chỉ chạy nhánh này khi điều kiện !sessionStorage.getItem(key) đúng.
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, String(lastAdAt));
    // Biến interval nhận giá trị từ window.setInterval(() => { if (Date.now() - Number(sess. const không gán lại; let có thể cập nhật.
    const interval = window.setInterval(() => {
      // if chỉ chạy nhánh này khi điều kiện Date.now() - Number(sessionStorage.getItem(key) || lastAdAt) >= 10 * 60 * 1000 đúng.
      if (Date.now() - Number(sessionStorage.getItem(key) || lastAdAt) >= 10 * 60 * 1000) setShowAd(true);
    }, 1000);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => window.clearInterval(interval).
    return () => window.clearInterval(interval);
  }, [bookId, user, showAd]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; fetchBookComments(bookId).then((result) =>
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi fetchBookComments với đối số để cập nhật logic/giao diện: fetchBookComments(bookId).then((result) => { if (!active) return; setComments(re
    fetchBookComments(bookId).then((result) => {
      // if chỉ chạy nhánh này khi điều kiện !active đúng.
      if (!active) return;
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments(result.comments)
      setComments(result.comments);
      // Gọi/thực thi setCommentsTotal với đối số để cập nhật logic/giao diện: setCommentsTotal(result.pagination.total)
      setCommentsTotal(result.pagination.total);
    }).catch(() => { if (active) setCommentError('Không thể tải bình luận.'); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [bookId]);

  /**
   * Hàm/thành phần sendReaderComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, navigate, encodeURIComponent, trim, setCommentSaving, setCommentError, createBookComment, setComments.
   */
  async function sendReaderComment(event: React.FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } }); return; }
    // Biến body nhận giá trị từ commentDraft.trim(). const không gán lại; let có thể cập nhật.
    const body = commentDraft.trim();
    // if chỉ chạy nhánh này khi điều kiện !body đúng.
    if (!body) return;
    // Gọi/thực thi setCommentSaving với đối số để cập nhật logic/giao diện: setCommentSaving(true)
    setCommentSaving(true); setCommentError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến created nhận giá trị từ await createBookComment(bookId, body, null). const không gán lại; let có thể cập nhật.
      const created = await createBookComment(bookId, body, null);
      // Gọi/thực thi setComments với đối số để cập nhật logic/giao diện: setComments((current) => [created, ...current])
      setComments((current) => [created, ...current]);
      // Gọi/thực thi setCommentsTotal với đối số để cập nhật logic/giao diện: setCommentsTotal((count) => count + 1)
      setCommentsTotal((count) => count + 1);
      // Gọi/thực thi setCommentDraft với đối số để cập nhật logic/giao diện: setCommentDraft('')
      setCommentDraft('');
    } catch { setCommentError('Chưa gửi được bình luận. Vui lòng thử lại.'); }
    finally { setCommentSaving(false); }
  }

  // Đọc nội dung chương thật từ endpoint API POST /books/:bookId/chapters/:chapterId/read
  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (!bookId || !currentChapterId) return; readBookChapter(book
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện !bookId || !currentChapterId đúng.
    if (!bookId || !currentChapterId) return;

    // Gọi/thực thi readBookChapter với đối số để cập nhật logic/giao diện: readBookChapter(bookId, currentChapterId) .then((res) => { if (res?.chapter?.con
    readBookChapter(bookId, currentChapterId)
      .then((res) => {
        // if chỉ chạy nhánh này khi điều kiện res?.chapter?.content đúng.
        if (res?.chapter?.content) {
          // Gọi/thực thi setChapterContent với đối số để cập nhật logic/giao diện: setChapterContent(res.chapter.content)
          setChapterContent(res.chapter.content);
        }
      })
      .catch(() => setChapterContent('Không thể tải nội dung chương. Vui lòng quay lại thử sau.'));
  }, [bookId, currentChapterId]);

  // Tìm chương hiện tại
  // Biến currentChapter nhận giá trị từ useMemo(() => { return chapters.find(c => c._id === cur. const không gán lại; let có thể cập nhật.
  const currentChapter = useMemo(() => {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: chapters.find(c => c._id === currentChapterId).
    return chapters.find(c => c._id === currentChapterId);
  }, [chapters, currentChapterId]);

  // Biến currentIndex nhận giá trị từ useMemo(() => { const idx = chapters.findIndex(c => c._. const không gán lại; let có thể cập nhật.
  const currentIndex = useMemo(() => {
    // Biến idx nhận giá trị từ chapters.findIndex(c => c._id === currentChapterId). const không gán lại; let có thể cập nhật.
    const idx = chapters.findIndex(c => c._id === currentChapterId);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: idx >= 0 ? idx : 0.
    return idx >= 0 ? idx : 0;
  }, [chapters, currentChapterId]);

  /**
   * Hàm/thành phần navigateToChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: targetChapterId.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setCurrentChapterId, navigate, encodeURIComponent, scrollTo.
   */
  function navigateToChapter(targetChapterId: string) {
    // Gọi/thực thi setCurrentChapterId với đối số để cập nhật logic/giao diện: setCurrentChapterId(targetChapterId)
    setCurrentChapterId(targetChapterId);
    // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(`/books/${encodeURIComponent(bookId)}/read/${encodeURIComponent(targetC
    navigate(`/books/${encodeURIComponent(bookId)}/read/${encodeURIComponent(targetChapterId)}`, { replace: true });
    // Gọi/thực thi window.scrollTo với đối số để cập nhật logic/giao diện: window.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Hàm/thành phần handlePrev: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: navigateToChapter.
   */
  const handlePrev = () => {
    // if chỉ chạy nhánh này khi điều kiện currentIndex > 0 đúng.
    if (currentIndex > 0) {
      // Gọi/thực thi navigateToChapter với đối số để cập nhật logic/giao diện: navigateToChapter(chapters[currentIndex - 1]._id)
      navigateToChapter(chapters[currentIndex - 1]._id);
    }
  };

  /**
   * Hàm/thành phần handleNext: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: navigateToChapter.
   */
  const handleNext = () => {
    // if chỉ chạy nhánh này khi điều kiện currentIndex < chapters.length - 1 đúng.
    if (currentIndex < chapters.length - 1) {
      // Gọi/thực thi navigateToChapter với đối số để cập nhật logic/giao diện: navigateToChapter(chapters[currentIndex + 1]._id)
      navigateToChapter(chapters[currentIndex + 1]._id);
    }
  };

  /**
   * Hàm/thành phần toggleBookmark: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: navigate, encodeURIComponent, deleteReaderBookmark, setBookmarkId, setIsBookmarked, saveReaderBookmark.
   */
  const toggleBookmark = async () => {
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) { navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } }); return; }
    // if chỉ chạy nhánh này khi điều kiện isBookmarked && bookmarkId đúng.
    if (isBookmarked && bookmarkId) {
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try { await deleteReaderBookmark(bookmarkId); setBookmarkId(''); setIsBookmarked(false); } catch { /* keep current state */ }
    } else if (bookId && currentChapterId) {
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try { const saved = await saveReaderBookmark(bookId, currentChapterId); setBookmarkId(saved._id); setIsBookmarked(true); } catch { /* keep current state */ }
    }
  };

  /**
   * Hàm/thành phần getFontSize: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   */
  const getFontSize = () => {
    // if chỉ chạy nhánh này khi điều kiện fontSize === 'sm' đúng.
    if (fontSize === 'sm') return '15px';
    // if chỉ chạy nhánh này khi điều kiện fontSize === 'lg' đúng.
    if (fontSize === 'lg') return '18px';
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: '16.5px'.
    return '16.5px';
  };

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className={`bn-reader-page-root harvey-reader-page ${theme === 'dark' ? '.
  return (
    <div
      className={`bn-reader-page-root harvey-reader-page ${theme === 'dark' ? 'is-dark' : ''} ${theme === 'sepia' ? 'is-sepia' : ''}`}
      style={{
        backgroundColor: theme === 'sepia' ? '#FBF0D9' : theme === 'dark' ? '#1E293B' : '#F8FAFB',
        color: theme === 'dark' ? '#F1F5F9' : '#1E293B'
      }}
    >
      {/* 1. Header trên cùng */}
      <header
        className="bn-reader-navbar"
        style={{
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#334155' : 'var(--bn-border)'
        }}
      >
        <Link
          to={`/books/${encodeURIComponent(bookId)}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--bn-text-muted)' }}
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="bn-reader-nav-title">
          <div className="bn-reader-nav-book-name" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}>
            {book?.title || 'Đang tải sách…'}
          </div>
          <div className="bn-reader-nav-author-name">
            {book?.author_name || ''}
          </div>
        </div>

        <div className="harvey-reader-tools" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--bn-text-muted)' }}>
          <button aria-label={panelMode === 'comments' ? 'Mở mục lục' : 'Mở bình luận'} aria-pressed={panelMode === 'comments'} onClick={() => setPanelMode((mode) => mode === 'toc' ? 'comments' : 'toc')} title="Bình luận"><MessageSquare size={19} /></button>
          <button
            onClick={toggleBookmark}
            title={isBookmarked ? 'Bỏ lưu sách' : 'Lưu sách'}
            aria-label={isBookmarked ? 'Bỏ lưu sách' : 'Lưu sách'}
            aria-pressed={isBookmarked}
            style={{ color: isBookmarked ? '#D0A82F' : 'inherit' }}
          >
            <BookmarkIcon size={19} fill={isBookmarked ? '#D0A82F' : 'none'} />
          </button>
          <button
            onClick={() => setFontSize(f => f === 'sm' ? 'md' : f === 'md' ? 'lg' : 'sm')}
            title="Đổi cỡ chữ"
          >
            <Type size={19} />
          </button>
          <button
            onClick={() => setTheme(t => t === 'light' ? 'sepia' : t === 'sepia' ? 'dark' : 'light')}
            title="Đổi giao diện đọc"
          >
            {theme === 'dark' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>

      {/* 2. Container đọc sách 2 cột */}
      <div className="bn-reader-container">
        {/* Cột trái: Mục lục */}
        <aside
          className="bn-reader-toc-panel"
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            boxShadow: theme === 'dark' ? 'none' : undefined
          }}
        >
          {panelMode === 'toc' ? <>
            <div className="bn-reader-toc-heading" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}><span>Mục lục</span><small>{chapters.length} chương</small></div>
            {chapters.map((chapter) => <button aria-current={chapter._id === currentChapterId ? 'page' : undefined} className={`bn-reader-toc-item-link ${chapter._id === currentChapterId ? 'active' : ''}`} key={chapter._id} onClick={() => navigateToChapter(chapter._id)} type="button"><span><small>Chương {chapter.chapter_number}</small>{chapter.title}</span><ChevronRight size={15} /></button>)}
          </> : <div className="harvey-reader-comments">
            <div className="bn-reader-toc-heading"><span>Bình luận</span><small>{commentsTotal} bình luận</small></div>
            <form onSubmit={(event) => void sendReaderComment(event)}>{user?.name && <span className="harvey-comment-avatar">{user.name.trim().slice(0, 1).toUpperCase()}</span>}<input aria-label="Viết bình luận" maxLength={3000} onChange={(event) => setCommentDraft(event.target.value)} placeholder={user ? 'Viết bình luận...' : 'Đăng nhập để bình luận'} value={commentDraft} /><button aria-label="Gửi bình luận" disabled={commentSaving} type="submit"><Send size={15} /></button></form>
            {commentError && <p className="harvey-comment-error">{commentError}</p>}
            <div className="harvey-comment-list">{comments.length ? comments.map((comment) => {
              // Biến author nhận giá trị từ typeof comment.user === 'object' ? comment.user.name : . const không gán lại; let có thể cập nhật.
              const author = typeof comment.user === 'object' ? comment.user.name : 'Độc giả';
              // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <article key={comment._id}><span className="harvey-comment-avatar">{author.slice.
              return <article key={comment._id}><span className="harvey-comment-avatar">{author.slice(0, 1).toUpperCase()}</span><div><header><strong>{author}</strong><time>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</time></header><p>{comment.body}</p><small>{comment.rating ? `${comment.rating} ★` : 'Bình luận'}</small></div></article>;
            }) : <p className="harvey-comments-empty">Chưa có bình luận. Hãy chia sẻ cảm nhận đầu tiên.</p>}</div>
          </div>}
        </aside>

        {/* Cột phải: Vùng đọc sách */}
        <main
          className="bn-reader-main-book-panel"
          style={{
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
            boxShadow: theme === 'dark' ? 'none' : undefined
          }}
        >
          <div className="bn-reader-chapter-number-tag">
            Chương {currentChapter?.chapter_number || 1}
          </div>
          <h1 className="bn-reader-chapter-big-title" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}>
            {currentChapter?.title || 'Đang tải chương…'}
          </h1>

          <div
            className="bn-reader-prose"
            style={{
              fontSize: getFontSize(),
              color: theme === 'dark' ? '#CBD5E1' : '#2D3748'
            }}
          >
            {chapterContent.split('\n\n').map((para, pIdx) => (
              <p key={pIdx}>{para}</p>
            ))}
          </div>

          {/* Footer Điều hướng Đọc sách */}
          <div className="bn-reader-footer-nav" style={{ borderColor: theme === 'dark' ? '#334155' : undefined }}>
            <button
              className="bn-hero-arrow-btn"
              style={{ position: 'static', transform: 'none' }}
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              aria-label="Previous chapter"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="bn-reader-footer-center">
              <span className="bn-reader-footer-pos">
                Chương {currentChapter?.chapter_number || 1} / {chapters.length}
              </span>
              <div className="bn-reader-footer-bar">
                <div
                  className="bn-reader-footer-fill"
                  style={{
                    width: `${Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 1)) * 100)}%`
                  }}
                />
              </div>
              <span className="bn-reader-footer-pct">
                {Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 1)) * 100)}%
              </span>
            </div>

            <button
              className="bn-hero-arrow-btn"
              style={{ position: 'static', transform: 'none' }}
              onClick={handleNext}
              disabled={currentIndex >= chapters.length - 1}
              aria-label="Next chapter"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </main>
      </div>
      {showAd && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation"><section aria-labelledby="free-ad-title" aria-modal="true" className="w-full max-w-md rounded-xl border border-[#e5ddc8] bg-[#f8f6ec] p-7 text-center shadow-xl" role="dialog"><p className="harvey-eyebrow">HARVEYBOOK · QUẢNG CÁO</p><h2 className="mt-2 text-xl font-semibold text-[#302d20]" id="free-ad-title">Cảm ơn bạn đã đọc cùng HarveyBook</h2><div className="my-5 grid min-h-32 place-items-center border border-dashed border-[#cfc5a7] bg-[#f2eddd] text-sm text-[#8a826d]">Vị trí hiển thị quảng cáo</div><button className="rounded-md bg-[#948342] px-5 py-2.5 text-sm font-semibold text-white" onClick={() => { setShowAd(false); sessionStorage.setItem(`harvey-free-ad-time:${bookId}`, String(Date.now())); }} type="button">Tiếp tục đọc</button></section></div>}
    </div>
  );
}
