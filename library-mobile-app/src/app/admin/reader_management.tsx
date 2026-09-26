import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { adminRequest } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import type { Reader, ReaderStatus } from '@/types/library';

interface ReaderForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

const emptyForm: ReaderForm = { full_name: '', email: '', password: '', phone: '', address: '' };

export default function ReaderManagementScreen() {
  const { action, search: searchParam } = useLocalSearchParams<{ action?: string; search?: string }>();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [query, setQuery] = useState(() => typeof searchParam === 'string' ? searchParam : '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Reader | null>(null);
  const [form, setForm] = useState<ReaderForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const loadReaders = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await adminRequest<{ data?: Reader[] } | Reader[]>('/readers?limit=100');
      setReaders(Array.isArray(response) ? response : response.data ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải độc giả.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadReaders(), 0);
    return () => clearTimeout(timer);
  }, [loadReaders]);

  useEffect(() => {
    if (action !== 'create') return;
    const timer = setTimeout(() => {
      setEditing(null);
      setForm(emptyForm);
      setModalVisible(true);
      router.setParams({ action: undefined });
    }, 0);
    return () => clearTimeout(timer);
  }, [action]);

  const filteredReaders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? readers.filter(
          (reader) =>
            reader.full_name.toLowerCase().includes(normalized) ||
            (reader.phone ?? '').toLowerCase().includes(normalized),
        )
      : readers;
  }, [query, readers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const saveReader = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên độc giả.');
      return;
    }
    if (!editing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Alert.alert('Email không hợp lệ', 'Backend yêu cầu email hợp lệ khi tạo độc giả.');
      return;
    }
    if (!editing && (form.password.length < 6 || form.password.length > 128)) {
      Alert.alert('Mật khẩu không hợp lệ', 'Mật khẩu phải dài từ 6 đến 128 ký tự.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        ...(!editing ? { password: form.password } : {}),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editing) {
        await adminRequest<Reader>(`/readers/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await adminRequest<Reader>('/readers', { method: 'POST', body: JSON.stringify(body) });
      }
      setModalVisible(false);
      setNotice(editing
        ? 'Đã cập nhật thông tin độc giả.'
        : `Đã tạo tài khoản. Mật khẩu đăng nhập: ${form.password}`);
      await loadReaders(true);
    } catch (requestError) {
      Alert.alert('Không thể lưu', requestError instanceof Error ? requestError.message : 'Đã xảy ra lỗi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (reader: Reader) => {
    const nextStatus: ReaderStatus = reader.status === 'Active' ? 'Blocked' : 'Active';
    setChangingStatusId(reader._id);
    setNotice(null);
    setError(null);
    try {
      await adminRequest<Reader>(`/readers/${reader._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      setReaders((current) => current.map((item) => item._id === reader._id ? { ...item, status: nextStatus } : item));
      setNotice(nextStatus === 'Blocked' ? `Đã khóa tài khoản ${reader.full_name}.` : `Đã mở khóa tài khoản ${reader.full_name}.`);
      void loadReaders(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái độc giả.');
    } finally {
      setChangingStatusId(null);
    }
  };

  const renderReader = ({ item }: { item: Reader }) => (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text></View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.secondary}>{item.phone || 'Chưa có số điện thoại'}</Text>
        <Text style={styles.secondary}>{item.email || 'Chưa có email'}</Text>
        <View style={styles.row}>
          <StatusBadge status={item.status} />
          <Pressable style={styles.smallButton} onPress={() => { setEditing(item); setForm({ full_name: item.full_name, email: item.email ?? '', password: '', phone: item.phone ?? '', address: item.address ?? '' }); setModalVisible(true); }}>
            <Text style={styles.smallButtonText}>Chỉnh sửa</Text>
          </Pressable>
          <Pressable disabled={changingStatusId === item._id} style={[styles.smallButton, item.status === 'Active' && styles.dangerButton]} onPress={() => void toggleStatus(item)}>
            {changingStatusId === item._id ? <ActivityIndicator size="small" color="#B94E0C" /> : <Text style={[styles.smallButtonText, item.status === 'Active' && styles.dangerText]}>{item.status === 'Active' ? 'Khóa' : 'Mở khóa'}</Text>}
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><View><Text style={styles.title}>Độc giả</Text><Text style={styles.subtitle}>{readers.length} tài khoản</Text></View><Pressable style={styles.primaryButton} onPress={openCreate}><Text style={styles.primaryText}>+ Thêm mới</Text></Pressable></View>
      <SearchBar value={query} onChangeText={setQuery} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Tìm theo tên hoặc số điện thoại" placeholderTextColor="#A18D7D" containerStyle={[styles.search, searchFocused && styles.searchFocused]} />
      {notice && <View style={styles.successBox}><Text selectable style={styles.successText}>{notice}</Text></View>}
      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => setError(null)}><Text style={styles.errorDismiss}>×</Text></Pressable></View>}
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#E97824" /><Text style={styles.secondary}>Đang tải danh sách...</Text></View> : error ? <StateView message={error} action="Thử lại" onAction={() => void loadReaders()} /> : filteredReaders.length === 0 ? <StateView message={query ? 'Không tìm thấy độc giả phù hợp.' : 'Chưa có độc giả nào.'} /> : <FlatList data={filteredReaders} keyExtractor={(item) => item._id} renderItem={renderReader} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadReaders(true)} colors={['#E97824']} />} />}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.modal}><Text style={styles.modalTitle}>{editing ? 'Chỉnh sửa độc giả' : 'Thêm độc giả'}</Text>
          {(['full_name', 'email', ...(!editing ? ['password' as const] : []), 'phone', 'address'] as const).map((field) => <TextInput key={field} value={form[field]} onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))} placeholder={{ full_name: 'Họ và tên *', email: 'Email *', password: 'Mật khẩu * (ít nhất 6 ký tự)', phone: 'Số điện thoại', address: 'Địa chỉ' }[field]} placeholderTextColor="#A18D7D" style={styles.input} secureTextEntry={field === 'password'} autoCapitalize={field === 'password' || field === 'email' ? 'none' : 'sentences'} keyboardType={field === 'phone' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'} />)}
          <View style={styles.row}><Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text>Hủy</Text></Pressable><Pressable style={styles.primaryButton} disabled={saving} onPress={() => void saveReader()}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu</Text>}</Pressable></View>
        </View></KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: ReaderStatus }) { return <View style={[styles.badge, status === 'Active' ? styles.greenBadge : styles.redBadge]}><Text style={styles.badgeText}>{status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}</Text></View>; }
function StateView({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) { return <View style={styles.center}><Text style={styles.empty}>{message}</Text>{action && onAction ? <Pressable style={styles.retry} onPress={onAction}><Text style={styles.primaryText}>{action}</Text></Pressable> : null}</View>; }

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignSelf: 'stretch', alignItems: 'stretch', backgroundColor: '#F8F9FA' }, header: { width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 28, fontWeight: '700', color: '#71370F' }, subtitle: { color: '#64748B', marginTop: 4, fontSize: 14 }, search: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#CBD5E1', color: '#334155', fontSize: 14, outlineWidth: 0 }, searchFocused: { borderColor: '#FF9F43', backgroundColor: '#FFFFFF' }, list: { width: '100%', alignSelf: 'stretch', padding: 20, paddingTop: 4, gap: 10 }, card: { backgroundColor: '#fff', borderRadius: 2, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }, avatar: { width: 42, height: 42, borderRadius: 2, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#E65100', fontWeight: '700', fontSize: 18 }, cardBody: { flex: 1, gap: 4 }, name: { fontSize: 16, fontWeight: '700', color: '#253243' }, secondary: { color: '#64748B', fontSize: 14 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }, badge: { borderRadius: 4, paddingHorizontal: 9, paddingVertical: 5 }, greenBadge: { backgroundColor: '#dff3e8' }, redBadge: { backgroundColor: '#fde4e4' }, badgeText: { fontSize: 13, fontWeight: '600', color: '#257451' }, smallButton: { minHeight: 30, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 9, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' }, smallButtonText: { color: '#B94E0C', fontSize: 13, fontWeight: '600' }, dangerButton: { borderColor: '#f3c7c7' }, dangerText: { color: '#bd4a4a' }, primaryButton: { backgroundColor: '#FF9F43', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 10, minWidth: 80, alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 }, empty: { color: '#64748B', textAlign: 'center', fontSize: 15 }, retry: { backgroundColor: '#FF9F43', borderRadius: 4, paddingHorizontal: 18, paddingVertical: 10 }, successBox: { marginHorizontal: 20, marginBottom: 8, padding: 10, borderWidth: 1, borderColor: '#B8DFC4', borderRadius: 2, backgroundColor: '#EAF6EE' }, successText: { color: '#277247', fontSize: 13, fontWeight: '600' }, errorBox: { marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderWidth: 1, borderColor: '#F2C5BE', borderRadius: 2, backgroundColor: '#FFF4F1' }, errorText: { color: '#A94438', flex: 1, fontSize: 13 }, errorDismiss: { color: '#A94438', fontSize: 20, paddingHorizontal: 8 }, modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#0F172A88' }, modal: { width: '100%', maxWidth: 500, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 2, padding: 20, gap: 12, elevation: 2 }, modalTitle: { color: '#253243', fontSize: 20, fontWeight: '700', marginBottom: 4 }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, padding: 12, color: '#334155', fontSize: 14, outlineWidth: 0 }, cancelButton: { borderRadius: 4, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1' },
});
