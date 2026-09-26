import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { adminRequest, formatDate } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Book, BookCopy, BorrowCard, BorrowCardStatus, Reader, ReturnCondition } from '@/types/library';

const tabs: (BorrowCardStatus | 'All')[] = ['All', 'Pending', 'Borrowing', 'PartiallyReturned', 'Overdue', 'Returned'];
const labels: Record<BorrowCardStatus | 'All', string> = {
  All: 'Tất cả',
  Pending: 'Chờ duyệt',
  Borrowing: 'Đang mượn',
  PartiallyReturned: 'Trả một phần',
  Overdue: 'Quá hạn',
  Returned: 'Đã trả',
  Cancelled: 'Đã hủy',
};
const conditions: ReturnCondition[] = ['Good', 'Damaged', 'Lost'];
const conditionLabels: Record<ReturnCondition, string> = { Good: 'Tốt', Damaged: 'Hỏng', Lost: 'Mất' };

interface BorrowCardResponse {
  data?: BorrowCard[];
}

function getId(value: string | BookCopy | Book | Reader | null | undefined): string {
  if (typeof value === 'string') return value;
  return value && typeof value === 'object' && typeof value._id === 'string' ? value._id : '';
}

function getBook(detail: BorrowCard['details'][number]): Book | null {
  if (!detail.bookId || typeof detail.bookId === 'string') return null;
  return typeof detail.bookId === 'object' && typeof detail.bookId.title === 'string' ? detail.bookId : null;
}

export default function BorrowCardsScreen() {
  const { search: searchParam } = useLocalSearchParams<{ search?: string }>();
  const [cards, setCards] = useState<BorrowCard[]>([]);
  const [tab, setTab] = useState<BorrowCardStatus | 'All'>('All');
  const [search, setSearch] = useState(() => typeof searchParam === 'string' ? searchParam : '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnCard, setReturnCard] = useState<BorrowCard | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [returnConditions, setReturnConditions] = useState<Record<string, ReturnCondition>>({});
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCards = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await adminRequest<BorrowCardResponse | BorrowCard[]>('/borrow-cards?limit=100');
      setCards(Array.isArray(response) ? response : response.data ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải phiếu mượn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadCards(), 0);
    return () => clearTimeout(timer);
  }, [loadCards]);

  const visibleCards = useMemo(
    () => cards.filter((card) => {
      const matchesTab = tab === 'All' || card.status === tab;
      const reader = typeof card.readerId === 'string' ? '' : card.readerId?.full_name ?? '';
      const books = (Array.isArray(card.details) ? card.details : []).map((detail) => getBook(detail)?.title ?? '').join(' ');
      const matchesSearch = !search.trim() || `${card._id} ${card.status} ${reader} ${books}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
      return matchesTab && matchesSearch;
    }),
    [cards, search, tab],
  );

  const approve = async (card: BorrowCard) => {
    setApprovingId(card._id);
    setNotice(null);
    try {
      await adminRequest(`/borrow-cards/${card._id}/approve`, { method: 'PATCH' });
      setCards((current) => current.map((item) => item._id === card._id ? { ...item, status: 'Borrowing' } : item));
      setNotice(`Đã duyệt phiếu #${card._id.slice(-8).toUpperCase()}.`);
      void loadCards(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể duyệt phiếu mượn.');
    } finally {
      setApprovingId(null);
    }
  };

  const openReturn = (card: BorrowCard) => {
    const unreturned = (Array.isArray(card.details) ? card.details : [])
      .filter((detail) => !detail.returnedAt && getId(detail.copyId));
    const defaults = Object.fromEntries(unreturned.map((detail) => [getId(detail.copyId), 'Good' as ReturnCondition]));
    setReturnCard(card);
    setSelectedIds(unreturned.map((detail) => getId(detail.copyId)));
    setReturnConditions(defaults);
  };

  const toggleCopy = (copyId: string) => {
    setSelectedIds((current) => current.includes(copyId)
      ? current.filter((id) => id !== copyId)
      : [...current, copyId]);
  };

  const submitReturn = async () => {
    if (!returnCard || selectedIds.length === 0) {
      setError('Chọn ít nhất một bản sao cần ghi nhận trả.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const returns = selectedIds.map((copyId) => ({
        copyId,
        condition: returnConditions[copyId] ?? 'Good',
      }));
      await adminRequest(`/borrow-cards/${returnCard._id}/return`, {
        method: 'PATCH',
        body: JSON.stringify({ returns }),
      });
      setReturnCard(null);
      await loadCards(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể ghi nhận trả sách.');
    } finally {
      setSubmitting(false);
    }
  };

  const readerName = (card: BorrowCard): string => {
    if (typeof card.readerId === 'string') return 'Độc giả';
    if (card.readerId && typeof card.readerId === 'object' && typeof card.readerId.full_name === 'string') {
      return card.readerId.full_name;
    }
    return 'Độc giả';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Phiếu mượn</Text><Text style={styles.subtitle}>{cards.length} phiếu trong hệ thống</Text></View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm mã phiếu, độc giả hoặc tên sách" containerStyle={styles.search} />
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={tabs} keyExtractor={(item) => item} style={styles.tabList} contentContainerStyle={styles.tabs} renderItem={({ item }) => <Pressable onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{labels[item]}</Text></Pressable>} />
      {notice && <View style={styles.successBox}><Text style={styles.successText}>{notice}</Text></View>}
      {error && !returnCard && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => setError(null)}><Text style={styles.dismiss}>×</Text></Pressable></View>}
      {loading ? <State message="Đang tải phiếu mượn..." loading /> : error && !cards.length ? <State message={error} action="Thử lại" onAction={() => void loadCards()} /> : visibleCards.length === 0 ? <State message={`Không có phiếu ở trạng thái ${labels[tab].toLowerCase()}.`} /> : <FlatList style={styles.cardsList} data={visibleCards} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadCards(true)} colors={['#e97824']} />} renderItem={({ item }) => <View style={styles.card}>
        <View style={styles.cardTop}><Text style={styles.code}>#{item._id.slice(-8).toUpperCase()}</Text><StatusBadge status={item.status} /></View>
        <Text style={styles.reader}>{readerName(item)}</Text>
        <Text style={styles.meta}>{(Array.isArray(item.details) ? item.details.length : 0)} cuốn sách · Mượn ngày {formatDate(item.borrowedAt)}</Text>
        <Text style={styles.due}>Hạn trả: {formatDate(item.dueDate)}</Text>
        <View style={styles.bookList}>{(Array.isArray(item.details) ? item.details : []).map((detail, index) => {
          const book = getBook(detail);
          const copyId = getId(detail.copyId);
          return <View key={copyId || `unknown-copy-${index}`} style={styles.bookLine}><Text style={styles.bookName}>{book?.title ?? (copyId ? `Bản sao ${copyId.slice(-8)}` : 'Sách trong phiếu')}</Text><Text style={detail.returnedAt ? styles.returnedText : styles.notReturnedText}>{detail.returnedAt ? 'Đã trả' : 'Chưa trả'}</Text></View>;
        })}</View>
        <View style={styles.actions}>
          {item.status === 'Pending' && <Pressable disabled={approvingId === item._id} style={styles.primaryButton} onPress={() => void approve(item)}>{approvingId === item._id ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Duyệt phiếu</Text>}</Pressable>}
          {['Borrowing', 'PartiallyReturned', 'Overdue'].includes(item.status) && <Pressable style={styles.outlineButton} onPress={() => openReturn(item)}><Text style={styles.outlineText}>Ghi nhận trả sách</Text></Pressable>}
        </View>
      </View>} />}

      <Modal visible={Boolean(returnCard)} transparent animationType="slide" onRequestClose={() => setReturnCard(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Ghi nhận trả sách</Text>
          <Text style={styles.modalSubtitle}>Chọn những cuốn được trả. Các cuốn còn lại tiếp tục mượn.</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList data={(Array.isArray(returnCard?.details) ? returnCard.details : []).filter((detail) => !detail.returnedAt && getId(detail.copyId))} keyExtractor={(detail) => getId(detail.copyId)} renderItem={({ item }) => {
            const copyId = getId(item.copyId);
            const book = getBook(item);
            const selected = selectedIds.includes(copyId);
            return <View style={styles.returnItem}>
              <Pressable style={styles.returnSelect} onPress={() => toggleCopy(copyId)}><View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected && <Text style={styles.checkmark}>✓</Text>}</View><View style={styles.returnBookInfo}><Text style={styles.bookName}>{book?.title ?? 'Sách trong phiếu'}</Text><Text style={styles.meta}>Bản sao {copyId.slice(-8).toUpperCase()}</Text></View></Pressable>
              {selected && <View style={styles.conditionRow}>{conditions.map((condition) => <Pressable key={condition} style={[styles.conditionButton, returnConditions[copyId] === condition && styles.conditionSelected]} onPress={() => setReturnConditions((current) => ({ ...current, [copyId]: condition }))}><Text style={[styles.conditionText, returnConditions[copyId] === condition && styles.conditionSelectedText]}>{conditionLabels[condition]}</Text></Pressable>)}</View>}
            </View>;
          }} />
          <View style={styles.modalActions}><Pressable style={styles.cancelButton} onPress={() => setReturnCard(null)}><Text style={styles.cancelText}>Hủy</Text></Pressable><Pressable disabled={submitting || selectedIds.length === 0} style={styles.primaryButton} onPress={() => void submitReturn()}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Xác nhận ({selectedIds.length})</Text>}</Pressable></View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: BorrowCardStatus }) {
  const color = status === 'Returned' ? styles.green : status === 'Overdue' ? styles.red : status === 'Pending' ? styles.orange : status === 'Cancelled' ? styles.gray : styles.blue;
  return <View style={[styles.badge, color]}><Text style={styles.badgeText}>{labels[status]}</Text></View>;
}

function State({ message, loading, action, onAction }: { message: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <View style={styles.center}>{loading && <ActivityIndicator size="large" color="#e97824" />}<Text style={styles.empty}>{message}</Text>{action && onAction && <Pressable style={styles.primaryButton} onPress={onAction}><Text style={styles.primaryText}>{action}</Text></Pressable>}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'stretch', alignItems: 'stretch', backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingBottom: 12 },
  search: { marginHorizontal: 20, marginBottom: 8 },
  title: { color: '#8f3d13', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#947b68', marginTop: 4 },
  tabList: { flexGrow: 0, height: 58 },
  tabs: { alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  tab: { borderRadius: 4, backgroundColor: '#FFF0DF', paddingHorizontal: 14, paddingVertical: 9 },
  activeTab: { backgroundColor: '#e97824' },
  tabText: { color: '#83583d', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  cardsList: { flex: 1, width: '100%', alignSelf: 'stretch' },
  list: { padding: 20, paddingTop: 4, gap: 12, width: '100%', alignSelf: 'stretch' },
  card: { backgroundColor: '#fff', borderRadius: 2, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#334155', shadowOpacity: 0.025, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { color: '#bd5b16', fontWeight: '800' },
  reader: { color: '#633617', fontWeight: '800', fontSize: 17 },
  meta: { color: '#947b68', fontSize: 12 },
  due: { color: '#bd5b16', fontWeight: '700', fontSize: 13 },
  bookList: { borderTopWidth: 1, borderTopColor: '#f2e9df', paddingTop: 7, gap: 6 },
  bookLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  bookName: { color: '#714526', fontSize: 13, fontWeight: '700', flex: 1 },
  returnedText: { color: '#27804f', fontSize: 11, fontWeight: '700' },
  notReturnedText: { color: '#ba5c1d', fontSize: 11, fontWeight: '700' },
  badge: { borderRadius: 2, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { color: '#65452f', fontSize: 11, fontWeight: '700' },
  green: { backgroundColor: '#e5f4e8' },
  red: { backgroundColor: '#fbe7e3' },
  orange: { backgroundColor: '#fff0df' },
  blue: { backgroundColor: '#e7eff4' },
  gray: { backgroundColor: '#eee8e2' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 3 },
  primaryButton: { backgroundColor: '#FF9F43', borderRadius: 4, paddingHorizontal: 13, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  outlineButton: { borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 4, paddingHorizontal: 13, paddingVertical: 8 },
  outlineText: { color: '#ad531a', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 28 },
  empty: { color: '#947b68', textAlign: 'center' },
  errorBox: { marginHorizontal: 20, backgroundColor: '#fff0ed', borderRadius: 2, padding: 10, flexDirection: 'row' },
  successBox: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#EAF6EE', borderRadius: 2, borderWidth: 1, borderColor: '#B8DFC4', padding: 10 },
  successText: { color: '#277247', fontSize: 13, fontWeight: '600' },
  errorText: { color: '#aa402b', flex: 1 },
  dismiss: { color: '#aa402b', fontSize: 20, paddingHorizontal: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#0F172A88' },
  modal: { width: '100%', maxWidth: 600, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, padding: 20, maxHeight: '88%', gap: 10, elevation: 2 },
  modalTitle: { color: '#71370f', fontSize: 21, fontWeight: '800' },
  modalSubtitle: { color: '#947b68', lineHeight: 19 },
  returnItem: { borderTopWidth: 1, borderTopColor: '#f0e4d8', paddingVertical: 10, gap: 8 },
  returnSelect: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 21, height: 21, borderWidth: 1, borderColor: '#cdb49c', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#e97824', borderColor: '#e97824' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  returnBookInfo: { flex: 1, gap: 3 },
  conditionRow: { flexDirection: 'row', gap: 7, paddingLeft: 31 },
  conditionButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 11, paddingVertical: 6 },
  conditionSelected: { borderColor: '#e97824', backgroundColor: '#fff0df' },
  conditionText: { color: '#76543c', fontSize: 12 },
  conditionSelectedText: { color: '#aa4b0c', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, paddingTop: 8 },
  cancelButton: { borderRadius: 4, paddingHorizontal: 15, paddingVertical: 9, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelText: { color: '#76543c', fontWeight: '700' },
});
