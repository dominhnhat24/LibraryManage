// Chi tiết sách, lối vào trình đọc và thao tác tải ngoại tuyến dành riêng cho VIP.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionButton, Notice, palette, ui } from '@/components/openbook-ui';
import { getSession, type AuthSession } from '@/services/api';
import { downloadBook, getBook } from '@/services/openbook';
import type { Book } from '@/types/library';
import { getBookId } from '@/types/library';

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([getBook(bookId), getSession()]).then(([result, user]) => {
      if (active) { setBook(result); setSession(user); }
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải thông tin sách.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId]);

  const download = async () => {
    if (!book || !session || session.role !== 'vip') return;
    setDownloading(true);
    setNotice('');
    setError('');
    try {
      const savedPath = await downloadBook(getBookId(book), book.title, session.role);
      setNotice(`Đã tải sách để đọc ngoại tuyến: ${savedPath}`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Không thể tải sách.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.accent} size="large" /></View>;
  if (error && !book) return <View style={styles.center}><Notice error>{error}</Notice></View>;
  if (!book) return <View style={styles.center}><Text style={ui.muted}>Không tìm thấy sách.</Text></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.cover}><Text style={styles.coverMark}>O</Text></View>
      <Text style={styles.category}>{book.category ?? 'Sách số'}</Text>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>Tác giả: {book.author}</Text>
      {book.description ? <Text style={styles.description}>{book.description}</Text> : <Text style={ui.muted}>Chưa có mô tả cho cuốn sách này.</Text>}
      {error ? <Notice error>{error}</Notice> : null}
      {notice ? <Notice>{notice}</Notice> : null}
      <ActionButton label="Bắt đầu đọc" onPress={() => router.push({ pathname: '/books/[bookId]/read', params: { bookId } } as never)} />
      {session?.role === 'vip'
        ? <ActionButton label={downloading ? 'Đang tải…' : 'Tải để đọc ngoại tuyến'} onPress={() => void download()} disabled={downloading} secondary />
        : <Pressable onPress={() => router.push('/subscription' as never)} style={styles.vipPrompt}><Text style={styles.vipPromptTitle}>Tải sách ngoại tuyến với VIP</Text><Text style={ui.muted}>Xem gói VIP theo tháng và trạng thái đăng ký ›</Text></Pressable>}
      <View style={styles.details}>
        <Text style={ui.heading}>Thông tin sách</Text>
        <Info label="Tác giả" value={book.author} />
        <Info label="Thể loại" value={book.category} />
        <Info label="Ngôn ngữ" value={book.language} />
        <Info label="Xuất bản" value={book.publishedAt} />
      </View>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  content: { padding: 22, gap: 14, maxWidth: 620, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  cover: { width: 122, height: 156, borderRadius: 16, backgroundColor: '#F4DCC8', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 3 },
  coverMark: { color: palette.accent, fontSize: 64, fontWeight: '900' },
  category: { alignSelf: 'center', color: palette.accent, backgroundColor: palette.pale, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 16, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  title: { color: palette.ink, textAlign: 'center', fontSize: 25, fontWeight: '900', lineHeight: 32 },
  author: { color: palette.muted, textAlign: 'center', fontSize: 15 },
  description: { color: palette.ink, fontSize: 14, lineHeight: 22, marginTop: 5 },
  vipPrompt: { borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: '#FFFFFF', padding: 15, gap: 4 },
  vipPromptTitle: { color: palette.accent, fontWeight: '800', fontSize: 14 },
  details: { marginTop: 7, padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 9 },
  infoLabel: { color: palette.muted, fontSize: 13 },
  infoValue: { color: palette.ink, fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
});
