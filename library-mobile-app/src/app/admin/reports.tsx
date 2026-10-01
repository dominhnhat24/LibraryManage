// Báo cáo tổng hợp số liệu kho, độc giả, phiếu mượn và tiền phạt từ API dashboard.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminRequest } from '@/lib/admin-api';
import type { BookCopyStatus, BorrowCardStatus, FineStatus } from '@/types/library';

interface ReportData {
  books: number;
  readers: number;
  cards: number;
  fines: number;
  copies: { total: number; byStatus: Partial<Record<BookCopyStatus, number>> };
  borrowCards: { total: number; byStatus: Partial<Record<BorrowCardStatus, number>> };
  finesSummary: { total: number; totalAmount: number; byStatus: Partial<Record<FineStatus, { count: number; amount: number }>> };
}

// Màn hình báo cáo số lượng sách, độc giả, phiếu mượn và khoản phạt.
export default function AdminReportsScreen() {
  // Giữ snapshot thống kê để các mục và bộ đếm trạng thái cùng dùng một kết quả tải.
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    // Chuyển cấu trúc dashboard sang dạng báo cáo và luôn đóng trạng thái tải khi hoàn tất.
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const summary = await adminRequest<{
        books: number;
        readers: number;
        copies: ReportData['copies'];
        borrowCards: ReportData['borrowCards'];
        fines: ReportData['finesSummary'];
      }>('/dashboard');
      setData({
        books: summary.books,
        readers: summary.readers,
        cards: summary.borrowCards.total,
        fines: summary.fines.total,
        copies: summary.copies,
        borrowCards: summary.borrowCards,
        finesSummary: summary.fines,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải báo cáo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const copiesByStatus = (status: BookCopyStatus) => data?.copies.byStatus[status] ?? 0;
  const borrowedStatusCount = (status: BorrowCardStatus) => data?.borrowCards.byStatus[status] ?? 0;
  const fineAmount = data?.finesSummary.totalAmount ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#FF9F43']} />}>
      <View style={styles.header}><View><Text style={styles.title}>Báo cáo</Text><Text style={styles.subtitle}>Tổng hợp số liệu thực tế từ API</Text></View><Pressable style={styles.refresh} onPress={() => void load(true)}><Text style={styles.refreshText}>Làm mới</Text></Pressable></View>
      {error && <View style={styles.errorPanel}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>}
      {loading ? <View style={styles.state}><ActivityIndicator size="large" color="#FF9F43" /><Text style={styles.subtitle}>Đang tải báo cáo...</Text></View> : data ? <>
        <Text style={styles.section}>Tổng quan dữ liệu</Text>
        <View style={styles.metrics}>
          <ReportMetric label="Đầu sách" value={data.books} />
          <ReportMetric label="Độc giả" value={data.readers} />
          <ReportMetric label="Phiếu mượn" value={data.cards} />
          <ReportMetric label="Khoản phạt" value={data.fines} />
        </View>
        <Text style={styles.section}>Trạng thái bản sao</Text>
        <View style={styles.panel}>{(['Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'] as BookCopyStatus[]).map((status) => (
          <View style={styles.row} key={status}><Text style={styles.rowLabel}>{status}</Text><Text style={styles.rowValue}>{copiesByStatus(status).toLocaleString('vi-VN')}</Text></View>
        ))}</View>
        <Text style={styles.section}>Phiếu mượn theo trạng thái</Text>
        <View style={styles.panel}>{(['Pending', 'Borrowing', 'PartiallyReturned', 'Overdue', 'Returned', 'Cancelled'] as BorrowCardStatus[]).map((status) => (
          <View style={styles.row} key={status}><Text style={styles.rowLabel}>{status}</Text><Text style={styles.rowValue}>{borrowedStatusCount(status).toLocaleString('vi-VN')}</Text></View>
        ))}</View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Tổng tiền phạt</Text>
          <Text style={styles.money}>{fineAmount.toLocaleString('vi-VN')}đ</Text>
          <Text style={styles.disclaimer}>Tổng hợp toàn bộ khoản phạt từ cơ sở dữ liệu.</Text>
        </View>
      </> : null}
    </ScrollView>
  );
}

// Hiển thị một chỉ số tổng quan với định dạng số theo locale tiếng Việt.
function ReportMetric({ label, value }: { label: string; value: number }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value.toLocaleString('vi-VN')}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 24, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: '#1F2937', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 14, marginTop: 4 },
  refresh: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4 },
  refreshText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  section: { color: '#334155', fontSize: 16, fontWeight: '700', marginTop: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flex: 1, minWidth: 150, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  metricLabel: { color: '#718096', fontSize: 13 },
  metricValue: { color: '#1F2937', fontSize: 22, fontWeight: '800', marginTop: 8 },
  panel: { paddingHorizontal: 15, paddingVertical: 7, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  panelTitle: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 8 },
  row: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  rowLabel: { color: '#64748B', fontSize: 14 },
  rowValue: { color: '#334155', fontSize: 14, fontWeight: '700' },
  money: { color: '#B95D20', fontSize: 23, fontWeight: '800', marginTop: 6 },
  disclaimer: { color: '#8B96A3', fontSize: 12, marginTop: 4, marginBottom: 7 },
  state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  errorPanel: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#F2C5BE', borderRadius: 2, backgroundColor: '#FFF4F1' },
  errorText: { color: '#A94438', fontSize: 13 },
  retry: { color: '#B94E0C', fontSize: 13, fontWeight: '700' },
});
