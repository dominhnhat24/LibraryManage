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
    const guard = async () => {
      const session = await getSession();
      if (!active) return;
      const root = segmentKey.split('/')[0];
      if ((root === 'admin' || root === 'reader') && !session) {
        router.replace('/auth/login');
      } else if (root === 'admin' && session?.role !== 'librarian') {
        router.replace('/reader/reader_search');
      } else if (root === 'reader' && session?.role !== 'reader') {
        router.replace('/admin/dashboard');
      } else if (root === 'auth' && session) {
        router.replace(session.role === 'librarian' ? '/admin/dashboard' : '/reader/reader_search');
      }
      setCheckingAuth(false);
    };
    void guard().catch(() => {
      if (active) {
        const root = segmentKey.split('/')[0];
        if (root === 'admin' || root === 'reader') router.replace('/auth/login');
        setCheckingAuth(false);
      }
    });
    return () => { active = false; };
  }, [segmentKey]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {checkingAuth
        ? <View style={{ flex: 1, backgroundColor: '#FFF8F1', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#E97824" /></View>
        : <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFF8F1' }, headerTintColor: '#8F3D13', headerStyle: { backgroundColor: '#FFF8F1' } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="debug-connection" options={{ title: 'Kiểm tra kết nối' }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="reader" options={{ headerShown: false }} />
        </Stack>}
    </ThemeProvider>
  );
}
