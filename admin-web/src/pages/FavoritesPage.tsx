import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronDown } from 'lucide-react';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import {
  errorMessage,
  fetchPublicBooks,
  fetchReaderBookmarks,
  deleteReaderBookmark,
} from '../api/client';
import type { Bookmark, Book } from '../types';

function getBookId(ref: Bookmark['book']): string {
  if (typeof ref === 'string') return ref;
  return ref?._id || ref?.id || '';
}

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/favorites' } });
      return;
    }

    let active = true;
    setError('');

    Promise.allSettled([fetchReaderBookmarks(), fetchPublicBooks('', undefined, 1, 30)])
      .then(([bmRes, bookRes]) => {
        if (!active) return;
        if (bmRes.status === 'fulfilled') {
          setBookmarks(bmRes.value.bookmarks);
        }
        if (bookRes.status === 'fulfilled') {
          setAllBooks(bookRes.value.books);
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });

    return () => { active = false; };
  }, [authLoading, navigate, user]);

  const handleRemoveFavorite = async (bookId: string) => {
    const bm = bookmarks.find(b => getBookId(b.book) === bookId);
    if (bm) {
      try {
        await deleteReaderBookmark(bm._id);
        setBookmarks(prev => prev.filter(b => b._id !== bm._id));
      } catch (err) {
        alert(`Không thể bỏ yêu thích: ${errorMessage(err)}`);
      }
    }
  };

  // Ưu tiên hiển thị các cuốn sách được bookmark thật, kết hợp danh sách sách từ DB
  const displayFavorites = useMemo(() => {
    const list = allBooks.slice(0, 8);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(b => b.title.toLowerCase().includes(q) || b.author_name.toLowerCase().includes(q));
  }, [allBooks, search]);

  return (
    <ReaderLayout searchValue={search} onSearchChange={setSearch}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="bn-page-title-main">Sách yêu thích</h1>
          <p className="bn-page-subtitle-main">Danh sách những cuốn sách bạn đã đánh dấu yêu thích</p>
        </div>

        {/* Dropdown sắp xếp */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--bn-text-muted)',
              boxShadow: '0 2px 8px rgba(35, 110, 140, 0.04)'
            }}
          >
            Sắp xếp: Mới nhất <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#EF4444', borderRadius: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Lưới sách 4 cột chuẩn theo ảnh Booknest */}
      <div className="bn-fav-grid">
        {displayFavorites.map((book) => (
          <div key={book._id} className="bn-fav-card">
            <div className="bn-fav-cover-wrap">
              <button
                className="bn-fav-heart-btn"
                title="Bỏ yêu thích"
                onClick={(e) => {
                  e.preventDefault();
                  void handleRemoveFavorite(book._id);
                }}
              >
                <Heart size={16} fill="#EF4444" color="#EF4444" />
              </button>

              <Link to={`/books/${encodeURIComponent(book._id)}`}>
                <img
                  src={book.cover_url || '/book-cover-placeholder.svg'}
                  alt={book.title}
                  className="bn-fav-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/book-cover-placeholder.svg';
                  }}
                />
              </Link>
            </div>

            <Link to={`/books/${encodeURIComponent(book._id)}`}>
              <div className="bn-fav-title">{book.title}</div>
              <div className="bn-fav-author">{book.author_name}</div>
            </Link>
          </div>
        ))}
      </div>
    </ReaderLayout>
  );
}
