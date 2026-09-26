import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { readerRequest } from '@/lib/admin-api';
import type { Fine, FineReason, FineStatus, Reader } from '@/types/library';

interface FineResponse { data: Fine[] }
const reasonLabels: Record<FineReason, string> = { Overdue: 'Quá hạn', Damaged: 'Làm hỏng sách', Lost: 'Mất sách' };
const statusLabels: Record<FineStatus, string> = { Pending: 'Chưa thanh toán', Paid: 'Đã thanh toán', Waived: 'Đã miễn' };

function borrowCardId(value: Fine['borrowCardId']): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value && typeof value._id === 'string') return value._id;
  return '';
}

export default function ReaderProfileScreen() {
  const [reader, setReader] = useState<Reader | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true); setError(null);
    try {
      const [profile, fineResponse] = await Promise.all([readerRequest<Reader>('/readers/me'), readerRequest<FineResponse | Fine[]>('/fines?limit=100')]);
      setReader(profile); setFines(Array.isArray(fineResponse) ? fineResponse : fineResponse.data);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Không thể tải hồ sơ.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  if (loading) return <SafeAreaView style={styles.container}><State message="Đang tải hồ sơ..." loading /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.container}><State message={error} action="Thử lại" onAction={() => void load()} /></SafeAreaView>;
  return <SafeAreaView style={styles.container}><FlatList data={fines} keyExtractor={(item) => item._id} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#E97824']} />} ListHeaderComponent={<><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{reader?.full_name.charAt(0).toUpperCase() ?? '?'}</Text></View><Text style={styles.name}>{reader?.full_name ?? 'Độc giả'}</Text><View style={styles.active}><Text style={styles.activeText}>{reader?.status === 'Active' ? 'Tài khoản hoạt động' : 'Tài khoản bị khóa'}</Text></View><Info label="Email" value={reader?.email} /><Info label="Số điện thoại" value={reader?.phone} /><Info label="Địa chỉ" value={reader?.address} /></View><View style={styles.fineHeader}><Text style={styles.sectionTitle}>Tiền phạt của tôi</Text><Text style={styles.subtitle}>{fines.length} khoản phạt</Text></View></>} renderItem={({ item }) => <View style={styles.fine}><View style={styles.fineTop}><Text style={styles.reason}>{reasonLabels[item.reason]}</Text>  <FineStatusBadge status={item.status} /></View><Text style={styles.amount}>{item.amount.toLocaleString('vi-VN')} đ</Text><Text style={styles.meta}>Mã phiếu: {borrowCardId(item.borrowCardId) || 'N/A'}</Text></View>} ListEmptyComponent={<Text style={styles.empty}>Bạn không có khoản phạt nào.</Text>} /></SafeAreaView>;
}
function Info({ label, value }: { label: string; value?: string }) { return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text></View>; }
function FineStatusBadge({ status }: { status: FineStatus }) { return <View style={[styles.fineBadge, status === 'Pending' ? styles.pending : styles.paid]}><Text style={styles.fineBadgeText}>{statusLabels[status]}</Text></View>; }
function State({ message, loading, action, onAction }: { message: string; loading?: boolean; action?: string; onAction?: () => void }) { return <View style={styles.center}>{loading && <ActivityIndicator size="large" color="#E97824" />}<Text style={styles.empty}>{message}</Text>{action && onAction && <Text style={styles.retry} onPress={onAction}>{action}</Text>}</View>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFF8F1' }, content: { padding: 20, gap: 12 }, profile: { backgroundColor: '#fff', borderRadius: 18, padding: 20, alignItems: 'center', gap: 8, elevation: 2 }, avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#dff3e8', justifyContent: 'center', alignItems: 'center', marginBottom: 3 }, avatarText: { color: '#E97824', fontSize: 30, fontWeight: '700' }, name: { color: '#71370F', fontSize: 22, fontWeight: '700' }, active: { backgroundColor: '#dff3e8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 7 }, activeText: { color: '#E97824', fontSize: 12, fontWeight: '700' }, info: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: '#F2E9DF', paddingTop: 9, gap: 2 }, label: { color: '#8a9690', fontSize: 11 }, infoValue: { color: '#714526', fontSize: 14 }, fineHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }, sectionTitle: { color: '#71370F', fontSize: 19, fontWeight: '700' }, subtitle: { color: '#947B68', fontSize: 12 }, fine: { backgroundColor: '#fff', borderRadius: 15, padding: 16, gap: 6, elevation: 1 }, fineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reason: { color: '#633617', fontWeight: '700', fontSize: 15 }, fineBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }, pending: { backgroundColor: '#FFF0DF' }, paid: { backgroundColor: '#dff3e8' }, fineBadgeText: { color: '#52645b', fontSize: 11, fontWeight: '700' }, amount: { color: '#bd4a4a', fontSize: 20, fontWeight: '700' }, meta: { color: '#947B68', fontSize: 12 }, empty: { color: '#947B68', textAlign: 'center' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 28 }, retry: { color: '#E97824', fontWeight: '700' } });
