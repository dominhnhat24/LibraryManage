// Hiển thị gói VIP tháng và trạng thái; đăng ký chỉ tạo yêu cầu chờ xử lý.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton, AppScreen, Notice, palette, ui } from '@/components/openbook-ui';
import { getSession, type AuthSession } from '@/services/api';
import { createMonthlySubscription, getMySubscription } from '@/services/openbook';
import type { Subscription } from '@/types/library';

export default function SubscriptionScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [user, current] = await Promise.all([getSession(), getMySubscription()]);
      setSession(user);
      setSubscription(current);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải trạng thái VIP.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const subscribe = async () => {
    setSubmitting(true);
    setNotice('');
    setError('');
    try {
      await createMonthlySubscription();
      await refresh();
      setNotice('Đã gửi yêu cầu đăng ký VIP tháng. Trạng thái đang chờ xác nhận; ứng dụng chưa thực hiện thanh toán.');
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : 'Không thể đăng ký gói VIP.');
    } finally {
      setSubmitting(false);
    }
  };

  const status = subscription?.status ?? 'Chưa đăng ký';
  const isPending = status.toLowerCase() === 'pending';
  const isActive = status.toLowerCase() === 'active';

  return (
    <AppScreen tab="subscription">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={ui.title}>Gói VIP</Text>
        <Text style={ui.subtitle}>Đọc và tải sách ngoại tuyến với quyền lợi VIP.</Text>
        {loading ? <ActivityIndicator color={palette.accent} style={styles.loader} /> : <>
          <View style={styles.plan}>
            <View style={styles.planBadge}><Text style={styles.planBadgeText}>OPENBOOK VIP</Text></View>
            <Text style={styles.planTitle}>Gói theo tháng</Text>
            <Text style={styles.planDescription}>Truy cập sách dành cho VIP và tải sách đọc ngoại tuyến sau khi gói được kích hoạt.</Text>
            <View style={styles.divider} />
            <Text style={styles.price}>Đăng ký theo tháng</Text>
            <Text style={styles.muted}>Thanh toán chưa được hỗ trợ trong ứng dụng.</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={ui.heading}>Trạng thái của bạn</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>{statusLabel(status)}</Text>
              <Text style={[styles.statusBadge, isActive ? styles.active : isPending ? styles.pending : styles.inactive]}>{status}</Text>
            </View>
            {subscription?.expiresAt ? <Text style={styles.muted}>Hết hạn: {new Date(subscription.expiresAt).toLocaleDateString('vi-VN')}</Text> : null}
            {session?.role === 'vip' && isActive ? <Text style={styles.activeMessage}>Quyền VIP đang hoạt động.</Text> : null}
          </View>
          {error ? <Notice error>{error}</Notice> : null}
          {notice ? <Notice>{notice}</Notice> : null}
          {!isActive && !isPending
            ? <ActionButton label={submitting ? 'Đang gửi yêu cầu…' : 'Đăng ký VIP tháng'} onPress={() => void subscribe()} disabled={submitting} />
            : null}
          {isPending ? <Notice>Đăng ký đang chờ xử lý. Quyền tải ngoại tuyến chỉ dùng được khi VIP đã hoạt động.</Notice> : null}
        </>}
      </ScrollView>
    </AppScreen>
  );
}

function statusLabel(status: string): string {
  const lower = status.toLowerCase();
  if (lower === 'active') return 'Đang hoạt động';
  if (lower === 'pending') return 'Chờ xác nhận';
  if (lower === 'expired') return 'Đã hết hạn';
  if (lower === 'cancelled' || lower === 'canceled') return 'Đã hủy';
  return 'Chưa có gói đăng ký';
}

const styles = StyleSheet.create({
  content: { padding: 21, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 35 },
  plan: { backgroundColor: '#3C2B23', borderRadius: 18, padding: 21, gap: 12 },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#E8BA80' },
  planBadgeText: { color: '#402619', fontSize: 10, letterSpacing: 1, fontWeight: '900' },
  planTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '800' },
  planDescription: { color: '#E9DDD5', fontSize: 14, lineHeight: 21 },
  divider: { height: 1, backgroundColor: '#72584A', marginVertical: 2 },
  price: { color: '#F4D9AC', fontSize: 18, fontWeight: '800' },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  statusCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF', gap: 11 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusText: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  statusBadge: { borderRadius: 18, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, color: palette.ink, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  active: { backgroundColor: '#DDF1E4', color: '#25634B' },
  pending: { backgroundColor: '#FFF0D6', color: '#8A5B16' },
  inactive: { backgroundColor: '#F1ECE7', color: palette.muted },
  activeMessage: { color: palette.green, fontSize: 13 },
});
