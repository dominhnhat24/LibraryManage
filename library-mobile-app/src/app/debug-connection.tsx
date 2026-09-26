import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AxiosError } from 'axios';

import { API_BASE_URL, api, type ApiErrorPayload } from '@/services/api';

interface BooksHealthResponse {
  status?: string;
  message?: string;
  data?: {
    data?: unknown[];
    pagination?: {
      totalItems?: number;
      total?: number;
    };
  };
}

interface HealthResult {
  success: boolean;
  statusCode?: number;
  message: string;
  checkedAt: string;
  data?: unknown;
}

export default function DebugConnectionScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await api.get<BooksHealthResponse>('/books?limit=1');
      const payload = response.data;
      const books = payload.data?.data ?? [];
      setResult({
        success: true,
        statusCode: response.status,
        message: 'Frontend đã kết nối Backend thành công.',
        checkedAt: new Date().toLocaleString('vi-VN'),
        data: {
          endpoint: '/books?limit=1',
          booksReturned: books.length,
          serverMessage: payload.message ?? payload.status ?? 'OK',
          sample: books[0] ?? null,
        },
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const statusCode = axiosError.response?.status;
      const responseMessage = axiosError.response?.data?.message;
      let message = 'Không thể kết nối tới Backend.';

      if (!axiosError.response) {
        message =
          'Network Error: không tìm thấy server. Hãy kiểm tra Backend đang chạy và API_BASE_URL có thể truy cập từ thiết bị.';
      } else if (statusCode === 404) {
        message = 'Backend đã phản hồi nhưng không tìm thấy endpoint /books.';
      } else if (statusCode === 401 || statusCode === 403) {
        message = `Backend yêu cầu quyền truy cập (${statusCode}).`;
      } else if (statusCode && statusCode >= 500) {
        message = `Backend gặp lỗi server (${statusCode}).`;
      } else if (responseMessage) {
        message = responseMessage;
      }

      setResult({
        success: false,
        statusCode,
        message,
        checkedAt: new Date().toLocaleString('vi-VN'),
        data: {
          endpoint: '/books?limit=1',
          errorName: axiosError.name,
          axiosMessage: axiosError.message,
          responseData: axiosError.response?.data ?? null,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Kiểm tra kết nối</Text>
        <Text style={styles.subtitle}>Health Check giữa ứng dụng và Backend</Text>

        <View style={styles.endpointCard}>
          <Text style={styles.label}>API Base URL</Text>
          <Text selectable style={styles.endpoint}>{API_BASE_URL}</Text>
          <Text style={styles.label}>Endpoint kiểm tra</Text>
          <Text selectable style={styles.endpoint}>GET /books?limit=1</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void checkConnection()}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kiểm tra kết nối Backend</Text>}
        </Pressable>

        {result && (
          <View style={[styles.resultCard, result.success ? styles.successCard : styles.failureCard]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, result.success ? styles.successText : styles.failureText]}>
                {result.success ? '✓ Thành công' : '✕ Thất bại'}
              </Text>
              {result.statusCode && <Text style={styles.statusCode}>HTTP {result.statusCode}</Text>}
            </View>
            <Text style={styles.message}>{result.message}</Text>
            <Text style={styles.checkedAt}>Kiểm tra lúc: {result.checkedAt}</Text>
            <Text selectable style={styles.json}>{JSON.stringify(result.data, null, 2)}</Text>
          </View>
        )}

        <Text style={styles.tip}>
          Nếu chạy trên Android Emulator, dùng 10.0.2.2 thay cho localhost. Với thiết bị thật,
          dùng địa chỉ IP LAN của máy chạy Backend và đảm bảo hai thiết bị cùng mạng.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F1' },
  container: { flexGrow: 1, padding: 20, gap: 16 },
  title: { color: '#71370F', fontSize: 28, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#947B68', fontSize: 15 },
  endpointCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#F2DFCC', padding: 16, gap: 6 },
  label: { color: '#7b8c9b', fontSize: 12, fontWeight: '700', marginTop: 3 },
  endpoint: { color: '#76543C', fontFamily: 'monospace', fontSize: 13, marginBottom: 5 },
  button: { alignItems: 'center', backgroundColor: '#E97824', borderRadius: 11, paddingHorizontal: 16, paddingVertical: 15 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  resultCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 9 },
  successCard: { backgroundColor: '#effaf3', borderColor: '#b9e4c8' },
  failureCard: { backgroundColor: '#fff2f2', borderColor: '#f2c4c4' },
  resultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resultTitle: { fontSize: 18, fontWeight: '800' },
  successText: { color: '#217346' },
  failureText: { color: '#b93636' },
  statusCode: { color: '#947B68', fontSize: 12, fontWeight: '700' },
  message: { color: '#633617', fontSize: 14, lineHeight: 20 },
  checkedAt: { color: '#7b8c9b', fontSize: 12 },
  json: { backgroundColor: '#ffffffb8', borderRadius: 8, color: '#76543C', fontFamily: 'monospace', fontSize: 12, padding: 10 },
  tip: { color: '#947B68', fontSize: 13, lineHeight: 20, marginTop: 'auto' },
});
