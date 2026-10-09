// Các thao tác API theo hợp đồng OpenBook hiện tại.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { ACCESS_TOKEN_KEY, API_BASE_URL, request, saveSession, type AuthSession, type UserRole } from '@/services/api';
import type { ApiUser, Book, Subscription } from '@/types/library';

interface AuthPayload {
  user: ApiUser;
  token: string;
}

interface BookQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface BookPage {
  books: Book[];
  page: number;
  totalPages: number;
}

function normalizeSession(payload: AuthPayload): AuthSession {
  const { user, token } = payload;
  return {
    id: user._id ?? user.id ?? user.email,
    name: user.name ?? user.full_name ?? user.email,
    email: user.email,
    role: user.role,
    accessToken: token,
  };
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const payload = await request<AuthPayload>({
    url: '/auth/login',
    method: 'POST',
    data: { email, password },
  });
  const session = normalizeSession(payload);
  await saveSession(session);
  return session;
}

export async function register(name: string, email: string, password: string): Promise<AuthSession> {
  const payload = await request<AuthPayload>({
    url: '/auth/register',
    method: 'POST',
    data: { name, email, password },
  });
  const session = normalizeSession(payload);
  await saveSession(session);
  return session;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

export async function getBooks(query: BookQuery = {}): Promise<BookPage> {
  const result = await request<unknown>({
    url: '/books',
    params: {
      ...(query.search ? { search: query.search } : {}),
      ...(query.category ? { category: query.category } : {}),
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    },
  });
  const value = objectValue(result);
  const items = Array.isArray(result)
    ? result
    : Array.isArray(value?.books)
      ? value.books
      : Array.isArray(value?.items)
        ? value.items
        : Array.isArray(value?.data)
          ? value.data
          : [];
  const pagination = objectValue(value?.pagination);
  return {
    books: items as Book[],
    page: Number(pagination?.page ?? value?.page ?? query.page ?? 1),
    totalPages: Number(pagination?.totalPages ?? value?.totalPages ?? query.page ?? 1),
  };
}

export async function getBook(bookId: string): Promise<Book> {
  return request<Book>({ url: `/books/${encodeURIComponent(bookId)}` });
}

export async function getMySubscription(): Promise<Subscription | null> {
  const result = await request<unknown>({ url: '/subscriptions/me' });
  if (!result) return null;
  const value = objectValue(result);
  if (value && 'subscription' in value) return (value.subscription as Subscription | null) ?? null;
  return result as Subscription;
}

export async function createMonthlySubscription(): Promise<Subscription> {
  return request<Subscription>({
    url: '/subscriptions',
    method: 'POST',
    data: { plan: 'monthly' },
  });
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'openbook-download';
}

function getFileName(contentDisposition: string | null, title: string): string {
  const match = contentDisposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  const name = safeFileName(match ? decodeURIComponent(match[1]) : title);
  return /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}.epub`;
}

function getUserRole(role: UserRole): UserRole {
  return role;
}

export async function downloadBook(bookId: string, title: string, role: UserRole): Promise<string> {
  if (getUserRole(role) !== 'vip') throw new Error('Chỉ tài khoản VIP mới có thể tải sách ngoại tuyến.');
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) throw new Error('Vui lòng đăng nhập lại để tải sách.');
  const response = await fetch(`${API_BASE_URL}/downloads/${encodeURIComponent(bookId)}`, {
    headers: { Accept: '*/*', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn.');
    if (response.status === 403) throw new Error('Tài khoản cần có gói VIP đang hoạt động để tải sách.');
    throw new Error(`Không thể tải sách (lỗi ${response.status}).`);
  }
  const fileName = getFileName(response.headers.get('content-disposition'), title);

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return fileName;
  }

  const directory = new Directory(Paths.document, 'downloads');
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, fileName);
  file.create({ intermediates: true, overwrite: true });
  file.write(new Uint8Array(await response.arrayBuffer()));
  return file.uri;
}
