import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bookmark, BookOpen, LoaderCircle, Star, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReaderShell } from '../components/ReaderShell';
import {
  createBookComment, deleteBookComment, errorMessage, fetchBookComments, fetchPublicBook, streamPublicBook,
  fetchReadableChapters, fetchReaderBookmarks, readBookChapter, saveReaderBookmark, updateBookComment,
} from '../api/client';
import type { Bookmark as BookmarkType, Book, Chapter, Comment, PaginationData, ReadChapterResult } from '../types';
import { cleanBookDescription } from '../utils/book-description';

// Hàm ReaderBookPage: Hiển thị thông tin sách và đọc PDF qua endpoint riêng tư có kiểm tra entitlement.
export function ReaderBookPage() {
  const { bookId = '' } = useParams();
  const { user, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const previousBookIdRef = useRef(bookId);
  const [book, setBook] = useState<Book | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPagination, setCommentPagination] = useState<PaginationData | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState('');
  const [commentRetryKey, setCommentRetryKey] = useState(0);
  const [commentNotice, setCommentNotice] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterPagination, setChapterPagination] = useState<PaginationData | null>(null);
  const [chapterPage, setChapterPage] = useState(1);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState('');
  const [chapterRetryKey, setChapterRetryKey] = useState(0);
  const [activeChapter, setActiveChapter] = useState<ReadChapterResult | null>(null);
  const [readingChapter, setReadingChapter] = useState(false);
  const [savedBookmarks, setSavedBookmarks] = useState<BookmarkType[]>([]);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (previousBookIdRef.current === bookId) return;
    previousBookIdRef.current = bookId;
    setBook(null);
    setLoadingBook(true);
    setError('');
    setComments([]);
    setCommentPage(1);
    setCommentPagination(null);
    setCommentsLoading(true);
    setCommentError('');
    setCommentNotice('');
    setCommentBody('');
    setEditingComment(null);
    setChapters([]);
    setChapterPagination(null);
    setChapterPage(1);
    setChapterLoading(false);
    setChapterError('');
    setActiveChapter(null);
    setSavedBookmarks([]);
    setPdfUrl('');
  }, [bookId]);

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  useEffect(() => {
    let active = true;
    setLoadingBook(true);
    setError('');
    fetchPublicBook(bookId)
      .then((result) => { if (active) setBook(result); })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoadingBook(false); });
    return () => { active = false; };
  }, [bookId]);

  useEffect(() => {
    if (loadingAuth) return;
    let active = true;
    setChapterLoading(true);
    setChapterError('');
    Promise.allSettled([fetchReadableChapters(bookId, chapterPage), user ? fetchReaderBookmarks() : Promise.resolve(null)])
      .then(([catalogResult, bookmarkResult]) => {
        if (!active || previousBookIdRef.current !== bookId) return;
        const messages: string[] = [];
        if (catalogResult.status === 'fulfilled') {
          const catalog = catalogResult.value;
          setChapters((current) => chapterPage === 1 ? catalog.chapters : [...current, ...catalog.chapters]);
          setChapterPagination(catalog.pagination);
        } else {
          messages.push(`Không thể tải danh sách chương: ${errorMessage(catalogResult.reason)}`);
        }
        if (bookmarkResult.status === 'fulfilled' && bookmarkResult.value) {
          setSavedBookmarks(bookmarkResult.value.bookmarks);
        } else if (bookmarkResult.status === 'rejected') {
          messages.push(`Không thể tải chương đã lưu: ${errorMessage(bookmarkResult.reason)}`);
        }
        if (messages.length) setChapterError(messages.join(' '));
      })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, [bookId, chapterPage, chapterRetryKey, loadingAuth, user]);

  useEffect(() => {
    let active = true;
    setCommentsLoading(true);
    setCommentError('');
    fetchBookComments(bookId, commentPage)
      .then((result) => {
        if (!active || previousBookIdRef.current !== bookId) return;
        setComments((current) => commentPage === 1 ? result.comments : [...current, ...result.comments]);
        setCommentPagination(result.pagination);
      })
      .catch((loadError: unknown) => { if (active) setCommentError(errorMessage(loadError)); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [bookId, commentPage, commentRetryKey]);

  const bookDescription = cleanBookDescription(book?.description);
  const currentUserId = user?._id ?? user?.id;
  const myComment = comments.find((comment) => referenceId(comment.user) === currentUserId);
  const activeChapterId = activeChapter?.chapter.id;
  const savedBookmark = savedBookmarks.find((bookmark) => {
  const bookRef = bookmark?.book;
  const bookIdStr = typeof bookRef === 'object' && bookRef !== null 
    ? (bookRef._id || bookRef.id || '') 
    : String(bookRef || '');
  return referenceId(bookIdStr) === bookId;
});

function referenceId(ref: any): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object') {
    return ref._id || ref.id || '';
  }
  return String(ref);
}

function extractId(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item._id || item.id || '';
}

  // Hàm openChapter: Đọc chương qua endpoint được bảo vệ để backend kiểm tra quyền và ghi nhận lượt đọc.
  async function openChapter(chapter: Chapter) {
    if (!user) {
      navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } });
      return;
    }
    setReadingChapter(true);
    setChapterError('');
    try {
      const result = await readBookChapter(bookId, chapter._id);
      setActiveChapter(result);
    } catch (readError: unknown) {
      setChapterError(errorMessage(readError));
    } finally {
      setReadingChapter(false);
    }
  }

  // Hàm saveChapterBookmark: Tạo bookmark hoặc chuyển bookmark hiện tại sang chương đang chọn.
  async function saveChapterBookmark(chapterId: string) {
    setSavingBookmark(true);
    setChapterError('');
    try {
      const saved = await saveReaderBookmark(bookId, chapterId, savedBookmark?._id);
      setSavedBookmarks((current) => savedBookmark
        ? current.map((bookmark) => bookmark._id === saved._id ? saved : bookmark)
        : [...current, saved]);
    } catch (saveError: unknown) {
      setChapterError(errorMessage(saveError));
    } finally {
      setSavingBookmark(false);
    }
  }

  // Hàm saveComment: Tạo hoặc cập nhật đánh giá của người đọc theo quyền sở hữu do backend xác thực.
  async function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}` } });
      return;
    }
    const body = commentBody.trim();
    if (!body) {
      setCommentError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    setSavingComment(true);
    setCommentError('');
    setCommentNotice('');
    try {
      const targetComment = editingComment ?? myComment;
      const saved = targetComment
        ? await updateBookComment(targetComment._id, { body, rating: commentRating })
        : await createBookComment(bookId, body, commentRating);
      setComments((current) => targetComment
        ? current.map((comment) => comment._id === saved._id ? saved : comment)
        : [saved, ...current]);
      setEditingComment(null);
      setCommentBody('');
      setCommentRating(5);
      setCommentNotice('Đã lưu đánh giá của bạn.');
    } catch (saveError: unknown) {
      setCommentError(errorMessage(saveError));
    } finally {
      setSavingComment(false);
    }
  }

  // Hàm removeComment: Xóa bình luận sau xác nhận và cập nhật danh sách đang hiển thị.
  async function removeComment(comment: Comment) {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    setCommentError('');
    try {
      await deleteBookComment(comment._id);
      setComments((current) => current.filter((item) => item._id !== comment._id));
      setCommentNotice('Đã xóa đánh giá.');
      if (editingComment?._id === comment._id) {
        setEditingComment(null);
        setCommentBody('');
      }
    } catch (deleteError: unknown) {
      setCommentError(errorMessage(deleteError));
    }
  }

  // Hàm openReader: Mở trang đọc riêng cho tài khoản đã đăng nhập, kể cả ADMIN có quyền đọc nội dung.
  async function openReader() {
    if (loadingAuth) return;
    if (book?.reader_mode === 'pdf') {
      setPdfLoading(true);
      setChapterError('');
      try {
        const blob = await streamPublicBook(book._id);
        setPdfUrl(URL.createObjectURL(blob));
      } catch (streamError: unknown) {
        setChapterError(errorMessage(streamError));
      } finally { setPdfLoading(false); }
      return;
    }
    if (book?.reader_mode === 'chapters') {
      navigate(`/books/${encodeURIComponent(book._id)}/read`);
      return;
    }
    setChapterError(book?.reader_mode === 'unsupported'
      ? `Định dạng ${book.file_format || 'này'} chưa có trình đọc trong ứng dụng.`
      : 'Sách chưa có chương đọc được hoặc tệp gốc hợp lệ.');
  }

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
                    const ownerId = referenceId(comment.user);
                    const canManage = user?.role === 'ADMIN' || ownerId === currentUserId;
                    
                    // Xử lý an toàn trường hợp comment.user là chuỗi, object đầy đủ hoặc null
                    const author = typeof comment.user === 'object' && comment.user !== null
                      ? (comment.user.name || 'Thành viên')
                      : 'Độc giả';

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

function genreLabel(genre?: Book['genre']) {
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
  return genre ? labels[genre] : labels.van_hoc_viet_nam;
}

/* Hàm referenceId: Chuẩn hóa ID người dùng từ tham chiếu dạng chuỗi hoặc object populate.
function referenceId(reference: Comment['user']): string {
  return typeof reference === 'string' ? reference : reference._id ?? reference.id ?? '';
}*/

// Hàm formatDate: Hiển thị ngày bình luận theo múi giờ và định dạng tiếng Việt.
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}
