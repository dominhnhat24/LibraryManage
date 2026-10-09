// Đăng nhập OpenBook bằng email và mật khẩu, sau đó mở danh mục theo mọi vai trò.
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/services/openbook';
import { palette, ui } from '@/components/openbook-ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { setError('Nhập email và mật khẩu để tiếp tục.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(cleanEmail, password);
      router.replace('/catalog' as never);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.brand}>OpenBook</Text>
          <Text style={ui.title}>Chào mừng trở lại</Text>
          <Text style={ui.subtitle}>Đăng nhập để tiếp tục khám phá thư viện số.</Text>
          <Text style={ui.fieldLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="ten@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholderTextColor={palette.muted} style={ui.input} editable={!loading} />
          <Text style={ui.fieldLabel}>Mật khẩu</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry autoCapitalize="none" autoComplete="password" placeholderTextColor={palette.muted} style={ui.input} editable={!loading} onSubmitEditing={() => void submit()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={loading} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
          </Pressable>
          <View style={styles.bottomRow}>
            <Text style={ui.muted}>Chưa có tài khoản?</Text>
            <Pressable onPress={() => router.push('/auth/register' as never)}><Text style={styles.link}>Đăng ký</Text></Pressable>
          </View>
          <Text style={styles.roles}>Dành cho độc giả, VIP, tác giả và quản trị viên.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, justifyContent: 'center', padding: 22, width: '100%', maxWidth: 520, alignSelf: 'center' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border, borderRadius: 18, padding: 24 },
  brand: { color: palette.accent, fontSize: 20, fontWeight: '900', marginBottom: 18 },
  error: { color: palette.red, fontSize: 13, lineHeight: 19, marginTop: 12 },
  button: { minHeight: 49, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 19 },
  link: { color: palette.accent, fontWeight: '800' },
  roles: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 17 },
});
