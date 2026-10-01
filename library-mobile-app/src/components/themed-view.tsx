// Thành phần View lấy màu nền từ chủ đề và cho phép ghi đè kiểu hiển thị.
import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

// View nền theo chủ đề, nhận thêm các thuộc tính bố cục chuẩn của React Native.
export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  // Áp dụng màu nền tương ứng với loại màu, sau đó ghép kiểu tùy chỉnh và các thuộc tính View.
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
