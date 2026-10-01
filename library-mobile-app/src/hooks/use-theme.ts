/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

// Trả về bảng màu sáng/tối tương ứng với chế độ hệ thống hiện tại.
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Hook lấy bảng màu đồng bộ với chế độ màu hiện tại.
export function useTheme() {
  // Dùng bảng màu sáng nếu chế độ màu chưa được xác định.
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}
