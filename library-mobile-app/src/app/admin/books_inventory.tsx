// Màn hình kho sách quản lý đầu sách, bản sao, trạng thái tồn kho và biểu mẫu chỉnh sửa.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { adminRequest } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Book, BookCopyStatus } from '@/types/library';

const filters: (BookCopyStatus | 'All')[] = ['All', 'Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'];
const filterLabels: Record<BookCopyStatus | 'All', string> = {
  All: 'Tất cả',
  Available: 'Có sẵn',
  Borrowed: 'Đang mượn',
  Damaged: 'Hỏng',
  Lost: 'Mất',
  Maintenance: 'Bảo trì',
};
const statusOptions: BookCopyStatus[] = ['Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'];

interface BookCopyInventoryItem {
  copyId: string;
  bookId?: string;
  bookTitle: string;
  author: string;
  status: BookCopyStatus;
}

interface InventoryBook extends Book {
  copies: BookCopyInventoryItem[];
  mergedBookIds: string[];
}

interface BookForm {
  isbn: string;
  title: string;
  author: string;
  category: string;
  publish_year: string;
  description: string;
}

interface ListResponse<T> {
  data?: T[];
  pagination?: { totalItems?: number };
}

const emptyForm: BookForm = { isbn: '', title: '', author: '', category: '', publish_year: '', description: '' };

// Ưu tiên ISBN làm khóa gộp; nếu thiếu thì dùng các thuộc tính nhận diện đầu sách.
function canonicalTitle(book: Book): string {
  if (book.isbn?.trim()) return `isbn:${book.isbn.trim().toLocaleLowerCase()}`;
  return [book.title, book.author, book.publish_year ?? '', book.category ?? '']
    .map((part) => String(part).trim().toLocaleLowerCase())
    .join('|');
}

// Chuẩn hóa chuỗi biểu mẫu và chuyển năm xuất bản sang số trước khi gửi API.
function mapBookForm(form: BookForm): Omit<Book, '_id'> {
  return {
    isbn: form.isbn.trim() || undefined,
    title: form.title.trim(),
    author: form.author.trim(),
    category: form.category.trim() || undefined,
    publish_year: form.publish_year.trim() ? Number(form.publish_year) : undefined,
    description: form.description.trim() || undefined,
  };
}

// Trang kho sách đáp ứng bố cục nhiều cột và thao tác trên đầu sách/bản sao.
export default function BooksInventoryScreen() {
  // Lưu kho đã nhóm, bộ lọc, biểu mẫu đầu sách và trạng thái modal bản sao.
  const { action, search: searchParam } = useLocalSearchParams<{ action?: string; search?: string }>();
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 4 : width >= 820 ? 3 : width >= 500 ? 2 : 1;
  const cardWidth = Math.max(0, (Math.min(width, 1240) - 40 - (columns - 1) * 14) / columns);
  const [books, setBooks] = useState<InventoryBook[]>([]);
  const [filter, setFilter] = useState<BookCopyStatus | 'All'>('All');
  const [query, setQuery] = useState(() => typeof searchParam === 'string' ? searchParam : '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookModal, setBookModal] = useState(false);
  const [copyModal, setCopyModal] = useState<InventoryBook | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<InventoryBook | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [copyQuantity, setCopyQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async (refresh = false) => {
    // Tải sách và bản sao song song rồi nhóm các đầu sách trùng để tránh lặp thẻ.
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [bookResponse, copyResponse] = await Promise.all([
        adminRequest<ListResponse<Book> | Book[]>('/books?limit=100'),
        adminRequest<BookCopyInventoryItem[] | { data?: BookCopyInventoryItem[] }>('/book-copies'),
      ]);
      const rawBooks = Array.isArray(bookResponse) ? bookResponse : bookResponse.data ?? [];
      const rawCopies = Array.isArray(copyResponse) ? copyResponse : copyResponse.data ?? [];
      const copiesByBookId = new Map<string, BookCopyInventoryItem[]>();
      rawCopies.forEach((copy) => {
        if (!copy.copyId) return;
        if (copy.bookId) {
          copiesByBookId.set(copy.bookId, [...(copiesByBookId.get(copy.bookId) ?? []), copy]);
        }
      });

      // Gộp dữ liệu sách trùng khóa và nối các bản sao vào bản ghi đại diện.
      const groupedBooks = new Map<string, InventoryBook>();
      rawBooks.forEach((book) => {
        const key = book.isbn?.trim() ? `isbn:${book.isbn.trim().toLowerCase()}` : canonicalTitle(book);
        const copies = copiesByBookId.get(book._id) ?? [];
        const existing = groupedBooks.get(key);
        if (existing) {
          existing.mergedBookIds.push(book._id);
          existing.copies.push(...copies);
          if (!existing.isbn && book.isbn) existing.isbn = book.isbn;
        } else {
          groupedBooks.set(key, { ...book, copies, mergedBookIds: [book._id] });
        }
      });
      setBooks([...groupedBooks.values()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải kho sách.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadInventory(), 0);
    return () => clearTimeout(timer);
  }, [loadInventory]);

  const visible = useMemo(() => books.filter((book) => {
    // Kết hợp tìm kiếm văn bản với bộ lọc khi ít nhất một bản sao có trạng thái được chọn.
    const text = `${book.title} ${book.author} ${book.category ?? ''} ${book.isbn ?? ''}`.toLowerCase();
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesStatus = filter === 'All' || book.copies.some((copy) => copy.status === filter);
    return matchesQuery && matchesStatus;
  }), [books, filter, query]);

  // Khởi tạo biểu mẫu rỗng và mở modal thêm đầu sách.
  const openCreate = () => {
    setEditingBook(null);
    setForm(emptyForm);
    setBookModal(true);
  };

  useEffect(() => {
    if (action !== 'create') return;
    const timer = setTimeout(() => {
      openCreate();
      router.setParams({ action: undefined });
    }, 0);
    return () => clearTimeout(timer);
  }, [action]);

  // Nạp dữ liệu hiện tại của đầu sách vào biểu mẫu chỉnh sửa.
  const openEdit = (book: InventoryBook) => {
    setEditingBook(book);
    setForm({
      isbn: book.isbn ?? '',
      title: book.title,
      author: book.author,
      category: book.category ?? '',
      publish_year: book.publish_year ? String(book.publish_year) : '',
      description: book.description ?? '',
    });
    setBookModal(true);
  };

  const saveBook = async () => {
    // Kiểm tra tiêu đề, tác giả và năm hợp lệ trước khi tạo hoặc cập nhật đầu sách.
    if (!form.title.trim() || !form.author.trim()) {
      setError('Vui lòng nhập tiêu đề và tác giả.');
      return;
    }
    const year = Number(form.publish_year);
    if (form.publish_year.trim() && (!Number.isInteger(year) || year < 0 || year > 3000)) {
      setError('Năm xuất bản phải là số nguyên từ 0 đến 3000.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = mapBookForm(form);
      if (editingBook) {
        await adminRequest(`/books/${editingBook._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminRequest('/books', { method: 'POST', body: JSON.stringify(payload) });
      }
      setBookModal(false);
      Alert.alert('Thành công', editingBook ? 'Đã cập nhật đầu sách.' : 'Đã thêm đầu sách.');
      await loadInventory(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể lưu đầu sách.');
    } finally {
      setSaving(false);
    }
  };

  const addCopies = async () => {
    // Chỉ chấp nhận số lượng nguyên từ 1 đến 100 cho yêu cầu tạo bản sao.
    if (!copyModal) return;
    const quantity = Number(copyQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      setError('Số bản sao phải là số nguyên từ 1 đến 100.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const bookId = copyModal.mergedBookIds[0];
      await adminRequest('/book-copies', { method: 'POST', body: JSON.stringify({ bookId, quantity }) });
      setCopyModal(null);
      setCopyQuantity('1');
      await loadInventory(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể thêm bản sao.');
    } finally {
      setSaving(false);
    }
  };

  const updateCopyStatus = async (copy: BookCopyInventoryItem, status: BookCopyStatus) => {
    // Cập nhật trạng thái trên máy chủ, tải lại kho và đồng bộ modal nếu còn mở.
    try {
      await adminRequest(`/book-copies/${copy.copyId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      await loadInventory(true);
      setCopyModal((current) => current ? {
        ...current,
        copies: current.copies.map((item) => item.copyId === copy.copyId ? { ...item, status } : item),
      } : null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái bản sao.');
    }
  };

  const deleteCopy = async (copy: BookCopyInventoryItem) => {
    // Xóa bản sao qua API rồi làm mới kho để loại bỏ bản ghi đã xóa.
    try {
      await adminRequest(`/book-copies/${copy.copyId}`, { method: 'DELETE' });
      await loadInventory(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xóa bản sao.');
    }
  };

  // Thẻ đầu sách hiển thị số bản sao và cho phép mở danh sách quản lý từng bản.
  const renderBook = ({ item }: { item: InventoryBook }) => (
    <View style={[styles.bookCard, columns > 1 ? styles.gridCard : null, columns > 1 ? { width: cardWidth } : null]}>
      <View style={styles.bookHeader}>
        <View style={styles.bookIcon}><Text style={styles.bookIconText}>▤</Text></View>
        <Pressable style={styles.editButton} onPress={() => openEdit(item)}><Text style={styles.editText}>Sửa</Text></Pressable>
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
      <View style={styles.cardFooter}>
        <StatusChip
          status={item.copies.some((copy) => copy.status === 'Available') ? 'Available' : item.copies[0]?.status ?? 'Maintenance'}
          count={item.copies.length}
          label={`${item.copies.length} bản sao · ${item.copies.filter((copy) => copy.status === 'Available').length} có sẵn`}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.outlineButton}
        onPress={() => setExpandedBookId((current) => current === item._id ? null : item._id)}>
        <Text style={styles.outlineText}>{expandedBookId === item._id ? 'Ẩn bản sao' : `Xem bản sao (${item.copies.length})`}</Text>
      </Pressable>
      {expandedBookId === item._id && <View style={styles.inlineCopies}>
        <View style={styles.inlineCopyHeader}>
          <Text style={styles.inlineCopyTitle}>Quản lý bản sao</Text>
          <Pressable style={styles.addCopyButton} onPress={() => setCopyModal(item)}><Text style={styles.addCopyText}>+ Thêm</Text></Pressable>
        </View>
        {item.copies.length === 0 ? <Text style={styles.emptyCopies}>Chưa có bản sao.</Text> : item.copies.map((copy) => (
          <View key={copy.copyId} style={styles.inlineCopyRow}>
            <Text style={styles.inlineCopyId}>#{copy.copyId.slice(-8).toUpperCase()}</Text>
            <View style={styles.inlineCopyActions}>
              <StatusChip status={copy.status} count={1} />
              {statusOptions.filter((status) => status !== 'Borrowed' && status !== copy.status).map((status) => (
                <Pressable key={status} style={styles.statusOption} onPress={() => void updateCopyStatus(copy, status)}>
                  <Text style={styles.statusOptionText}>{filterLabels[status]}</Text>
                </Pressable>
              ))}
              {copy.status !== 'Borrowed' && <Pressable style={styles.deleteCopyButton} onPress={() => void deleteCopy(copy)}>
                <Text style={styles.deleteCopyText}>Xóa</Text>
              </Pressable>}
            </View>
          </View>
        ))}
      </View>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Kho sách</Text><Text style={styles.subtitle}>{books.length} đầu sách</Text></View>
        <Pressable style={styles.primaryButton} onPress={openCreate}><Text style={styles.primaryText}>+ Thêm sách</Text></Pressable>
      </View>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm tên sách, tác giả, ISBN, thể loại" placeholderTextColor="#9a8575" containerStyle={styles.search} />
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={filters} keyExtractor={(item) => item} style={styles.filterList} contentContainerStyle={styles.filters} renderItem={({ item }) => <Pressable style={[styles.filter, filter === item && styles.activeFilter]} onPress={() => setFilter(item)}><Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{filterLabels[item]}</Text></Pressable>} />
      {error && <View style={styles.inlineError}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => setError(null)}><Text style={styles.dismiss}>×</Text></Pressable></View>}
      {loading ? <State message="Đang tải kho sách..." loading /> : error && !books.length ? <State message={error} action="Thử lại" onAction={() => void loadInventory()} /> : visible.length === 0 ? <State message={query || filter !== 'All' ? 'Không có đầu sách phù hợp.' : 'Kho sách đang trống.'} /> : <FlatList key={`inventory-${columns}`} data={visible} numColumns={columns} keyExtractor={(item) => item._id} contentContainerStyle={styles.grid} columnWrapperStyle={columns > 1 ? styles.column : undefined} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadInventory(true)} colors={['#e97824']} />} renderItem={renderBook} />}

      <Modal visible={bookModal} transparent animationType="fade" onRequestClose={() => setBookModal(false)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingBook ? 'Chỉnh sửa đầu sách' : 'Thêm đầu sách'}</Text>
            <Text style={styles.modalSubtitle}>Thông tin đầu sách lưu theo Book model.</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.formGrid}>
              <FormField label="ISBN" value={form.isbn} placeholder="ISBN" onChangeText={(isbn) => setForm((current) => ({ ...current, isbn }))} />
              <FormField label="Tiêu đề *" value={form.title} placeholder="Tên sách" onChangeText={(title) => setForm((current) => ({ ...current, title }))} />
              <FormField label="Tác giả *" value={form.author} placeholder="Tên tác giả" onChangeText={(author) => setForm((current) => ({ ...current, author }))} />
              <FormField label="Thể loại" value={form.category} placeholder="Thể loại" onChangeText={(category) => setForm((current) => ({ ...current, category }))} />
              <FormField label="Năm xuất bản" value={form.publish_year} placeholder="2026" keyboardType="number-pad" onChangeText={(publish_year) => setForm((current) => ({ ...current, publish_year }))} />
              <FormField label="Mô tả" value={form.description} placeholder="Mô tả sách" multiline onChangeText={(description) => setForm((current) => ({ ...current, description }))} />
            </View>
            <View style={styles.modalActions}><Pressable style={styles.cancelButton} onPress={() => setBookModal(false)}><Text style={styles.cancelText}>Hủy</Text></Pressable><Pressable disabled={saving} style={styles.primaryButton} onPress={() => void saveBook()}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu sách</Text>}</Pressable></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={Boolean(copyModal)} transparent animationType="fade" onRequestClose={() => setCopyModal(null)}>
        <View style={styles.backdrop}><View style={styles.copyModal}>
          <Text style={styles.modalTitle}>Bản sao sách</Text><Text style={styles.modalSubtitle}>{copyModal?.title}</Text>
          <View style={styles.addCopyRow}><TextInput value={copyQuantity} onChangeText={setCopyQuantity} keyboardType="number-pad" style={styles.quantityInput} /><Pressable disabled={saving} style={styles.primaryButton} onPress={() => void addCopies()}><Text style={styles.primaryText}>+ Thêm bản sao</Text></Pressable></View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList data={copyModal?.copies ?? []} keyExtractor={(item) => item.copyId} ListEmptyComponent={<Text style={styles.emptyCopies}>Chưa có bản sao.</Text>} renderItem={({ item }) => <View style={styles.copyRow}><View style={styles.copyInfo}><Text style={styles.copyId}>Mã {item.copyId.slice(-8).toUpperCase()}</Text><StatusChip status={item.status} count={1} label={filterLabels[item.status]} /></View><View style={styles.statusActions}>{statusOptions.filter((status) => status !== 'Borrowed').map((status) => <Pressable key={status} disabled={item.status === 'Borrowed' || item.status === status} style={[styles.statusOption, item.status === status && styles.selectedStatus, item.status === 'Borrowed' && styles.disabledStatus]} onPress={() => void updateCopyStatus(item, status)}><Text style={[styles.statusOptionText, item.status === status && styles.selectedStatusText]}>{filterLabels[status]}</Text></Pressable>)}</View>{item.status === 'Borrowed' && <Text style={styles.meta}>Bản đang mượn chỉ được cập nhật qua nghiệp vụ trả sách.</Text>}</View>} />
          <Pressable style={styles.cancelButton} onPress={() => setCopyModal(null)}><Text style={styles.cancelText}>Đóng</Text></Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

// Trường nhập dùng chung cho biểu mẫu sách, hỗ trợ nhập nhiều dòng và bàn phím số.
function FormField({ label, value, placeholder, onChangeText, multiline, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: 'default' | 'number-pad' }) {
  return <View style={styles.formField}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#a18d7d" keyboardType={keyboardType ?? 'default'} multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}

// Huy hiệu trạng thái bản sao kèm số lượng và nhãn mô tả tùy chọn.
function StatusChip({ status, count, label }: { status: BookCopyStatus; count: number; label?: string }) {
  const color = status === 'Available' ? styles.greenChip : status === 'Borrowed' ? styles.blueChip : status === 'Damaged' || status === 'Lost' ? styles.redChip : styles.orangeChip;
  return <View style={[styles.chip, color]}><Text style={styles.chipText}>{label ?? `${count} ${filterLabels[status].toLowerCase()}`}</Text></View>;
}

// Trạng thái danh sách dùng chung cho tải, lỗi, dữ liệu trống và hành động thử lại.
function State({ message, loading, action, onAction }: { message: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <View style={styles.center}>{loading && <ActivityIndicator size="large" color="#e97824" />}<Text style={styles.empty}>{message}</Text>{action && onAction && <Pressable style={styles.primaryButton} onPress={onAction}><Text style={styles.primaryText}>{action}</Text></Pressable>}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  title: { color: '#8f3d13', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#947b68', marginTop: 4 },
  search: { marginHorizontal: 20, marginBottom: 8 },
  filterList: { flexGrow: 0, height: 58 },
  filters: { alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  filter: { backgroundColor: '#FFF0DF', borderRadius: 6, paddingHorizontal: 13, paddingVertical: 8 },
  activeFilter: { backgroundColor: '#e97824' },
  filterText: { color: '#83583d', fontSize: 12, fontWeight: '600' },
  activeFilterText: { color: '#fff' },
  grid: { paddingHorizontal: 20, paddingBottom: 28, gap: 14, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  column: { gap: 14 },
  bookCard: { backgroundColor: '#FFFFFF', borderRadius: 2, padding: 12, gap: 6, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#334155', shadowOpacity: 0.025, shadowRadius: 4, elevation: 2, minHeight: 188 },
  gridCard: { flexGrow: 0, flexShrink: 0, minWidth: 0 },
  bookHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  bookIcon: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#FFF0DF', alignItems: 'center', justifyContent: 'center' },
  bookIconText: { fontSize: 22, color: '#e97824' },
  editButton: { borderRadius: 6, backgroundColor: '#FFF3E0', paddingHorizontal: 9, paddingVertical: 5 },
  editText: { color: '#bd5b16', fontWeight: '700', fontSize: 12 },
  bookTitle: { color: '#633617', fontWeight: '800', fontSize: 14, lineHeight: 18, minHeight: 36 },
  author: { color: '#947b68', fontSize: 11 },
  meta: { color: '#a38b77', fontSize: 11 },
  cardFooter: { marginTop: 'auto', paddingTop: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  chip: { borderRadius: 2, paddingHorizontal: 7, paddingVertical: 5 },
  greenChip: { backgroundColor: '#e5f4e8' },
  blueChip: { backgroundColor: '#e5eff6' },
  redChip: { backgroundColor: '#fbe7e3' },
  orangeChip: { backgroundColor: '#fff0df' },
  chipText: { color: '#7b4b2c', fontWeight: '700', fontSize: 9 },
  total: { color: '#bc5d19', fontWeight: '700', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 5 },
  primaryButton: { backgroundColor: '#FF9F43', borderRadius: 6, paddingHorizontal: 11, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  outlineButton: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 7, width: '100%', alignItems: 'center' },
  outlineText: { color: '#ad531a', fontSize: 10, fontWeight: '700' },
  inlineCopies: { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 6, paddingTop: 8, gap: 8 },
  inlineCopyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineCopyTitle: { color: '#71370f', fontWeight: '800', fontSize: 13 },
  addCopyButton: { borderRadius: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 9, paddingVertical: 5 },
  addCopyText: { color: '#ad531a', fontSize: 12, fontWeight: '700' },
  inlineCopyRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 6, gap: 6 },
  inlineCopyId: { color: '#714526', fontWeight: '700', fontSize: 12 },
  inlineCopyActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  deleteCopyButton: { borderWidth: 1, borderColor: '#FECACA', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5 },
  deleteCopyText: { color: '#B91C1C', fontSize: 10, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  empty: { color: '#947b68', textAlign: 'center' },
  inlineError: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, padding: 10, borderRadius: 2, backgroundColor: '#fff0ed', justifyContent: 'space-between' },
  errorText: { color: '#aa402b', flex: 1 },
  dismiss: { color: '#aa402b', fontSize: 20, paddingHorizontal: 8 },
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#0F172A88' },
  modal: { width: '100%', maxWidth: 700, backgroundColor: '#FFFFFF', padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, maxHeight: '90%', gap: 10, elevation: 2 },
  copyModal: { width: '100%', maxWidth: 700, backgroundColor: '#FFFFFF', padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, maxHeight: '88%', gap: 12, elevation: 2 },
  modalTitle: { color: '#71370f', fontSize: 21, fontWeight: '800' },
  modalSubtitle: { color: '#947b68', marginBottom: 4 },
  formGrid: { gap: 8 },
  formField: { gap: 4 },
  fieldLabel: { color: '#76543c', fontWeight: '700', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, color: '#334155', fontSize: 14 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelButton: { borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelText: { color: '#76543c', fontWeight: '700' },
  addCopyRow: { flexDirection: 'row', gap: 8 },
  quantityInput: { width: 76, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#fff', paddingHorizontal: 12, color: '#334155', fontSize: 14 },
  copyRow: { borderTopWidth: 1, borderTopColor: '#f0e4d8', paddingVertical: 12, gap: 8 },
  copyInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyId: { color: '#714526', fontWeight: '700', fontSize: 12 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  statusOption: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5 },
  selectedStatus: { borderColor: '#e97824', backgroundColor: '#fff0df' },
  statusOptionText: { fontSize: 10, color: '#76543c' },
  selectedStatusText: { color: '#aa4b0c', fontWeight: '700' },
  disabledStatus: { opacity: 0.45 },
  emptyCopies: { color: '#947b68', textAlign: 'center', padding: 18 },
});
