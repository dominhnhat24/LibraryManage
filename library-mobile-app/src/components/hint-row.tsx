// Hiển thị một hàng gợi ý gồm nhãn và nội dung dạng đoạn mã có thể tùy chỉnh.
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

// Hàng gợi ý có tiêu đề tùy chọn và nội dung ReactNode ở dạng nhấn mạnh.
export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  // Dùng màu và kiểu chữ theo chủ đề để phân biệt gợi ý với nội dung thông thường.
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
