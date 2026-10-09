// Danh mục OpenBook tìm kiếm theo API, lọc thể loại và hỗ trợ tải thêm trang.
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { AppScreen, palette, ui } from '@/components/openbook-ui';
import { getBooks } from '@/services/openbook';
import type { Book, BookCategory } from '@/types/library';
import { getBookId } from '@/types/library';
import { getSession, type AuthSession } from '@/services/api';

const categories: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'ebook', label: 'Ebook' },
  { key: 'audiobook', label: 'Sách nói' },
  { key: 'comic', label: 'Truyện tranh' },
  { key: 'webnovel', label: 'Webnovel' },
];

const categoryLabel = (category?: BookCategory | string) =>
  categories.find((item) => item.key === category)?.label ?? category ?? 'Sách';

export default function CatalogScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void getSession().then(setSession); }, []);

  const load = useCallback(async (nextPage = 1, refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError('');
    try {
      const result = await getBooks({ search, category, page: nextPage, limit: 20 });
      setBooks((current) => nextPage === 1 ? result.books : [...current, ...result.books]);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(1), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openBook = (book: Book) => {
    const bookId = getBookId(book);
    if (bookId) router.push({ pathname: '/books/[bookId]', params: { bookId } } as never);
  };

  return (
    <AppScreen tab="catalog">
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View><Text style={styles.brand}>OpenBook</Text><Text style={ui.subtitle}>Đọc theo cách của bạn</Text></View>
          <Pressable onPress={() => router.push('/account' as never)} style={styles.roleBadge}>
            <Text style={styles.roleText}>{session?.role ?? '...'}</Text>
          </Pressable>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSearch(query.trim())}
            placeholder="Tìm tên sách hoặc tác giả"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable accessibilityRole="button" onPress={() => setSearch(query.trim())} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Tìm</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {categories.map((item) => (
            <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.chip, category === item.key && styles.chipSelected]}>
              <Text style={[styles.chipText, category === item.key && styles.chipTextSelected]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>Khám phá thư viện</Text>
      </View>
      {loading
        ? <View style={styles.state}><ActivityIndicator color={palette.accent} size="large" /></View>
        : <FlatList
          data={books}
          keyExtractor={(book, index) => getBookId(book) || `${book.title}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(1, true)} tintColor={palette.accent} />}
          onEndReached={() => { if (!loadingMore && page < totalPages) void load(page + 1); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<View style={styles.state}><Text style={ui.muted}>{error || 'Chưa có sách phù hợp.'}</Text></View>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={palette.accent} style={styles.footer} /> : error ? <Text style={styles.error}>{error}</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => openBook(item)} style={({ pressed }) => [styles.bookCard, pressed && styles.pressed]}>
              <View style={styles.cover}><Text style={styles.coverMark}>O</Text></View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
                <View style={styles.bookMeta}><Text style={styles.category}>{categoryLabel(item.category)}</Text><Text style={styles.details}>Chi tiết ›</Text></View>
              </View>
            </Pressable>
          )}
        />}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: palette.accent, fontSize: 24, fontWeight: '900', letterSpacing: 0.3 },
  roleBadge: { backgroundColor: palette.pale, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  roleText: { color: palette.accent, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF', borderRadius: 12 },
  searchIcon: { color: palette.muted, fontSize: 23 },
  searchInput: { flex: 1, minWidth: 0, color: palette.ink, paddingVertical: 13, fontSize: 14 },
  searchButton: { backgroundColor: palette.pale, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  searchButtonText: { color: palette.accent, fontWeight: '800', fontSize: 12 },
  filters: { gap: 8, paddingVertical: 14 },
  chip: { borderWidth: 1, borderColor: palette.border, borderRadius: 22, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: '#FFFFFF' },
  chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: '800', marginBottom: 6 },
  list: { padding: 16, paddingTop: 8, gap: 11, flexGrow: 1 },
  bookCard: { flexDirection: 'row', gap: 14, padding: 13, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border },
  pressed: { opacity: 0.82 },
  cover: { width: 66, height: 84, borderRadius: 8, backgroundColor: '#F4DCC8', alignItems: 'center', justifyContent: 'center' },
  coverMark: { color: palette.accent, fontSize: 35, fontWeight: '900' },
  bookInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  bookTitle: { color: palette.ink, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  author: { color: palette.muted, fontSize: 13 },
  bookMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  category: { color: palette.accent, fontSize: 11, fontWeight: '700', backgroundColor: palette.pale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  details: { color: palette.accent, fontSize: 12, fontWeight: '700' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  footer: { padding: 14 },
  error: { color: palette.red, fontSize: 12, textAlign: 'center', padding: 10 },
});
