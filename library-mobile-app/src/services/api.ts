// HTTP client dùng chung, giữ nguyên khả năng cấu hình URL từ môi trường.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError, create, type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';

function getDefaultApiBaseUrl(): string {
  if (Platform.OS === 'web') return 'http://localhost:5001/api/v1';
  if (Platform.OS === 'android' && !Device.isDevice) return 'http://10.0.2.2:5001/api/v1';
  if (Device.isDevice) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:5001/api/v1`;
  }
  return 'http://localhost:5001/api/v1';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiBaseUrl();
export const ACCESS_TOKEN_KEY = '@openbook/access_token';
export const USER_SESSION_KEY = '@openbook/user_session';

export type UserRole = 'free' | 'vip' | 'author' | 'admin';

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accessToken: string;
}

interface ApiErrorPayload {
  message?: string;
  errors?: { msg?: string; message?: string }[];
}

interface ApiEnvelope<T> {
  status?: string;
  message?: string;
  data: T;
}

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      await clearSession();
      if (!error.config?.url?.includes('/auth/')) router.replace('/auth/login');
    }
    return Promise.reject(new Error(getApiErrorMessage(error)));
  },
);

export function getApiErrorMessage(error: AxiosError<ApiErrorPayload>): string {
  if (!error.response) {
    const reason = error.code === 'ECONNABORTED'
      ? 'Yêu cầu đã hết thời gian chờ.'
      : Platform.OS === 'web'
        ? 'Kiểm tra CORS, firewall hoặc trạng thái backend.'
        : 'Kiểm tra backend, Wi-Fi và địa chỉ máy chủ.';
    return `Không thể kết nối đến ${API_BASE_URL}. ${reason} ${error.message}`;
  }
  const payload = error.response.data;
  const validation = payload?.errors?.find((item) => item.msg || item.message);
  return validation?.msg ?? validation?.message ?? payload?.message ?? `Máy chủ trả về lỗi ${error.response.status}.`;
}

export async function saveSession(session: AuthSession): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken),
    AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session)),
  ]);
}

export async function getSession(): Promise<AuthSession | null> {
  const [token, value] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(USER_SESSION_KEY),
  ]);
  if (!token || !value) return null;
  try {
    const session = JSON.parse(value) as AuthSession;
    return session.accessToken === token ? session : { ...session, accessToken: token };
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(USER_SESSION_KEY),
  ]);
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return response.data.data;
}
