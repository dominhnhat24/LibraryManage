// Khung quản trị dùng chung: thanh điều hướng, tìm kiếm toàn cục và hộp thoại tạo phiếu mượn.
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, Stack, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { getSession, type AuthSession } from '@/services/api';
import { adminRequest } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Book, BookCopyStatus, BorrowCard, Fine, Reader } from '@/types/library';

type AdminPath =
  | '/admin/dashboard'
  | '/admin/books_inventory'
  | '/admin/borrow_cards'
  | '/admin/reader_management'
  | '/admin/fines'
  | '/admin/librarians'
  | '/admin/reports'
  | '/admin/settings';

interface AdminNavigationItem {
  label: string;
  icon: string;
  path: AdminPath | null;
}

interface AvailableCopy {
  copyId: string;
  bookId?: string;
  bookTitle: string;
  author: string;
  status: BookCopyStatus;
}
interface ReaderPage { data?: Reader[] }
interface SearchPage<T> { data?: T[] }

// Chuẩn hóa danh sách API có thể được trả trực tiếp hoặc bọc trong thuộc tính data.
function listItems<T>(response: T[] | SearchPage<T>): T[] {
  return Array.isArray(response) ? response : response.data ?? [];
}

// So khớp phiếu mượn với mã, trạng thái, tên độc giả và tiêu đề các sách trong phiếu.
function borrowMatches(card: BorrowCard, query: string): boolean {
  const readerName = typeof card.readerId === 'string' ? '' : card.readerId?.full_name ?? '';
  const bookTitles = (Array.isArray(card.details) ? card.details : []).map((detail) => {
    return typeof detail.bookId === 'string' ? '' : detail.bookId?.title ?? '';
  }).join(' ');
  return `${card._id} ${card.status} ${readerName} ${bookTitles}`.toLocaleLowerCase().includes(query);
}

const operations: AdminNavigationItem[] = [
  { label: 'Tổng quan', icon: '▦', path: '/admin/dashboard' },
  { label: 'Kho sách', icon: '▤', path: '/admin/books_inventory' },
  { label: 'Phiếu mượn', icon: '▧', path: '/admin/borrow_cards' },
  { label: 'Độc giả', icon: '♙', path: '/admin/reader_management' },
  { label: 'Tiền phạt', icon: '◉', path: '/admin/fines' },
];

const administration: AdminNavigationItem[] = [
  { label: 'Nhân viên', icon: '♧', path: '/admin/librarians' },
  { label: 'Báo cáo', icon: '▥', path: '/admin/reports' },
  { label: 'Cài đặt', icon: '⚙', path: '/admin/settings' },
];

// Định dạng ngày thành nhãn tiếng Việt dùng ở thanh công cụ quản trị.
function currentDateLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return `${day} tháng ${month}, ${year}`;
}

// Giao diện quản trị responsive bao quanh mọi màn hình admin và điều phối các lối tắt chung.
export default function AdminLayout() {
  // Quản lý responsive layout, thông tin thủ thư, tìm kiếm và quy trình tạo phiếu tại chỗ.
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const routeName = segments[segments.length - 1] ?? 'dashboard';
  const isMobile = width < 900;
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchMessage, setGlobalSearchMessage] = useState<string | null>(null);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [createLoanOpen, setCreateLoanOpen] = useState(false);
  const [loanReaders, setLoanReaders] = useState<Reader[]>([]);
  const [availableCopies, setAvailableCopies] = useState<AvailableCopy[]>([]);
  const [selectedReaderId, setSelectedReaderId] = useState('');
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanSaving, setLoanSaving] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);
  const dateLabel = useMemo(() => currentDateLabel(new Date()), []);

  useEffect(() => {
    // Nạp hồ sơ phiên sau khi mount và bỏ qua cập nhật nếu layout đã unmount.
    let mounted = true;
    void getSession().then((value) => {
      if (mounted) setSession(value);
    }).catch((error: unknown) => {
      console.error('Unable to load librarian session for the admin layout.', error);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const navigate = (item: AdminNavigationItem) => {
    // Đóng menu di động trước khi chuyển tới route được chọn.
    setMobileMenuOpen(false);
    if (item.path) router.push(item.path);
  };

  const performGlobalSearch = async () => {
    // Tra cứu các nhóm dữ liệu song song rồi mở màn hình phù hợp với kết quả đầu tiên.
    const query = globalSearch.trim();
    if (!query) {
      setGlobalSearchMessage('Nhập từ khóa cần tìm.');
      return;
    }
    setGlobalSearchLoading(true);
    setGlobalSearchMessage(null);
    const encoded = encodeURIComponent(query);
    try {
      // Tải bốn nhóm dữ liệu độc lập cùng lúc để giảm thời gian phản hồi tìm kiếm.
      const [bookResponse, readerResponse, cardResponse, fineResponse] = await Promise.all([
        adminRequest<SearchPage<Book> | Book[]>(`/books?search=${encoded}&limit=100`),
        adminRequest<SearchPage<Reader> | Reader[]>(`/readers?search=${encoded}&limit=100`),
        adminRequest<SearchPage<BorrowCard> | BorrowCard[]>('/borrow-cards?limit=100'),
        adminRequest<SearchPage<Fine> | Fine[]>('/fines?limit=100'),
      ]);
      const books = listItems(bookResponse);
      const readers = listItems(readerResponse);
      const cards = listItems(cardResponse);
      const fines = listItems(fineResponse);
      const normalized = query.toLocaleLowerCase();
      const reader = readers.find((item) => `${item.full_name} ${item.email ?? ''} ${item.phone ?? ''}`.toLocaleLowerCase().includes(normalized));
      const fine = fines.find((item) => {
        const fineReader = typeof item.readerId === 'string' ? '' : item.readerId?.full_name ?? '';
        return `${item.reason} ${item.status} ${item._id} ${item.borrowCardId} ${fineReader}`.toLocaleLowerCase().includes(normalized);
      });
      const card = cards.find((item) => borrowMatches(item, normalized));
      const book = books.find((item) => `${item.title} ${item.author} ${item.category ?? ''} ${item.isbn ?? ''}`.toLocaleLowerCase().includes(normalized));

      if (reader) {
        router.push({ pathname: '/admin/reader_management', params: { search: query } });
      } else if (fine) {
        router.push({ pathname: '/admin/fines', params: { search: query } });
      } else if (card) {
        router.push({ pathname: '/admin/borrow_cards', params: { search: query } });
      } else if (book) {
        router.push({ pathname: '/admin/books_inventory', params: { search: query } });
      } else {
        router.push({ pathname: '/admin/books_inventory', params: { search: query } });
        setGlobalSearchMessage(`Không tìm thấy kết quả khớp “${query}”; đang mở tìm kiếm Kho sách.`);
      }
    } catch (searchError) {
      setGlobalSearchMessage(searchError instanceof Error ? searchError.message : 'Không thể tìm kiếm dữ liệu.');
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  const openLoanDialog = async () => {
    // Mở hộp thoại ngay, tải độc giả đang hoạt động và chỉ các bản sao hiện có.
    setCreateLoanOpen(true);
    setLoanLoading(true);
    setLoanError(null);
    try {
      const [readerResponse, copyResponse] = await Promise.all([
        adminRequest<ReaderPage | Reader[]>('/readers?limit=100'),
        adminRequest<AvailableCopy[] | { data?: AvailableCopy[] }>('/book-copies'),
      ]);
      const readers = Array.isArray(readerResponse) ? readerResponse : readerResponse.data ?? [];
      const copies = Array.isArray(copyResponse) ? copyResponse : copyResponse.data ?? [];
      setLoanReaders(readers.filter((reader) => reader.status === 'Active'));
      setAvailableCopies(copies.filter((copy) => copy.status === 'Available'));
    } catch (loadError) {
      setLoanError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách độc giả và bản sao.');
    } finally {
      setLoanLoading(false);
    }
  };

  const toggleCopy = (copyId: string) => {
    // Thêm/bỏ chọn bản sao và giới hạn tối đa mười lựa chọn trong một phiếu.
    setSelectedCopyIds((current) => current.includes(copyId)
      ? current.filter((selectedId) => selectedId !== copyId)
      : current.length < 10 ? [...current, copyId] : current);
  };

  const createLoan = async () => {
    // Kiểm tra độc giả, bản sao và hạn trả tương lai trước khi gửi yêu cầu tạo phiếu.
    if (!selectedReaderId || selectedCopyIds.length === 0) {
      setLoanError('Chọn độc giả và ít nhất một bản sao.');
      return;
    }
    const due = new Date(`${dueDate}T23:59:59.000Z`);
    if (!dueDate || Number.isNaN(due.getTime()) || due <= new Date()) {
      setLoanError('Ngày hẹn trả phải nằm trong tương lai.');
      return;
    }
    setLoanSaving(true);
    setLoanError(null);
    try {
      await adminRequest('/borrow-cards', {
        method: 'POST',
        body: JSON.stringify({ readerId: selectedReaderId, copyIds: selectedCopyIds, dueDate: due.toISOString() }),
      });
      setCreateLoanOpen(false);
      setSelectedReaderId('');
      setSelectedCopyIds([]);
      Alert.alert('Đã tạo phiếu', 'Phiếu mượn đã được gửi chờ duyệt.');
      router.push('/admin/borrow_cards');
    } catch (createError) {
      setLoanError(createError instanceof Error ? createError.message : 'Không thể tạo phiếu mượn.');
    } finally {
      setLoanSaving(false);
    }
  };

  // Tạo các mục điều hướng và đánh dấu mục trùng với route hiện tại.
  const renderNavigation = (items: AdminNavigationItem[]) => items.map((item) => {
    // Đánh dấu route hiện hành để cả sidebar thường và menu di động cùng hiển thị trạng thái.
    const active = item.path !== null && routeName === item.path.split('/').pop();
    return (
      <Pressable
        key={item.label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => navigate(item)}
        style={[styles.navigationItem, active && styles.navigationItemActive]}>
        <Text style={[styles.navigationIcon, active && styles.navigationIconActive]}>{item.icon}</Text>
        <Text style={[styles.navigationLabel, active && styles.navigationLabelActive]}>{item.label}</Text>
        {active && <View style={styles.activeMark} />}
      </Pressable>
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Bố cục thay sidebar bằng nút menu trên màn hình hẹp; nội dung route luôn nằm trong Stack. */}
      <View style={styles.shell}>
        {!isMobile && <Sidebar name={session?.full_name ?? 'Mai Linh'} renderNavigation={renderNavigation} />}
        <View style={styles.main}>
          <View style={styles.topbar}>
            {isMobile && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mở điều hướng"
                style={styles.menuButton}
                onPress={() => setMobileMenuOpen((open) => !open)}>
                <Text style={styles.menuButtonText}>☰</Text>
              </Pressable>
            )}
            <SearchBar
              value={globalSearch}
              onChangeText={setGlobalSearch}
              onSubmitEditing={() => void performGlobalSearch()}
              onSearchPress={() => void performGlobalSearch()}
              placeholder={globalSearchLoading ? 'Đang tìm kiếm...' : 'Tìm sách, độc giả, phiếu...'}
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Tìm kiếm toàn cục"
              editable={!globalSearchLoading}
              containerStyle={styles.searchBox}
            />
            {!isMobile && <Text style={styles.date}>{dateLabel}</Text>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thông báo quá hạn"
              style={styles.notificationButton}
              onPress={() => router.push('/admin/borrow_cards')}>
              <Text style={styles.notificationIcon}>♧</Text>
              <View style={styles.notificationDot} />
            </Pressable>
            <Pressable style={styles.createButton} onPress={() => void openLoanDialog()}>
              <Text style={styles.createButtonText}>+ Tạo phiếu mượn</Text>
            </Pressable>
          </View>
          {globalSearchMessage && <Pressable style={styles.searchMessage} onPress={() => setGlobalSearchMessage(null)}><Text style={styles.searchMessageText}>{globalSearchMessage}</Text><Text style={styles.searchMessageDismiss}>×</Text></Pressable>}
          {isMobile && mobileMenuOpen && (
            <View style={styles.mobileMenu}>
              <Sidebar
                name={session?.full_name ?? 'Mai Linh'}
                renderNavigation={renderNavigation}
                compact
              />
            </View>
          )}
          {/* Các màn hình con dùng chung thanh công cụ và lớp vỏ này. */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="books_inventory" />
            <Stack.Screen name="borrow_cards" />
            <Stack.Screen name="reader_management" />
            <Stack.Screen name="fines" />
            <Stack.Screen name="librarians" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="settings" />
          </Stack>
        </View>
      </View>
      <Modal visible={createLoanOpen} transparent animationType="fade" onRequestClose={() => setCreateLoanOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Tạo phiếu mượn</Text>
            <Text style={styles.dialogHint}>Chọn độc giả và tối đa 10 bản sao đang có sẵn.</Text>
            {loanLoading ? <View style={styles.dialogLoading}><ActivityIndicator color="#FF9F43" /><Text style={styles.dialogHint}>Đang tải dữ liệu...</Text></View> : <>
              <Text style={styles.dialogLabel}>Độc giả</Text>
              <ScrollView style={styles.choiceList} nestedScrollEnabled>
                {loanReaders.length ? loanReaders.map((reader) => (
                  <Pressable key={reader._id} style={[styles.choice, selectedReaderId === reader._id && styles.choiceSelected]} onPress={() => setSelectedReaderId(reader._id)}>
                    <Text style={styles.choiceName}>{reader.full_name}</Text>
                    <Text style={styles.choiceMeta}>{reader.email ?? reader.phone ?? reader._id}</Text>
                  </Pressable>
                )) : <Text style={styles.dialogHint}>Không có độc giả đang hoạt động.</Text>}
              </ScrollView>
              <Text style={styles.dialogLabel}>Bản sao có sẵn ({selectedCopyIds.length}/10)</Text>
              <ScrollView style={styles.choiceList} nestedScrollEnabled>
                {availableCopies.length ? availableCopies.map((copy) => (
                  <Pressable key={copy.copyId} style={[styles.choice, selectedCopyIds.includes(copy.copyId) && styles.choiceSelected]} onPress={() => toggleCopy(copy.copyId)}>
                    <Text style={styles.choiceName}>{selectedCopyIds.includes(copy.copyId) ? '☑  ' : '□  '}{copy.bookTitle || 'Đầu sách'}</Text>
                    <Text style={styles.choiceMeta}>{copy.author || 'Tác giả'} · #{copy.copyId.slice(-8)}</Text>
                  </Pressable>
                )) : <Text style={styles.dialogHint}>Không có bản sao khả dụng.</Text>}
              </ScrollView>
              <Text style={styles.dialogLabel}>Hạn trả (YYYY-MM-DD)</Text>
              <TextInput value={dueDate} onChangeText={setDueDate} style={styles.dialogInput} placeholder="YYYY-MM-DD" />
            </>}
            {loanError && <Text style={styles.dialogError}>{loanError}</Text>}
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancel} onPress={() => setCreateLoanOpen(false)}><Text style={styles.dialogCancelText}>Hủy</Text></Pressable>
              <Pressable style={styles.dialogSubmit} disabled={loanSaving || loanLoading} onPress={() => void createLoan()}>
                {loanSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dialogSubmitText}>Tạo phiếu</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Sidebar tái sử dụng cho desktop và menu thu gọn trên thiết bị nhỏ.
function Sidebar({
  name,
  renderNavigation,
  compact = false,
}: {
  name: string;
  renderNavigation: (items: AdminNavigationItem[]) => ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}><Text style={styles.brandIconText}>▤</Text></View>
        <Text style={styles.brandName}>Readify</Text>
        <Text style={styles.brandCaption}>LIBRARY</Text>
      </View>
      <ScrollView contentContainerStyle={styles.navigationContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>VẬN HÀNH</Text>
        {renderNavigation(operations)}
        <Text style={[styles.groupLabel, styles.administrationLabel]}>QUẢN TRỊ</Text>
        {renderNavigation(administration)}
      </ScrollView>
      <View style={styles.account}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{name.trim().slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.accountCopy}>
          <Text numberOfLines={1} style={styles.accountName}>{name}</Text>
          <Text style={styles.accountMeta}>Librarian · Active</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tài khoản"
          onPress={() => Alert.alert('Tài khoản', `${name} | Librarian - Active`)}>
          <Text style={styles.accountMore}>···</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF3E0' },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA' },
  sidebar: {
    width: 260,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderRightWidth: 1,
    borderRightColor: '#F1D4B5',
  },
  sidebarCompact: { width: '100%', paddingTop: 12, paddingBottom: 12 },
  brand: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1D4B5',
  },
  brandIcon: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: '#E65100', fontSize: 20, fontWeight: '800' },
  brandName: { color: '#71370F', fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  brandCaption: { marginLeft: 'auto', color: '#A46B3D', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  navigationContent: { paddingTop: 23, paddingBottom: 18 },
  groupLabel: { color: '#A46B3D', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginHorizontal: 10, marginBottom: 9 },
  administrationLabel: { marginTop: 25 },
  navigationItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 11,
    marginBottom: 4,
    borderRadius: 6,
  },
  navigationItemActive: { backgroundColor: '#FF9F43' },
  navigationIcon: { width: 19, color: '#9A6A43', fontSize: 17, textAlign: 'center' },
  navigationIconActive: { color: '#FFFFFF' },
  navigationLabel: { color: '#76543C', fontSize: 14, fontWeight: '500' },
  navigationLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  activeMark: { width: 3, height: 22,   backgroundColor: '#E97824', borderRadius: 2, marginLeft: 'auto' },
  account: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1D4B5',
    paddingTop: 13,
    paddingHorizontal: 3,
  },
  avatar: { width: 35, height: 35, borderRadius: 2, backgroundColor: '#E97824', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  accountCopy: { flex: 1, minWidth: 0 },
  accountName: { color: '#71370F', fontSize: 12, fontWeight: '700' },
  accountMeta: { color: '#8B735E', fontSize: 10, marginTop: 3 },
  accountMore: { color: '#8B735E', fontSize: 20, paddingHorizontal: 4 },
  main: { flex: 1, minWidth: 0, backgroundColor: '#F8F9FA' },
  topbar: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 25,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBEF',
  },
  searchBox: {
    width: 330,
    maxWidth: '45%',
    minHeight: 38,
  },
  searchMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#FFF3E0', borderBottomWidth: 1, borderBottomColor: '#F1D4B5' },
  searchMessageText: { flex: 1, color: '#71370F', fontSize: 13 },
  searchMessageDismiss: { paddingHorizontal: 8, color: '#71370F', fontSize: 18 },
  date: { marginLeft: 'auto', color: '#64748B', fontSize: 14 },
  notificationButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
  notificationIcon: { color: '#64748B', fontSize: 17 },
  notificationDot: { position: 'absolute', right: 8, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9F43' },
  createButton: { minHeight: 36, justifyContent: 'center', backgroundColor: '#FF9F43', borderRadius: 4, paddingHorizontal: 13 },
  createButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  menuButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#FFF3E0' },
  menuButtonText: { color: '#E65100', fontSize: 17 },
  mobileMenu: { position: 'absolute', zIndex: 10, top: 68, left: 0, right: 0, backgroundColor: '#FFF3E0', elevation: 5 },
  dialogBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#0F172A88' },
  dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: 20, gap: 9, borderWidth: 1, borderColor: '#DCE2E9', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  dialogTitle: { color: '#1F2937', fontSize: 19, fontWeight: '800' },
  dialogHint: { color: '#718096', fontSize: 13, lineHeight: 18 },
  dialogLoading: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dialogLabel: { marginTop: 4, color: '#475569', fontSize: 13, fontWeight: '700' },
  choiceList: { maxHeight: 120, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2 },
  choice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  choiceSelected: { backgroundColor: '#FFF3E0' },
  choiceName: { color: '#334155', fontSize: 13, fontWeight: '600' },
  choiceMeta: { color: '#8290A0', fontSize: 11, marginTop: 2 },
  dialogInput: { height: 38, paddingHorizontal: 9, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, color: '#334155', fontSize: 13 },
  dialogError: { color: '#B42318', fontSize: 12 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 5 },
  dialogCancel: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4 },
  dialogCancelText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  dialogSubmit: { minWidth: 94, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 4, backgroundColor: '#FF9F43' },
  dialogSubmitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
