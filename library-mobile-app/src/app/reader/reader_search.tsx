import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDate, readerRequest } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Book, BookCopyStatus } from '@/types/library';

interface InventoryCopy {
  copyId: string;
  bookId?: string;
  bookTitle: string;
  author: string;
  status: BookCopyStatus;
}

interface BookResult extends Book {
  copies: InventoryCopy[];
  mergedBookIds: string[];
}

interface ListResponse<T> {
  data: T[];
  pagination?: { totalItems?: number; total?: number };
}

function getBookKey(title: string, author: string): string {
  return `${title.trim().toLocaleLowerCase()}|${author.trim().toLocaleLowerCase()}`;
}

function canonicalBook(book: Book): string {
  return [book.isbn?.trim().toLowerCase() ?? '', book.title, book.author, book.publish_year ?? '', book.category ?? '']
    .map(String)
    .join('|');
}

export default function ReaderSearchScreen() {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const [authorFilter, setAuthorFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<BookResult | null>(null);
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [bookResponse, copyResponse] = await Promise.all([
        readerRequest<ListResponse<Book> | Book[]>('/books?limit=100'),
        readerRequest<{ data?: InventoryCopy[] } | InventoryCopy[]>('/book-copies'),
      ]);
      const rawBooks = Array.isArray(bookResponse) ? bookResponse : bookResponse.data;
      const rawCopies = Array.isArray(copyResponse) ? copyResponse : copyResponse.data ?? [];
      const grouped = new Map<string, InventoryCopy[]>();
      rawCopies.forEach((copy) => {
        const key = copy.bookId ?? getBookKey(copy.bookTitle, copy.author);
        grouped.set(key, [...(grouped.get(key) ?? []), copy]);
      });

      const deduplicated = new Map<string, BookResult>();
      rawBooks.forEach((book) => {
        const key = canonicalBook(book);
        const copies = grouped.get(book._id) ?? grouped.get(getBookKey(book.title, book.author)) ?? [];
        const current = deduplicated.get(key);
        if (current) {
          current.copies.push(...copies.filter((copy) => !current.copies.some((existing) => existing.copyId === copy.copyId)));
          current.mergedBookIds.push(book._id);
        } else {
          deduplicated.set(key, { ...book, copies, mergedBookIds: [book._id] });
        }
      });
      setBooks([...deduplicated.values()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách sách.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const categories = useMemo(() => ['Tất cả', ...new Set(books.map((book) => book.category).filter((value): value is string => Boolean(value)))], [books]);
  const authors = useMemo(() => ['Tất cả', ...new Set(books.map((book) => book.author).filter(Boolean))], [books]);
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesText = !value || `${book.title} ${book.author} ${book.category ?? ''} ${book.isbn ?? ''}`.toLowerCase().includes(value);
      return matchesText
        && (categoryFilter === 'Tất cả' || book.category === categoryFilter)
        && (authorFilter === 'Tất cả' || book.author === authorFilter);
    });
  }, [authorFilter, books, categoryFilter, query]);

  const openBook = (book: BookResult) => {
    setSelected(book);
    setSelectedCopyIds([]);
  };

  const toggleCopy = (copyId: string) => {
    setSelectedCopyIds((current) => current.includes(copyId)
      ? current.filter((id) => id !== copyId)
      : current.length >= 10 ? current : [...current, copyId]);
  };

  const borrow = async () => {
    if (!selected || selectedCopyIds.length === 0) {
      setError('Vui lòng chọn ít nhất một bản sao đang có sẵn.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await readerRequest('/borrow-cards', {
        method: 'POST',
        body: JSON.stringify({ copyIds: selectedCopyIds, dueDate: dueDate.toISOString() }),
      });
      setSelected(null);
      setSelectedCopyIds([]);
      setError(null);
      await load(true);
      setError(`Đăng ký mượn thành công. Hạn trả dự kiến: ${formatDate(dueDate.toISOString())}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể đăng ký mượn sách.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Tra cứu sách</Text><Text style={styles.subtitle}>Tìm sách và chọn đúng bản sao muốn mượn</Text></View>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Tên sách, tác giả, thể loại hoặc ISBN" placeholderTextColor="#9a8575" containerStyle={styles.search} />
      <Text style={styles.filterLabel}>Thể loại</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{categories.map((category) => <FilterChip key={category} label={category} selected={categoryFilter === category} onPress={() => setCategoryFilter(category)} />)}</ScrollView>
      <Text style={styles.filterLabel}>Tác giả</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{authors.map((author) => <FilterChip key={author} label={author} selected={authorFilter === author} onPress={() => setAuthorFilter(author)} />)}</ScrollView>
      {error && <View style={styles.notice}><Text style={styles.noticeText}>{error}</Text><Pressable onPress={() => setError(null)}><Text style={styles.dismiss}>×</Text></Pressable></View>}
      {loading ? <State message="Đang tải danh mục sách..." loading /> : !books.length && error ? <State message={error} action="Thử lại" onAction={() => void load()} /> : filtered.length === 0 ? <State message="Không tìm thấy sách phù hợp với bộ lọc." /> : <FlatList data={filtered} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#e97824']} />} renderItem={({ item }) => {
        const available = item.copies.filter((copy) => copy.status === 'Available').length;
        return <Pressable style={styles.card} onPress={() => openBook(item)}>
          <View style={styles.icon}><Text style={styles.iconText}>▤</Text></View>
          <View style={styles.body}><Text style={styles.bookTitle}>{item.title}</Text><Text style={styles.author}>{item.author}{item.publish_year ? ` · ${item.publish_year}` : ''}</Text>{item.category && <Text style={styles.category}>{item.category}</Text>}
            <View style={styles.bottom}><View style={[styles.badge, available > 0 ? styles.available : styles.unavailable]}><Text style={styles.badgeText}>{available > 0 ? `${available} bản có sẵn` : 'Không có bản sẵn'}</Text></View><Text style={styles.detail}>Chọn bản sao ›</Text></View>
          </View>
        </Pressable>;
      }} />}
      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}><View style={styles.modal}>
          <Text style={styles.modalTitle}>{selected?.title}</Text><Text style={styles.author}>{selected?.author}</Text>
          <Text style={styles.modalSubtitle}>Chọn bản sao đang có sẵn (tối đa 10 cuốn)</Text>
          {error && <Text style={styles.inlineError}>{error}</Text>}
          <FlatList data={selected?.copies.filter((copy) => copy.status === 'Available') ?? []} keyExtractor={(item) => item.copyId} ListEmptyComponent={<Text style={styles.empty}>Hiện không có bản sao khả dụng.</Text>} renderItem={({ item }) => {
            const isSelected = selectedCopyIds.includes(item.copyId);
            return <Pressable style={styles.copyRow} onPress={() => toggleCopy(item.copyId)}><View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View><View style={styles.copyInfo}><Text style={styles.copyTitle}>{item.bookTitle}</Text><Text style={styles.copyCode}>Mã bản sao: {item.copyId.slice(-8).toUpperCase()}</Text></View><Text style={styles.copyAvailable}>Có sẵn</Text></Pressable>;
          }} />
          <View style={styles.modalActions}><Pressable style={styles.cancel} onPress={() => setSelected(null)}><Text style={styles.cancelText}>Đóng</Text></Pressable><Pressable style={styles.primary} disabled={submitting || selectedCopyIds.length === 0} onPress={() => void borrow()}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Đăng ký ({selectedCopyIds.length})</Text>}</Pressable></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={onPress}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text></Pressable>;
}

function State({ message, loading, action, onAction }: { message: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <View style={styles.center}>{loading && <ActivityIndicator size="large" color="#e97824" />}<Text style={styles.empty}>{message}</Text>{action && onAction && <Pressable style={styles.primary} onPress={onAction}><Text style={styles.primaryText}>{action}</Text></Pressable>}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f1' },
  header: { padding: 20, paddingBottom: 12 },
  title: { color: '#8f3d13', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#947b68', marginTop: 4 },
  search: { marginHorizontal: 20, marginBottom: 8 },
  filterLabel: { color: '#76543c', fontSize: 12, fontWeight: '800', marginHorizontal: 20, marginTop: 12, marginBottom: 6 },
  filterRow: { gap: 7, paddingHorizontal: 20, paddingBottom: 2 },
  filterChip: { backgroundColor: '#FFF0DF', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  filterChipSelected: { backgroundColor: '#e97824' },
  filterText: { color: '#83583d', fontSize: 11, fontWeight: '600' },
  filterTextSelected: { color: '#fff' },
  list: { padding: 20, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#f2e2d2', elevation: 2 },
  icon: { width: 46, height: 58, borderRadius: 10, backgroundColor: '#fff0df', justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#e97824', fontSize: 27 },
  body: { flex: 1 },
  bookTitle: { color: '#633617', fontSize: 16, fontWeight: '800' },
  author: { color: '#947b68', fontSize: 13, marginTop: 4 },
  category: { color: '#bd5b16', fontSize: 12, marginTop: 4 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  available: { backgroundColor: '#e5f4e8' },
  unavailable: { backgroundColor: '#fbe7e3' },
  badgeText: { color: '#6d4a31', fontSize: 11, fontWeight: '700' },
  detail: { color: '#bd5b16', fontSize: 12, fontWeight: '800' },
  notice: { flexDirection: 'row', marginHorizontal: 20, marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: '#fff0df', gap: 8 },
  noticeText: { color: '#8c4319', flex: 1, fontSize: 13 },
  dismiss: { color: '#8c4319', fontSize: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 28 },
  empty: { color: '#947b68', textAlign: 'center' },
  primary: { backgroundColor: '#e97824', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#24170eb0' },
  modal: { backgroundColor: '#fffaf5', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10, maxHeight: '85%' },
  modalTitle: { color: '#71370f', fontSize: 22, fontWeight: '800' },
  modalSubtitle: { color: '#947b68', fontSize: 13 },
  inlineError: { color: '#aa402b', backgroundColor: '#fff0ed', borderRadius: 8, padding: 9 },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#f0e4d8' },
  checkbox: { width: 21, height: 21, borderWidth: 1, borderColor: '#cdb49c', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#e97824', borderColor: '#e97824' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  copyInfo: { flex: 1, gap: 3 },
  copyTitle: { color: '#714526', fontWeight: '700', fontSize: 13 },
  copyCode: { color: '#947b68', fontSize: 11 },
  copyAvailable: { color: '#25814e', fontWeight: '700', fontSize: 11 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 5 },
  cancel: { borderWidth: 1, borderColor: '#ead7c4', borderRadius: 10, paddingHorizontal: 17, paddingVertical: 10 },
  cancelText: { color: '#76543c', fontWeight: '700' },
});
