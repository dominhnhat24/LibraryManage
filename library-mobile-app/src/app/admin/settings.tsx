import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminRequest } from '@/lib/admin-api';

interface LibrarianProfile {
  _id: string;
  user_name: string;
  email?: string;
  full_name: string;
  status: 'Active' | 'Blocked';
}
interface ProfileForm { full_name: string; user_name: string; email: string }

export default function AdminSettingsScreen() {
  const [profile, setProfile] = useState<ProfileForm>({ full_name: '', user_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminRequest<LibrarianProfile>('/librarians/me');
      setProfile({ full_name: result.full_name ?? '', user_name: result.user_name ?? '', email: result.email ?? '' });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải hồ sơ thủ thư.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const save = async () => {
    if (profile.full_name.trim().length < 2 || profile.user_name.trim().length < 3) {
      setError('Họ tên phải có ít nhất 2 ký tự và username ít nhất 3 ký tự.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminRequest('/librarians/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          user_name: profile.user_name.trim(),
          ...(profile.email.trim() ? { email: profile.email.trim() } : {}),
        }),
      });
      Alert.alert('Đã lưu', 'Thông tin tài khoản được cập nhật.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cài đặt</Text>
      <Text style={styles.subtitle}>Thông tin tài khoản thủ thư</Text>
      {loading ? <View style={styles.loading}><ActivityIndicator color="#FF9F43" /><Text style={styles.subtitle}>Đang tải hồ sơ...</Text></View> : (
        <View style={styles.panel}>
          <Field label="Họ và tên" value={profile.full_name} onChange={(full_name) => setProfile((current) => ({ ...current, full_name }))} />
          <Field label="Tên đăng nhập" value={profile.user_name} onChange={(user_name) => setProfile((current) => ({ ...current, user_name }))} />
          <Field label="Email" value={profile.email} onChange={(email) => setProfile((current) => ({ ...current, email }))} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.button} disabled={saving} onPress={() => void save()}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Lưu thay đổi</Text>}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} style={styles.input} autoCapitalize="none" /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 24, gap: 7 },
  title: { color: '#1F2937', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 14, marginBottom: 9 },
  panel: { padding: 18, gap: 13, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  field: { gap: 6 },
  label: { color: '#475569', fontSize: 14, fontWeight: '600' },
  input: { height: 42, paddingHorizontal: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, color: '#334155', fontSize: 14 },
  button: { minHeight: 40, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 4, backgroundColor: '#FF9F43' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  error: { color: '#B42318', fontSize: 13 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
});
