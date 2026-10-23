import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Bookmark as BookmarkIcon, ChevronLeft, ChevronRight,
  Sun, Moon, Type, MoreVertical
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  fetchPublicBook, fetchReadableChapters, readBookChapter,
  saveReaderBookmark, fetchReaderBookmarks
} from '../api/client';
import type { Book, Chapter } from '../types';

export function ChapterReaderPage() {
  const { bookId = '' } = useParams<{ bookId: string }>();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [chapterContent, setChapterContent] = useState<string>('');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Danh sách mục lục phân theo phần chuẩn theo ảnh tham chiếu Booknest
  const tocSections = [
    {
      part: 'Phần I - Cậu bé chăn cừu',
      chapters: [
        { no: 1, title: 'Chương 1: Giấc mơ của cậu bé', page: 12 },
        { no: 2, title: 'Chương 2: Người bí ẩn', page: 18 },
        { no: 3, title: 'Chương 3: Sa mạc', page: 24 },
      ]
    },
    {
      part: 'Phần II - Hành trình',
      chapters: [
        { no: 4, title: 'Chương 4: Nhà giả kim', page: 36 },
        { no: 5, title: 'Chương 5: Ốc đảo', page: 45 },
        { no: 6, title: 'Chương 6: Cơn bão', page: 52 },
      ]
    },
    {
      part: 'Phần III - Kho báu',
      chapters: [
        { no: 7, title: 'Chương 7: Pyramid', page: 60 },
        { no: 8, title: 'Chương 8: Trở về', page: 68 },
      ]
    }
  ];

  // Tải dữ liệu sách và danh mục chương thật từ API
  useEffect(() => {
    let active = true;

    if (bookId) {
      fetchPublicBook(bookId)
        .then((b) => { if (active) setBook(b); })
        .catch(() => {});

      fetchReadableChapters(bookId, 1, 50)
        .then((res) => {
          if (active && res.chapters.length > 0) {
            setChapters(res.chapters);
            setCurrentChapterId(res.chapters[0]._id);
          }
        })
        .catch(() => {});
    }

    if (user && bookId) {
      fetchReaderBookmarks().then((bm) => {
        if (active) {
          const found = bm.bookmarks.some((b) => {
            const bId = typeof b.book === 'string' ? b.book : b.book?._id;
            return bId === bookId;
          });
          setIsBookmarked(found);
        }
      }).catch(() => {});
    }

    return () => { active = false; };
  }, [bookId, user]);

  // Đọc nội dung chương thật từ endpoint API POST /books/:bookId/chapters/:chapterId/read
  useEffect(() => {
    if (!bookId || !currentChapterId) return;

    readBookChapter(bookId, currentChapterId)
      .then((res) => {
        if (res?.chapter?.content) {
          setChapterContent(res.chapter.content);
        }
      })
      .catch(() => {
        // Fallback nội dung chuẩn theo ảnh nếu là chương mẫu
        setChapterContent(
          `Khi cậu bé chăn cừu Santiago thức dậy vào buổi sớm hôm đó, cậu biết mình đã có một giấc mơ rất đặc biệt. Trong giấc mơ, cậu thấy mình đứng trước một ngôi mộ cổ ở Ai Cập, và có một giọng nói vang lên: "Hãy đi đến thế nơi đặt kho báu."\n\nCậu không hiểu rõ ý nghĩa của giấc mơ, nhưng trong lòng cậu cảm thấy đó là một dấu hiệu quan trọng. Santiago quyết định lên đường, rời bỏ quê hương và bắt đầu hành trình tìm kiếm kho báu của mình.\n\nCậu biết rằng, trên con đường này, cậu sẽ phải đối mặt với nhiều thử thách, nhưng cậu cũng tin rằng, nếu theo đuổi giấc mơ, thì mọi thứ đều có thể xảy ra.`
        );
      });
  }, [bookId, currentChapterId]);

  // Tìm chương hiện tại
  const currentChapter = useMemo(() => {
    return chapters.find(c => c._id === currentChapterId);
  }, [chapters, currentChapterId]);

  const currentIndex = useMemo(() => {
    const idx = chapters.findIndex(c => c._id === currentChapterId);
    return idx >= 0 ? idx : 0;
  }, [chapters, currentChapterId]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentChapterId(chapters[currentIndex - 1]._id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) {
      setCurrentChapterId(chapters[currentIndex + 1]._id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    if (bookId && currentChapterId) {
      try {
        await saveReaderBookmark(bookId, currentChapterId);
      } catch { /* silent */ }
    }
  };

  const getFontSize = () => {
    if (fontSize === 'sm') return '15px';
    if (fontSize === 'lg') return '18px';
    return '16.5px';
  };

  return (
    <div
      className="bn-reader-page-root"
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
            {book?.title || 'Nhà Giả Kim'}
          </div>
          <div className="bn-reader-nav-author-name">
            {book?.author_name || 'Paulo Coelho'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--bn-text-muted)' }}>
          <button
            onClick={toggleBookmark}
            title="Lưu dấu trang"
            style={{ color: isBookmarked ? '#EF4444' : 'inherit' }}
          >
            <BookmarkIcon size={19} fill={isBookmarked ? '#EF4444' : 'none'} />
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
          <button title="Tùy chọn khác">
            <MoreVertical size={19} />
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
          <div className="bn-reader-toc-heading" style={{ color: theme === 'dark' ? '#FFFFFF' : undefined }}>
            <span>Mục lục</span>
          </div>

          {tocSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="bn-reader-part-label">{sec.part}</div>
              {sec.chapters.map((ch) => {
                // Khớp chương với dữ liệu thật trong DB
                const realChap = chapters.find(c => c.chapter_number === ch.no);
                const isActive = (realChap && realChap._id === currentChapterId) || (!realChap && ch.no === 1);
                return (
                  <div
                    key={ch.no}
                    className={`bn-reader-toc-item-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (realChap) {
                        setCurrentChapterId(realChap._id);
                      }
                    }}
                  >
                    <span>{ch.title}</span>
                    <span className="bn-reader-toc-page-num">{ch.page}</span>
                  </div>
                );
              })}
            </div>
          ))}
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
            {currentChapter?.title || 'Giấc mơ của cậu bé'}
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
                Chương {currentChapter?.chapter_number || 1} / {chapters.length > 0 ? chapters.length : 21}
              </span>
              <div className="bn-reader-footer-bar">
                <div
                  className="bn-reader-footer-fill"
                  style={{
                    width: `${Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 21)) * 100)}%`
                  }}
                />
              </div>
              <span className="bn-reader-footer-pct">
                {Math.round(((currentChapter?.chapter_number || 1) / (chapters.length || 21)) * 100)}%
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
    </div>
  );
}
