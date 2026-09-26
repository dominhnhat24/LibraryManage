import { Stack } from 'expo-router';

export default function ReaderLayout() {
  return (
    <Stack>
      <Stack.Screen name="reader_search" options={{ title: 'Tra cứu sách' }} />
      <Stack.Screen name="reader_borrow_history" options={{ title: 'Lịch sử mượn' }} />
      <Stack.Screen name="reader_profile" options={{ title: 'Hồ sơ & tiền phạt' }} />
    </Stack>
  );
}
