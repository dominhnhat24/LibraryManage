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
    const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (expoHost) return `http://${expoHost}:5001/api/v1`;
  }

  return 'http://localhost:5001/api/v1';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiBaseUrl();
export const ACCESS_TOKEN_KEY = '@library/access_token';
export const USER_SESSION_KEY = '@library/user_session';

export interface ApiErrorPayload {
  message?: string;
  errors?: { msg?: string; message?: string }[];
}

export interface AuthSession {
  id: string;
  full_name: string;
  email: string;
  role: 'reader' | 'librarian';
  accessToken: string;
}

export interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T;
}

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401) {
      await clearSession();
      if (!error.config?.url?.includes('/auth/login')) {
        router.replace('/auth/login');
      }
    }
    return Promise.reject(new Error(getApiErrorMessage(error)));
  },
);

export function getApiErrorMessage(error: AxiosError<ApiErrorPayload>): string {
  if (!error.response) {
    const reason = error.code === 'ECONNABORTED'
      ? 'Yêu cầu đã hết thời gian chờ.'
      : Platform.OS === 'web'
        ? 'Có thể do CORS, firewall hoặc backend chưa chạy.'
        : 'Kiểm tra Backend, kết nối Wi-Fi chung và cấu hình địa chỉ host.';
    return `Không thể kết nối đến ${API_BASE_URL}. ${reason} Chi tiết: ${error.message}.`;
  }
  const payload = error.response.data;
  const validationMessage = payload?.errors?.find((item) => item.msg || item.message);
  return validationMessage?.msg ?? validationMessage?.message ?? payload?.message ?? `Máy chủ trả về lỗi ${error.response.status}.`;
}

export async function saveSession(session: AuthSession): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken),
    AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session)),
  ]);
}

export async function getSession(): Promise<AuthSession | null> {
  const value = await AsyncStorage.getItem(USER_SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthSession;
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
  const response = await api.request<ApiResponse<T>>(config);
  return response.data.data;
}
