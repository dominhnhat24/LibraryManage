import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Bookmark, BookOpen, LoaderCircle, Star, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createBookComment, deleteBookComment, errorMessage, fetchBookComments, fetchPublicBook,
  fetchReadableChapters, fetchReaderBookmarks, readBookChapter, saveReaderBookmark, updateBookComment,
} from '../api/client';
import type { Bookmark as BookmarkType, Book, Chapter, Comment, PaginationData, ReadChapterResult } from '../types';

// Hàm ReaderBookPage: Hiển thị thông tin sách và đọc PDF qua endpoint riêng tư có kiểm tra entitlement.
export function ReaderBookPage() {
  const { bookId = '' } = useParams();
  const { user, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPagination, setCommentPagination] = useState<PaginationData | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState('');
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
  const [activeChapter, setActiveChapter] = useState<ReadChapterResult | null>(null);
  const [readingChapter, setReadingChapter] = useState(false);
  const [savedBookmarks, setSavedBookmarks] = useState<BookmarkType[]>([]);
  const [savingBookmark, setSavingBookmark] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublicBook(bookId)
      .then((result) => { if (active) setBook(result); })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoadingBook(false); });
    return () => { active = false; };
  }, [bookId]);

  useEffect(() => {
    if (loadingAuth || !user) return;
    let active = true;
    setChapterLoading(true);
    setChapterError('');
    Promise.all([fetchReadableChapters(bookId, chapterPage), fetchReaderBookmarks()])
      .then(([catalog, saved]) => {
        if (!active) return;
        setChapters((current) => chapterPage === 1 ? catalog.chapters : [...current, ...catalog.chapters]);
        setChapterPagination(catalog.pagination);
        setSavedBookmarks(saved.bookmarks);
      })
      .catch((loadError: unknown) => { if (active) setChapterError(errorMessage(loadError)); })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, [bookId, chapterPage, loadingAuth, user]);

  useEffect(() => {
    let active = true;
    setCommentsLoading(true);
    setCommentError('');
    fetchBookComments(bookId, commentPage)
      .then((result) => {
        if (!active) return;
        setComments((current) => commentPage === 1 ? result.comments : [...current, ...result.comments]);
        setCommentPagination(result.pagination);
      })
      .catch((loadError: unknown) => { if (active) setCommentError(errorMessage(loadError)); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [bookId, commentPage]);

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
  function openReader() {
    if (loadingAuth) return;
    if (!user || !['USER', 'ADMIN'].includes(user.role)) {
      navigate('/login', { state: { from: `/books/${encodeURIComponent(bookId)}/read` } });
      return;
    }
    navigate(`/books/${encodeURIComponent(bookId)}/read`);
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef] text-[#202b28]">
      <header className="border-b border-[#deddd6] bg-[#fbfaf7]">
        <div className="mx-auto flex min-h-[68px] max-w-[1100px] items-center justify-between px-4 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#31564a]" to="/"><ArrowLeft size={16} /> Về thư viện</Link>
          <Link className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-[#203a34]" to="/"><BookOpen size={17} /> OPENBOOK</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-7 sm:px-8">
        {loadingBook ? <p className="py-16 text-center text-sm text-slate-500">Đang tải sách…</p> : book ? (
          <>
            <section className="flex flex-col gap-5 border border-[#dfded7] bg-[#fbfaf7] p-5 sm:flex-row sm:p-7">
              <img
                alt={`Bìa sách ${book.title}`}
                className="h-48 w-36 self-center border border-[#e4e1d8] bg-[#f1eee6] object-cover sm:self-start"
                onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                src={book.cover_url || '/book-cover-placeholder.svg'}
              />
              <div className="flex min-w-0 flex-col">
                <p className="eyebrow">{book.category} · {book.access_level}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">{book.title}</h1>
                <p className="mt-2 text-sm text-slate-500">Tác giả: {book.author_name}</p>
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{book.description || 'Chưa có mô tả cho đầu sách này.'}</p>
                <button className="button-primary mt-6 self-start" disabled={loadingAuth} onClick={openReader} type="button">
                  {loadingAuth ? 'Đang kiểm tra phiên…' : 'Đọc sách'}
                </button>
              </div>
            </section>
            {error ? <p className="mt-4 border-l-2 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p> : null}
            {user && <section className="mt-7 border border-[#dfded7] bg-[#fbfaf7] p-5 sm:p-7" aria-labelledby="book-chapters">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="eyebrow">Đọc theo chương</p><h2 className="mt-1 text-xl font-bold text-[#203a34]" id="book-chapters">Nội dung sách</h2></div>
                <span className="text-xs text-slate-500">{chapterPagination?.total ?? chapters.length} chương có thể đọc</span>
              </div>
              {chapterError && <p className="mt-4 text-sm text-rose-700" role="alert">{chapterError}</p>}
              {chapterLoading && chapters.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Đang tải danh sách chương…</p>
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
                        {activeChapter.ad?.showAd && <div className="my-4 border border-[#e7ddc5] bg-[#fff8e8] px-4 py-3 text-xs text-[#805e1e]" role="status">Nội dung có vị trí quảng cáo theo lượt đọc miễn phí.</div>}
                        <div className="whitespace-pre-wrap py-5 text-[15px] leading-8 text-[#26332e]">{activeChapter.chapter.content}</div>
                      </> : <p className="grid min-h-56 place-items-center text-center text-sm text-slate-500">Chọn một chương để bắt đầu đọc.</p>}
                  </article>
                </div>
                : !chapterLoading ? <p className="py-8 text-center text-sm text-slate-500">Chưa có chương phù hợp với quyền đọc tài khoản này.</p> : null}
              {chapterPagination && chapterPage < chapterPagination.totalPages && <button className="button-secondary mt-4 w-full" disabled={chapterLoading} onClick={() => setChapterPage((page) => page + 1)} type="button">Tải thêm chương</button>}
            </section>}
            <section className="mt-7 border border-[#dfded7] bg-[#fbfaf7] p-5 sm:p-7" aria-labelledby="book-reviews">
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
                  <button className="button-primary" disabled={savingComment} type="submit">
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
              ) : !commentsLoading ? <p className="py-8 text-center text-sm text-slate-500">Chưa có đánh giá. Hãy chia sẻ cảm nhận đầu tiên.</p> : null}
              {commentPagination && commentPage < commentPagination.totalPages && (
                <button className="button-secondary mt-3 w-full" disabled={commentsLoading} onClick={() => setCommentPage((page) => page + 1)} type="button">
                  {commentsLoading ? 'Đang tải…' : 'Xem thêm đánh giá'}
                </button>
              )}
              {commentError && comments.length > 0 ? <p className="mt-3 text-sm text-rose-700" role="alert">{commentError}</p> : null}
            </section>
          </>
        ) : <p className="py-16 text-center text-sm text-slate-500">Không tìm thấy sách.</p>}
      </main>
    </div>
  );
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
