// Điểm vào trình đọc dùng nội dung sách nếu API trả về, hoặc mở liên kết đọc hợp lệ.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Notice, palette } from '@/components/openbook-ui';
import { getBook } from '@/services/openbook';
import type { Book } from '@/types/library';

export default function ReadingEntryScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void getBook(bookId).then((result) => { if (active) setBook(result); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể mở sách.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={palette.accent} /></View>;
  if (error) return <View style={styles.center}><Notice error>{error}</Notice></View>;
  const content = book?.content ?? book?.body;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{book?.title ?? 'Trình đọc OpenBook'}</Text>
      <Text style={styles.author}>{book?.author}</Text>
      {content
        ? <Text style={styles.text}>{content}</Text>
        : book?.fileUrl
          ? <Pressable onPress={() => void Linking.openURL(book.fileUrl!)} style={styles.link}><Text style={styles.linkText}>Mở nội dung sách ›</Text></Pressable>
          : <Notice>Nội dung đọc chưa được cung cấp cho sách này. Hãy quay lại chi tiết sách để xem thông tin hoặc tải sách nếu bạn có VIP.</Notice>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFCF8' },
  content: { paddingHorizontal: 22, paddingVertical: 30, maxWidth: 720, width: '100%', alignSelf: 'center', gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: palette.ink, fontSize: 23, fontWeight: '800', lineHeight: 31 },
  author: { color: palette.muted, fontSize: 14, marginBottom: 12 },
  text: { color: '#352B24', fontSize: 17, lineHeight: 29 },
  link: { backgroundColor: palette.pale, borderRadius: 10, padding: 15 },
  linkText: { color: palette.accent, fontWeight: '800' },
});
