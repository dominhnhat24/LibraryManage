// Bảo vệ màn hình ứng dụng bằng phiên lưu cục bộ và giữ điều hướng theo hợp đồng mới.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments } from 'expo-router';

import { getSession } from '@/services/api';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const segmentKey = segments.join('/');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    void getSession().then((session) => {
      if (!active) return;
      const root = segmentKey.split('/')[0];
      const isAuth = root === 'auth';
      if (session && (isAuth || root === 'index')) router.replace('/catalog' as never);
      else if (!session && !isAuth) router.replace('/auth/login' as never);
      setCheckingAuth(false);
    }).catch(() => {
      if (!active) return;
      const root = segmentKey.split('/')[0];
      if (root !== 'auth') router.replace('/auth/login' as never);
      setCheckingAuth(false);
    });
    return () => { active = false; };
  }, [segmentKey]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {checkingAuth
        ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F1' }}><ActivityIndicator color="#C65D2E" size="large" /></View>
        : <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFF8F1' }, headerTintColor: '#71370F', headerStyle: { backgroundColor: '#FFF8F1' } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="catalog" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="books/[bookId]" options={{ title: 'Chi tiết sách' }} />
          <Stack.Screen name="books/[bookId]/read" options={{ title: 'Đọc sách' }} />
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
        </Stack>}
    </ThemeProvider>
  );
}
