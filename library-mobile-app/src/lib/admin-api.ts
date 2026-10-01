// Lớp tiện ích gửi yêu cầu quản trị qua client Axios dùng chung và định dạng ngày.
import { api } from '@/services/api';

// Một số endpoint bọc kết quả trong data, số khác trả payload trực tiếp.
// Kiểu bao phản hồi tùy chọn mà một số endpoint quản trị trả về.
interface ApiEnvelope<T> {
  data?: T;
  message?: string;
}

// Các tùy chọn được chuyển thành cấu hình yêu cầu Axios.
interface AdminRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
}

// Gửi yêu cầu quản trị có kiểu kết quả và gỡ lớp bọc phản hồi nếu endpoint có.
export async function adminRequest<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  // Chuyển body chuỗi JSON thành data Axios và gỡ một lớp bọc data khi có.
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

// Các màn hình độc giả dùng cùng client và quy tắc giải bọc payload.
export const readerRequest = adminRequest;

// Giữ nguyên chuỗi đầu vào nếu ngày không hợp lệ; nếu hợp lệ, định dạng theo locale Việt Nam.
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
