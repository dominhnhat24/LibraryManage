// Thành phần giao diện và thanh điều hướng tối giản dùng chung cho OpenBook.
import type { ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export const palette = {
  background: '#FFF8F1',
  card: '#FFFFFF',
  ink: '#402619',
  muted: '#8A7464',
  accent: '#C65D2E',
  border: '#EADBCB',
  pale: '#F6EADD',
  green: '#25634B',
  red: '#A43B36',
};

type AppTab = 'catalog' | 'subscription' | 'account';

export function AppNavigation({ active }: { active: AppTab }) {
  const tabs: { key: AppTab; label: string; route: string }[] = [
    { key: 'catalog', label: 'Khám phá', route: '/catalog' },
    { key: 'subscription', label: 'Gói VIP', route: '/subscription' },
    { key: 'account', label: 'Tài khoản', route: '/account' },
  ];
  return (
    <View style={styles.nav}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={() => router.replace(tab.route as never)} style={styles.navItem}>
          <Text style={[styles.navText, active === tab.key && styles.navActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function AppScreen({ children, tab }: { children: ReactNode; tab: AppTab }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>{children}</View>
      <AppNavigation active={tab} />
    </SafeAreaView>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}>
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <View style={[styles.notice, error && styles.noticeError]}><Text style={[styles.noticeText, error && styles.noticeErrorText]}>{children}</Text></View>;
}

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  title: { color: palette.ink, fontSize: 27, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },
  card: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 16 },
  heading: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  fieldLabel: { color: palette.ink, fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 14 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 13, color: palette.ink, fontSize: 15 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  body: { flex: 1 },
  nav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.card, paddingBottom: 5 },
  navItem: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  navText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  navActive: { color: palette.accent, fontWeight: '800' },
  button: { minHeight: 48, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  buttonSecondary: { backgroundColor: palette.pale, borderWidth: 1, borderColor: palette.border },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  buttonSecondaryText: { color: palette.accent },
  notice: { borderRadius: 10, padding: 12, backgroundColor: '#F0F5F1' },
  noticeError: { backgroundColor: '#FCEBE8' },
  noticeText: { color: palette.green, fontSize: 13, lineHeight: 19 },
  noticeErrorText: { color: palette.red },
});
