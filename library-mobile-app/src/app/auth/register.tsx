// Tạo tài khoản OpenBook theo hợp đồng name/email/password; backend gán vai trò mặc định.
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, ui } from '@/components/openbook-ui';
import { register } from '@/services/openbook';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password) { setError('Vui lòng điền đầy đủ thông tin.'); return; }
    setLoading(true);
    setError('');
    try {
      await register(cleanName, cleanEmail, password);
      router.replace('/catalog' as never);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Không thể tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.brand}>OpenBook</Text>
          <Text style={ui.title}>Tạo tài khoản</Text>
          <Text style={ui.subtitle}>Đăng ký để bắt đầu đọc và lưu sách yêu thích.</Text>
          <Text style={ui.fieldLabel}>Họ tên</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Tên của bạn" autoComplete="name" placeholderTextColor={palette.muted} style={ui.input} editable={!loading} />
          <Text style={ui.fieldLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="ten@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholderTextColor={palette.muted} style={ui.input} editable={!loading} />
          <Text style={ui.fieldLabel}>Mật khẩu</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="Tạo mật khẩu" secureTextEntry autoCapitalize="none" autoComplete="new-password" placeholderTextColor={palette.muted} style={ui.input} editable={!loading} onSubmitEditing={() => void submit()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={loading} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Đăng ký</Text>}
          </Pressable>
          <View style={styles.bottomRow}>
            <Text style={ui.muted}>Đã có tài khoản?</Text>
            <Pressable onPress={() => router.replace('/auth/login' as never)}><Text style={styles.link}>Đăng nhập</Text></Pressable>
          </View>
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
});
