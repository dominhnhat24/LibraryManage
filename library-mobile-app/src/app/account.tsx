// Hồ sơ OpenBook đọc từ phiên đã đăng nhập và kết thúc phiên bằng thao tác đăng xuất.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, AppScreen, Notice, palette, ui } from '@/components/openbook-ui';
import { clearSession, getSession, type AuthSession } from '@/services/api';
import { getMySubscription } from '@/services/openbook';
import type { Subscription } from '@/types/library';

export default function AccountScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getSession(), getMySubscription()]).then(([user, current]) => {
      if (active) { setSession(user); setSubscription(current); }
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await clearSession();
    router.replace('/auth/login' as never);
  };

  return (
    <AppScreen tab="account">
      <View style={styles.content}>
        <Text style={ui.title}>Tài khoản</Text>
        <Text style={ui.subtitle}>Thông tin hồ sơ và trạng thái thành viên.</Text>
        {loading
          ? <ActivityIndicator color={palette.accent} style={styles.loader} />
          : <>
            <View style={styles.profile}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{session?.name?.charAt(0).toUpperCase() ?? '?'}</Text></View>
              <Text style={styles.name}>{session?.name ?? 'OpenBook'}</Text>
              <Text style={styles.email}>{session?.email}</Text>
              <Text style={styles.role}>{session?.role ?? 'free'}</Text>
              <View style={styles.line} />
              <Info label="Email" value={session?.email} />
              <Info label="Vai trò" value={roleLabel(session?.role)} />
              <Info label="VIP" value={subscription?.status ?? 'Chưa đăng ký'} />
            </View>
            <Pressable onPress={() => router.push('/subscription' as never)} style={styles.manage}>
              <Text style={styles.manageText}>Xem gói và trạng thái VIP ›</Text>
            </Pressable>
            {error ? <Notice error>{error}</Notice> : null}
            <ActionButton label={loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={() => void logout()} disabled={loggingOut} secondary />
          </>}
      </View>
    </AppScreen>
  );
}

function roleLabel(role?: AuthSession['role']): string {
  const labels = { free: 'Độc giả', vip: 'VIP', author: 'Tác giả', admin: 'Quản trị viên' };
  return role ? labels[role] : 'Độc giả';
}

function Info({ label, value }: { label: string; value?: string }) {
  return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 21, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 35 },
  profile: { alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF', padding: 20, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  avatarText: { color: palette.accent, fontSize: 29, fontWeight: '900' },
  name: { color: palette.ink, fontSize: 21, fontWeight: '800' },
  email: { color: palette.muted, fontSize: 13 },
  role: { color: palette.accent, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  line: { height: 1, alignSelf: 'stretch', backgroundColor: palette.border, marginVertical: 5 },
  info: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', gap: 10 },
  infoLabel: { color: palette.muted, fontSize: 13 },
  infoValue: { color: palette.ink, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  manage: { borderRadius: 11, borderWidth: 1, borderColor: palette.border, backgroundColor: '#FFFFFF', padding: 15 },
  manageText: { color: palette.accent, fontWeight: '800', fontSize: 14 },
});
