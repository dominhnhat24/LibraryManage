// Cấu hình HTTP dùng chung, lưu phiên đăng nhập cục bộ và chuẩn hóa lỗi API.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError, create, type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';

// Tính URL Backend mặc định theo thiết bị; biến môi trường công khai có thể ghi đè kết quả này.
function getDefaultApiBaseUrl(): string {
  // Chọn host truy cập được theo nền tảng: localhost trên web, alias emulator trên Android,
  // hoặc host Expo hiện tại cho thiết bị thật.
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
  // Gắn access token đã lưu vào mọi yêu cầu có phiên hợp lệ.
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    // Phiên hết hạn được xóa; chỉ điều hướng về đăng nhập nếu lỗi không phát sinh từ chính thao tác login.
    if (error.response?.status === 401) {
      await clearSession();
      if (!error.config?.url?.includes('/auth/login')) {
        router.replace('/auth/login');
      }
    }
    return Promise.reject(new Error(getApiErrorMessage(error)));
  },
);

// Chuyển lỗi mạng, lỗi xác thực dữ liệu và thông báo máy chủ thành nội dung có thể đọc.
export function getApiErrorMessage(error: AxiosError<ApiErrorPayload>): string {
  // Chuyển lỗi mạng, lỗi xác thực dữ liệu và thông báo máy chủ thành nội dung có thể đọc.
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

// Lưu token và hồ sơ để interceptor cùng guard định tuyến có thể khôi phục phiên.
export async function saveSession(session: AuthSession): Promise<void> {
  // Lưu token riêng cho interceptor và toàn bộ hồ sơ để khôi phục phiên sau khi mở ứng dụng.
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken),
    AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session)),
  ]);
}

// Đọc phiên đã lưu; JSON không hợp lệ sẽ bị xóa để tránh giữ trạng thái đăng nhập hỏng.
export async function getSession(): Promise<AuthSession | null> {
  // Đọc phiên đã lưu; dữ liệu JSON hỏng sẽ bị xóa để không giữ một phiên không hợp lệ.
  const value = await AsyncStorage.getItem(USER_SESSION_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    await clearSession();
    return null;
  }
}

// Xóa token và hồ sơ song song để kết thúc phiên đăng nhập.
export async function clearSession(): Promise<void> {
  // Xóa token và hồ sơ song song để kết thúc phiên nhất quán.
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(USER_SESSION_KEY),
  ]);
}

// Thực hiện yêu cầu có kiểu dữ liệu và trả về nội dung bên trong envelope chuẩn.
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  // Trả phần data bên trong envelope phản hồi chuẩn của API.
  const response = await api.request<ApiResponse<T>>(config);
  return response.data.data;
}
