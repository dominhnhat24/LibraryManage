// Khai báo tiêu đề và ngăn xếp điều hướng cho các màn hình dành riêng cho độc giả.
import { Stack } from 'expo-router';

// Stack điều hướng các chức năng tra cứu, lịch sử mượn và hồ sơ độc giả.
export default function ReaderLayout() {
  // Router ánh xạ từng Screen tới tệp cùng tên trong thư mục reader.
  return (
    <Stack>
      <Stack.Screen name="reader_search" options={{ title: 'Tra cứu sách' }} />
      <Stack.Screen name="reader_borrow_history" options={{ title: 'Lịch sử mượn' }} />
      <Stack.Screen name="reader_profile" options={{ title: 'Hồ sơ & tiền phạt' }} />
    </Stack>
  );
}
