// Màn hình xác thực dùng chung cho độc giả và thủ thư, lưu phiên rồi chuyển theo vai trò.
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AxiosError } from 'axios';

import { request, saveSession, type AuthSession } from '@/services/api';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  id: string;
  full_name: string;
  email: string;
  role: 'reader' | 'librarian';
  accessToken: string;
}

// Màn hình đăng nhập lưu phiên thành công và điều hướng theo vai trò người dùng.
export default function LoginScreen() {
  // Giữ thông tin nhập, trạng thái gửi, lỗi hiển thị và tùy chọn che mật khẩu.
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secure, setSecure] = useState(true);

  const login = async () => {
    // Chuẩn hóa email và dừng sớm nếu thiếu dữ liệu bắt buộc.
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Lưu phiên trả về trước khi rời màn hình để các route được bảo vệ đọc được quyền truy cập.
      const response = await request<LoginResponse>({ url: '/auth/login', method: 'POST', data: { email, password: form.password } });
      const session: AuthSession = response;
      await saveSession(session);
      router.replace(session.role === 'librarian' ? '/admin/dashboard' : '/reader/reader_search');
    } catch (loginError) {
      const message = loginError instanceof AxiosError ? loginError.message : loginError instanceof Error ? loginError.message : 'Đăng nhập thất bại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>▤</Text></View><Text style={styles.brandName}>Readify</Text><Text style={styles.tagline}>Quản lý thư viện đơn giản hơn</Text></View>
        <View style={styles.card}>
          <Text style={styles.title}>Chào mừng trở lại</Text><Text style={styles.subtitle}>Đăng nhập để tiếp tục sử dụng thư viện</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} placeholder="you@example.com" placeholderTextColor="#A18D7D" autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={styles.input} editable={!loading} />
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordWrap}><TextInput value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} placeholder="Nhập mật khẩu" placeholderTextColor="#A18D7D" secureTextEntry={secure} style={styles.passwordInput} editable={!loading} /><Pressable onPress={() => setSecure((value) => !value)}><Text style={styles.show}>{secure ? 'Hiện' : 'Ẩn'}</Text></Pressable></View>
          {/* Lỗi đăng nhập chỉ hiển thị khi có nội dung lỗi từ kiểm tra hoặc API. */}
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={() => void login()} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}</Pressable>
          <Text style={styles.help}>Độc giả và thủ thư đăng nhập bằng tài khoản do thư viện cấp</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F1' },
  container: { flex: 1, justifyContent: 'center', padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 64, height: 64, borderRadius: 2, backgroundColor: '#E97824', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 35 },
  brandName: { color: '#71370F', fontSize: 27, fontWeight: '800' },
  tagline: { color: '#947B68', marginTop: 5, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 2, padding: 24, borderWidth: 1, borderColor: '#F2DFCC', shadowColor: '#71370F', shadowOpacity: 0.035, shadowRadius: 5, elevation: 2 },
  title: { color: '#71370F', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#947B68', marginTop: 7, marginBottom: 24, lineHeight: 20 },
  label: { color: '#76543C', fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#EAD7C4', borderRadius: 4, color: '#71370F', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, backgroundColor: '#FFFFFF' },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EAD7C4', borderRadius: 4, backgroundColor: '#FFFFFF' },
  passwordInput: { flex: 1, color: '#71370F', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  show: { color: '#E97824', fontWeight: '700', paddingHorizontal: 14 },
  errorBox: { backgroundColor: '#fff0f0', borderRadius: 2, padding: 11, marginTop: 16, borderWidth: 1, borderColor: '#ffd1d1' },
  errorText: { color: '#b93636', fontSize: 13, lineHeight: 18 },
  button: { backgroundColor: '#E97824', borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  help: { color: '#947B68', fontSize: 12, textAlign: 'center', marginTop: 18 },
});
