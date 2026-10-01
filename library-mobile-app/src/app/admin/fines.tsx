// Danh sách tiền phạt hỗ trợ lọc, tìm kiếm và ghi nhận thanh toán hoặc miễn phạt.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { adminRequest } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Fine, FineStatus } from '@/types/library';

interface FinePage { data?: Fine[]; pagination?: { total?: number; totalItems?: number } }
type FineFilter = 'All' | FineStatus;

const filters: FineFilter[] = ['All', 'Pending', 'Paid', 'Waived'];

// Trả về tên độc giả khi tham chiếu đã populate, nếu không dùng nhãn chung.
function getReaderName(reader: Fine['readerId'] | null): string {
  if (typeof reader === 'string') return 'Độc giả';
  return reader?.full_name ?? 'Độc giả';
}

// Lấy mã phiếu từ chuỗi ID hoặc đối tượng đã populate.
function getBorrowCardId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value && typeof value._id === 'string') return value._id;
  return '';
}

// Màn hình tra cứu và xử lý khoản phạt đang chờ thanh toán.
export default function AdminFinesScreen() {
  // Đồng bộ bộ lọc trạng thái với truy vấn API và giữ riêng từ khóa tìm kiếm cục bộ.
  const { search: searchParam } = useLocalSearchParams<{ search?: string }>();
  const [fines, setFines] = useState<Fine[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FineFilter>('All');
  const [search, setSearch] = useState(() => typeof searchParam === 'string' ? searchParam : '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    // Tải các khoản phạt của trạng thái đã chọn và giữ tổng số từ phân trang của API.
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await adminRequest<FinePage | Fine[]>(`/fines?limit=100${filter === 'All' ? '' : `&status=${filter}`}`);
      const items = Array.isArray(response) ? response : response.data ?? [];
      setFines(items);
      setTotal(Array.isArray(response) ? items.length : response.pagination?.totalItems ?? response.pagination?.total ?? items.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải tiền phạt.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Áp dụng truy vấn trên mã phạt, lý do, trạng thái, độc giả và mã phiếu.
  const visibleFines = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return fines.filter((fine) => {
      const borrowCardId = getBorrowCardId(fine.borrowCardId);
      const matchesSearch = !normalized || `${fine._id} ${fine.reason} ${fine.status} ${getReaderName(fine.readerId)} ${borrowCardId}`.toLocaleLowerCase().includes(normalized);
      return matchesSearch && (filter === 'All' || fine.status === filter);
    });
  }, [filter, fines, search]);

  const changeStatus = (fine: Fine, action: 'pay' | 'waive') => {
    // Yêu cầu xác nhận trước thao tác không thể đảo ngược rồi tải lại danh sách sau cập nhật.
    const title = action === 'pay' ? 'Xác nhận đã thanh toán khoản phạt?' : 'Miễn khoản phạt này?';
    Alert.alert(title, `${fine.amount.toLocaleString('vi-VN')}đ · ${fine.reason}`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: async () => {
        try {
          await adminRequest(`/fines/${fine._id}/${action}`, {
            method: 'PATCH',
            ...(action === 'waive' ? { body: JSON.stringify({ waiverReason: 'Miễn phạt theo quyết định thủ thư' }) } : {}),
          });
          await load(true);
        } catch (actionError) {
          Alert.alert('Không thể cập nhật', actionError instanceof Error ? actionError.message : 'Đã xảy ra lỗi.');
        }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Tiền phạt</Text><Text style={styles.subtitle}>{total.toLocaleString('vi-VN')} khoản theo API</Text></View>
      </View>
      <View style={styles.filters}>{filters.map((item) => (
        <Pressable key={item} style={[styles.filter, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
          <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'All' ? 'Tất cả' : item}</Text>
        </Pressable>
      ))}</View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm độc giả, mã phiếu hoặc lý do phạt" containerStyle={styles.search} />
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? <View style={styles.state}><ActivityIndicator color="#FF9F43" /><Text style={styles.stateText}>Đang tải tiền phạt...</Text></View>
        : error && fines.length === 0 ? <View style={styles.state}><Text style={styles.stateText}>{error}</Text><Pressable style={styles.primary} onPress={() => void load()}><Text style={styles.primaryText}>Thử lại</Text></Pressable></View>
        : <FlatList
          data={visibleFines}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#FF9F43']} />}
          ListEmptyComponent={<Text style={styles.empty}>{error ? 'Không thể tải danh sách.' : search ? 'Không tìm thấy khoản phạt phù hợp.' : 'Không có khoản phạt.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.amount}>{item.amount.toLocaleString('vi-VN')}đ</Text>
                <View style={[styles.badge, item.status === 'Paid' ? styles.paid : item.status === 'Pending' ? styles.pending : styles.waived]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.reader}>{getReaderName(item.readerId)}</Text>
              <Text style={styles.meta}>{item.reason} · Phiếu #{getBorrowCardId(item.borrowCardId).slice(-8).toUpperCase() || 'N/A'}</Text>
              {item.status === 'Pending' && <View style={styles.actions}>
                <Pressable style={styles.primary} onPress={() => changeStatus(item, 'pay')}><Text style={styles.primaryText}>Ghi nhận đã thu</Text></Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => changeStatus(item, 'waive')}><Text style={styles.secondaryText}>Miễn phạt</Text></Pressable>
              </View>}
            </View>
          )}
        />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 14 },
  title: { color: '#1F2937', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 14, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 12 },
  search: { marginHorizontal: 24, marginBottom: 12 },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, backgroundColor: '#FFFFFF' },
  filterActive: { borderColor: '#FF9F43', backgroundColor: '#FFF3E0' },
  filterText: { color: '#64748B', fontSize: 13 },
  filterTextActive: { color: '#B94E0C', fontWeight: '700' },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 10 },
  card: { padding: 15, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { color: '#253243', fontSize: 18, fontWeight: '800' },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  paid: { backgroundColor: '#E7F3E9' },
  pending: { backgroundColor: '#FFF3E0' },
  waived: { backgroundColor: '#EEF0F3' },
  badgeText: { color: '#536273', fontSize: 11, fontWeight: '700' },
  reader: { color: '#334155', fontSize: 15, fontWeight: '700' },
  meta: { color: '#7B8794', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 5 },
  primary: { backgroundColor: '#FF9F43', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  secondaryButton: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4 },
  secondaryText: { color: '#596779', fontSize: 12, fontWeight: '600' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { color: '#64748B', fontSize: 14 },
  empty: { padding: 28, color: '#64748B', fontSize: 14, textAlign: 'center' },
  error: { paddingHorizontal: 24, paddingBottom: 10, color: '#B42318', fontSize: 13 },
});
