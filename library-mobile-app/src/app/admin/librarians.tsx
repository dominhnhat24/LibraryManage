import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminRequest } from '@/lib/admin-api';

interface Librarian {
  _id: string;
  user_name: string;
  email?: string;
  full_name: string;
  status: 'Active' | 'Blocked';
}
interface LibrarianPage { data?: Librarian[]; pagination?: { total?: number; totalItems?: number } }
interface LibrarianForm { user_name: string; full_name: string; email: string; password: string }
const blankForm: LibrarianForm = { user_name: '', full_name: '', email: '', password: '' };

export default function AdminLibrariansScreen() {
  const [items, setItems] = useState<Librarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LibrarianForm>(blankForm);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await adminRequest<LibrarianPage | Librarian[]>('/librarians?limit=100');
      setItems(Array.isArray(result) ? result : result.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách thủ thư.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const createLibrarian = async () => {
    if (form.user_name.trim().length < 3 || form.full_name.trim().length < 2 || form.password.length < 6) {
      setError('Tên đăng nhập cần ít nhất 3 ký tự, họ tên 2 ký tự và mật khẩu 6 ký tự.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminRequest('/librarians', {
        method: 'POST',
        body: JSON.stringify({
          user_name: form.user_name.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          password: form.password,
        }),
      });
      setVisible(false);
      setForm(blankForm);
      Alert.alert('Thành công', 'Đã tạo tài khoản thủ thư.');
      await load(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể tạo thủ thư.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Nhân viên</Text><Text style={styles.subtitle}>{items.length} tài khoản đã tải</Text></View>
        <Pressable style={styles.primary} onPress={() => { setForm(blankForm); setError(null); setVisible(true); }}><Text style={styles.primaryText}>+ Tạo thủ thư</Text></Pressable>
      </View>
      {error && !visible && <Text style={styles.error}>{error}</Text>}
      {loading ? <View style={styles.state}><ActivityIndicator color="#FF9F43" /><Text style={styles.stateText}>Đang tải nhân viên...</Text></View>
        : <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} colors={['#FF9F43']} />}
          ListEmptyComponent={<Text style={styles.empty}>{error ?? 'Chưa có tài khoản thủ thư.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.full_name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.copy}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.meta}>@{item.user_name} · {item.email || 'Chưa có email'}</Text>
              </View>
              <Text style={[styles.status, item.status === 'Active' ? styles.active : styles.blocked]}>{item.status}</Text>
            </View>
          )}
        />}
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Tạo tài khoản thủ thư</Text>
            <TextInput style={styles.input} placeholder="Tên đăng nhập *" value={form.user_name} autoCapitalize="none" onChangeText={(user_name) => setForm((value) => ({ ...value, user_name }))} />
            <TextInput style={styles.input} placeholder="Họ và tên *" value={form.full_name} onChangeText={(full_name) => setForm((value) => ({ ...value, full_name }))} />
            <TextInput style={styles.input} placeholder="Email (không bắt buộc)" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(email) => setForm((value) => ({ ...value, email }))} />
            <TextInput style={styles.input} placeholder="Mật khẩu * (ít nhất 6 ký tự)" secureTextEntry value={form.password} onChangeText={(password) => setForm((value) => ({ ...value, password }))} />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={() => setVisible(false)}><Text style={styles.cancelText}>Hủy</Text></Pressable>
              <Pressable style={styles.primary} disabled={saving} onPress={() => void createLibrarian()}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu thủ thư</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  title: { color: '#1F2937', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 24, gap: 9 },
  card: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E0', borderRadius: 2 },
  avatarText: { color: '#E65100', fontSize: 16, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: '#344256', fontSize: 15, fontWeight: '700' },
  meta: { color: '#788596', fontSize: 13, marginTop: 3 },
  status: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, fontSize: 11, fontWeight: '700' },
  active: { color: '#39784C', backgroundColor: '#E7F3E9' },
  blocked: { color: '#B7463C', backgroundColor: '#FCE9E6' },
  primary: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 4, backgroundColor: '#FF9F43' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { color: '#64748B', fontSize: 14 },
  empty: { padding: 28, color: '#64748B', fontSize: 14, textAlign: 'center' },
  error: { color: '#B42318', fontSize: 13, paddingHorizontal: 24, paddingBottom: 10 },
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#0F172A88' },
  modal: { width: '100%', maxWidth: 480, gap: 11, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, backgroundColor: '#FFFFFF', elevation: 2 },
  modalTitle: { color: '#253243', fontSize: 18, fontWeight: '800', marginBottom: 3 },
  input: { height: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, color: '#334155', fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 5 },
  cancel: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4 },
  cancelText: { color: '#536273', fontSize: 12, fontWeight: '600' },
});
