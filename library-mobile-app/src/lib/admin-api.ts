import { api } from '@/services/api';

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
}

interface AdminRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
}

export async function adminRequest<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  const response = await api.request<ApiEnvelope<T> | T>({
    url: path,
    method: options.method ?? 'GET',
    data: options.body,
  });

  const payload = response.data;
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

export const readerRequest = adminRequest;

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
