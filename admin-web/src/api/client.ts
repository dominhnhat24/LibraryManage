import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  ApiEnvelope, Bookmark, Book, Chapter, Comment, PaginationData, ReadChapterResult, ReadingProgress,
  Report, Subscription, User,
} from '../types.ts';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const ACCESS_TOKEN_KEY = 'openbook.access_token';
const REFRESH_TOKEN_KEY = 'openbook.refresh_token';
const USER_KEY = 'openbook.user';

export function apiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return new URL(path, `${apiOrigin}/`).toString();
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthPayload {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface BookListResponse {
  books: Book[];
  pagination: PaginationData;
}

export interface ChapterListResponse {
  chapters: Chapter[];
  pagination: PaginationData;
}

export interface UserListResponse {
  users: User[];
  pagination: PaginationData;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  pagination: PaginationData;
}

export interface ReportListResponse {
  reports: Report[];
  pagination: PaginationData;
}

export interface PublicBookListResponse {
  books: Book[];
  pagination: PaginationData;
}

export interface AdminDashboardResponse {
  metrics: {
    totalBooks: number;
    totalChapters: number;
    totalUsers: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
    openReports: number;
  };
  categories: Array<{ category: string; count: number }>;
  readingActivity: Array<{ date: string; count: number }>;
  readingActivityTotal: number;
  periodDays: 7 | 30 | 90;
  system: { api: 'connected' | 'disconnected'; database: 'connected' | 'disconnected' };
}

export interface AdminCommentListResponse {
  comments: Comment[];
  pagination: PaginationData;
}

// Hàm fetchAdminDashboard: Lấy số liệu tổng hợp và chuỗi lượt đọc thật từ endpoint ADMIN.
export async function fetchAdminDashboard(days: 7 | 30 | 90 = 7): Promise<AdminDashboardResponse> {
  const { data } = await api.get<ApiEnvelope<AdminDashboardResponse>>('/admin/dashboard', { params: { days } });
  return data.data;
}

// Hàm fetchAdminComments: Lấy danh sách bình luận toàn hệ thống theo trang, không quét từng đầu sách.
export async function fetchAdminComments(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminCommentListResponse> {
  const { data } = await api.get<ApiEnvelope<Comment[]>>('/admin/comments', { params });
  if (!data.pagination) throw new Error('API bình luận quản trị không trả dữ liệu phân trang.');
  return { comments: data.data, pagination: data.pagination };
}

// Hàm fetchPublicBooks: Tải catalog sách đã xuất bản cho trang chủ độc giả.
export async function fetchPublicBooks(
  search = '',
  category?: Book['category'],
  page = 1,
  limit = 30,
  genre?: Book['genre'],
): Promise<PublicBookListResponse> {
  const { data } = await api.get<ApiEnvelope<Book[]>>('/books', {
    params: { page, limit, ...(search ? { search } : {}), ...(category ? { category } : {}), ...(genre ? { genre } : {}) },
  });
  return {
    books: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm fetchPublicBook: Lấy chi tiết metadata của một đầu sách đã xuất bản.
export async function fetchPublicBook(bookId: string): Promise<Book> {
  const { data } = await api.get<ApiEnvelope<Book>>(`/books/${encodeURIComponent(bookId)}`);
  return data.data;
}

// Hàm fetchReadableChapters: Lấy danh mục chương phù hợp với quyền của người đang đăng nhập.
export async function fetchReadableChapters(bookId: string, page = 1, limit = 50): Promise<{
  chapters: Chapter[];
  pagination: PaginationData;
}> {
  const { data } = await api.get<ApiEnvelope<Chapter[]>>(
    `/books/${encodeURIComponent(bookId)}/chapters`,
    { params: { page, limit } },
  );
  return {
    chapters: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Lấy metadata trực tiếp của một chương đã lưu mà không cần tải toàn bộ catalog.
export async function fetchReadableChapterMetadata(bookId: string, chapterId: string): Promise<Chapter> {
  const { data } = await api.get<ApiEnvelope<Chapter>>(
    `/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}`,
  );
  return data.data;
}

// Hàm readBookChapter: Xin backend kiểm tra entitlement, ghi lượt đọc và trả nội dung chương.
export async function readBookChapter(bookId: string, chapterId: string): Promise<ReadChapterResult> {
  const { data } = await api.post<ApiEnvelope<ReadChapterResult>>(
    `/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}/read`,
  );
  return data.data;
}

// Explicit completion is separate from opening content and safe to retry.
export async function completeBookChapter(bookId: string, chapterId: string): Promise<{
  newly_completed: boolean;
  completed_chapter_count: number;
  completed_chapters_since_ad: number;
  ad_eligibility_due: boolean;
}> {
  const { data } = await api.post<ApiEnvelope<{
    newly_completed: boolean;
    completed_chapter_count: number;
    completed_chapters_since_ad: number;
    ad_eligibility_due: boolean;
  }>>(`/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}/complete`);
  return data.data;
}

// Hàm fetchBookComments: Tải bình luận và đánh giá công khai cho một sách theo trang.
export async function fetchBookComments(bookId: string, page = 1, limit = 10): Promise<{
  comments: Comment[];
  pagination: PaginationData;
}> {
  const { data } = await api.get<ApiEnvelope<Comment[]>>(
    `/books/${encodeURIComponent(bookId)}/comments`,
    { params: { page, limit } },
  );
  return {
    comments: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm createBookComment: Gửi nhận xét và điểm đánh giá của tài khoản đang đăng nhập.
export async function createBookComment(bookId: string, body: string, rating: number | null): Promise<Comment> {
  const { data } = await api.post<ApiEnvelope<Comment>>(
    `/books/${encodeURIComponent(bookId)}/comments`,
    { body, rating },
  );
  return data.data;
}

// Hàm updateBookComment: Chỉnh sửa bình luận/đánh giá thuộc tài khoản hoặc được ADMIN quản lý.
export async function updateBookComment(
  commentId: string,
  payload: { body?: string; rating?: number | null },
): Promise<Comment> {
  const { data } = await api.patch<ApiEnvelope<Comment>>(
    `/comments/${encodeURIComponent(commentId)}`,
    payload,
  );
  return data.data;
}

// Hàm deleteBookComment: Xóa bình luận thuộc tài khoản hoặc do ADMIN kiểm duyệt.
export async function deleteBookComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${encodeURIComponent(commentId)}`);
}

// Hàm fetchReaderBookmarks: Lấy bookmark của phiên hiện tại để tiếp tục đọc hoặc quản lý mục đã lưu.
export async function fetchReaderBookmarks(page = 1, limit = 50): Promise<{
  bookmarks: Bookmark[];
  pagination: PaginationData;
}> {
  const { data } = await api.get<ApiEnvelope<Bookmark[]>>('/bookmarks', { params: { page, limit } });
  return {
    bookmarks: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm deleteReaderBookmark: Bỏ lưu một bookmark của tài khoản đang đăng nhập.
export async function deleteReaderBookmark(bookmarkId: string): Promise<void> {
  await api.delete(`/bookmarks/${encodeURIComponent(bookmarkId)}`);
}

// Hàm saveReaderBookmark: Tạo hoặc cập nhật bookmark để tiếp tục từ chương đã chọn.
export async function saveReaderBookmark(bookId: string, chapterId: string, bookmarkId?: string): Promise<Bookmark> {
  const { data } = bookmarkId
    ? await api.patch<ApiEnvelope<Bookmark>>(`/bookmarks/${encodeURIComponent(bookmarkId)}`, { chapter: chapterId })
    : await api.post<ApiEnvelope<Bookmark>>('/bookmarks', { book: bookId, chapter: chapterId });
  return data.data;
}

// Hàm fetchReadingProgress: Tải thống kê số lượt đọc theo sách của tài khoản hiện tại.
export async function fetchReadingProgress(page = 1, limit = 50, search = '', bookId?: string): Promise<{
  progress: ReadingProgress[];
  pagination: PaginationData;
}> {
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  const { data } = await api.get<ApiEnvelope<ReadingProgress[]>>('/reading-progress', {
    params: { page, limit: safeLimit, ...(search ? { search } : {}), ...(bookId ? { book: bookId } : {}) },
  });
  return {
    progress: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit: safeLimit, totalPages: 1 },
  };
}

// Hàm deleteReadingProgress: Xóa một bộ đếm tiến độ đọc của tài khoản hiện tại.
export async function deleteReadingProgress(progressId: string): Promise<void> {
  await api.delete(`/reading-progress/${encodeURIComponent(progressId)}`);
}

// Hàm clearReadingHistory: Xóa toàn bộ tiến độ đọc thuộc tài khoản đang đăng nhập.
export async function clearReadingHistory(): Promise<number> {
  const { data } = await api.delete<ApiEnvelope<{ deleted_count: number }>>('/reading-progress');
  return data.data.deleted_count;
}

// Hàm updateReadingProgress: Cập nhật bộ đếm đọc của tài khoản theo giới hạn trường do backend đặt.
export async function updateReadingProgress(
  progressId: string,
  payload: Partial<Pick<ReadingProgress, 'chapters_since_ad' | 'total_chapter_reads'>>,
): Promise<ReadingProgress> {
  const { data } = await api.patch<ApiEnvelope<ReadingProgress>>(
    `/reading-progress/${encodeURIComponent(progressId)}`,
    payload,
  );
  return data.data;
}

// Hàm submitReaderReport: Gửi liên hệ hoặc báo lỗi; email phiên đăng nhập do backend tự lấy.
export async function submitReaderReport(payload: {
  subject: string;
  message: string;
  type: 'contact' | 'bug';
  email?: string;
}): Promise<Partial<Report> & { confirmation_email_sent?: boolean }> {
  const { data } = await api.post<ApiEnvelope<Partial<Report> & { confirmation_email_sent?: boolean }>>('/reports', payload);
  return data.data;
}

// Hàm fetchMySubscription: Lấy yêu cầu thuê bao mới nhất của tài khoản đang đăng nhập.
export async function fetchMySubscription(): Promise<Subscription | null> {
  const { data } = await api.get<ApiEnvelope<Subscription | null>>('/subscriptions/me');
  return data.data;
}

// Hàm createReaderSubscription: Gửi yêu cầu thanh toán Premium/VIP và nhận thông tin chuyển khoản.
export async function createReaderSubscription(
  plan: 'premium_monthly' | 'vip_monthly',
): Promise<Subscription> {
  const { data } = await api.post<ApiEnvelope<Subscription>>('/subscriptions', { plan });
  return data.data;
}

// Hàm streamPublicBook: Lấy nội dung file qua API bảo vệ JWT/quyền đọc, không gọi URL kho lưu trữ trực tiếp.
export async function streamPublicBook(bookId: string): Promise<Blob> {
  try {
    const response = await api.get<Blob>(`/books/${encodeURIComponent(bookId)}/stream`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf,application/epub+zip,*/*' },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const responseText = await error.response.data.text();
      if (responseText) {
        let payload: { message?: unknown } | undefined;
        try {
          payload = JSON.parse(responseText) as { message?: unknown };
        } catch {
          payload = undefined;
        }
        if (typeof payload?.message === 'string') throw new Error(payload.message);
      }
    }
    throw error;
  }
}

// Hàm downloadProtectedBook: Tải file từ endpoint riêng chỉ cấp quyền cho VIP đang hoạt động hoặc ADMIN.
export async function downloadProtectedBook(bookId: string, title: string): Promise<void> {
  try {
    const { data } = await api.get<Blob>(`/downloads/${encodeURIComponent(bookId)}`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf,application/epub+zip,*/*' },
    });
    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/[<>:"/\\|?*]/g, '').trim() || 'openbook'}.pdf`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const message = await responseErrorMessage(error.response.data);
      if (message) throw new Error(message);
    }
    throw error;
  }
}

// Hàm responseErrorMessage: Giải mã JSON lỗi do API trả về dưới dạng Blob khi request tải file thất bại.
async function responseErrorMessage(blob: Blob): Promise<string> {
  const text = await blob.text();
  if (!text) return '';
  try {
    const payload = JSON.parse(text) as { message?: unknown };
    return typeof payload.message === 'string' ? payload.message : '';
  } catch {
    return '';
  }
}

// Hàm storeSession: Lưu token và hồ sơ đăng nhập để interceptor và route guard dùng chung.
export function storeSession(payload: AuthPayload): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

// Hàm clearSession: Xóa phiên local khi đăng xuất hoặc refresh token không còn hợp lệ.
function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function uploadExcelApi(formData: FormData) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    const response = await api.post("/books/import-excel", formData, {
        headers: {
            ...token ? {
                Authorization: `Bearer ${token}`
            } : {}
        }
    });
    return response.data;
}

// Hàm refreshAccessToken: Xoay refresh token một lần và dùng chung promise cho các request đồng thời.
let refreshRequest: Promise<string> | null = null;
async function performRefresh(failedAccessToken?: string): Promise<string> {
  const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  // Another tab may already have refreshed while this request waited for the lock.
  if (failedAccessToken && currentAccessToken && currentAccessToken !== failedAccessToken) return currentAccessToken;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('Refresh token is missing');

  try {
    const { data } = await axios.post<ApiEnvelope<AuthPayload>>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 20_000, headers: { Accept: 'application/json' } },
    );
    storeSession(data.data);
    return data.data.access_token;
  } catch (error: unknown) {
    // A different tab can rotate the token while this request is in flight. Never
    // erase that newer session because this tab's copy of the old token was rejected.
    const latestRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const latestAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (latestRefreshToken && latestRefreshToken !== refreshToken && latestAccessToken) return latestAccessToken;
    clearSession();
    window.dispatchEvent(new CustomEvent('openbook:session-expired'));
    throw error;
  }
}

async function refreshAccessToken(failedAccessToken?: string): Promise<string> {
  if (!refreshRequest) {
    const refresh = () => performRefresh(failedAccessToken);
    const task: Promise<string> = typeof navigator !== 'undefined' && 'locks' in navigator
      ? (navigator.locks.request as unknown as (name: string, callback: () => Promise<string>) => Promise<string>)(
        'openbook-auth-refresh', refresh,
      )
      : refresh();
    const pending = task
      .finally(() => {
        refreshRequest = null;
      });
    refreshRequest = pending;
    return pending;
  }
  return refreshRequest!;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const config = error.config as RetriableRequest | undefined;
    const url = config?.url || '';
    
    // Bỏ qua nếu là request auth hoặc chính là request import-excel đang bị lỗi
    const isAuthRequest = url.includes('/auth/');
    const isImportRequest = url.includes('books/import-excel');

    // Chỉ ghi log 401 khi đúng là lỗi xác thực; trước đây hai dòng log này chạy với mọi lỗi,
    // khiến HTTP 404 cũng bị hiểu nhầm là lỗi refresh token.
    if (error.response?.status === 401) {
      console.warn('API trả về HTTP 401 từ URL:', url);
      console.warn('Refresh token có tồn tại không?', !!localStorage.getItem(REFRESH_TOKEN_KEY));
    } else if (error.response?.status) {
      console.error(`API trả về HTTP ${error.response.status} từ URL: ${url}`, error.response.data);
    }

    // 1. Thử refresh token nếu thỏa điều kiện
    if (error.response?.status === 401 && config && !config._retry && !isAuthRequest && !isImportRequest
      && localStorage.getItem(REFRESH_TOKEN_KEY)) {
      config._retry = true;
      try {
        const authorization = String(config.headers.get('Authorization') || '');
        const failedAccessToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
        const token = await refreshAccessToken(failedAccessToken);
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      } catch (refreshError) {
        // Nếu refresh thất bại, dừng ngay tại đây và reject lỗi, không thả trôi xuống dưới
        return Promise.reject(refreshError);
      }
    }

    // 2. Nếu là import-excel hoặc auth request mà vẫn bị 401, TUYỆT ĐỐI KHÔNG clearSession tự động ở đây
    if (error.response?.status === 401 && !isAuthRequest && !isImportRequest) {
      clearSession();
      window.dispatchEvent(new CustomEvent('openbook:session-expired'));
    }

    return Promise.reject(error);
  },
);

// Hàm errorMessage: Đổi lỗi Axios/Joi thành nội dung ngắn gọn để hiển thị trong form và bảng quản trị.
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const payload = error.response?.data;
    if (payload?.violations?.length) {
      return payload.violations.map(({ field, message }) => `${field}: ${message}`).join(' · ');
    }
    if (payload?.message) return payload.message;
    if (!error.response) return 'Không kết nối được máy chủ. Hãy kiểm tra API đang chạy và VITE_API_URL.';
    return `Yêu cầu thất bại (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định.';
}

// Hàm requestRegistrationCode: Tạo tài khoản chưa xác minh và yêu cầu backend gửi mã OTP qua email.
export async function requestRegistrationCode(
  name: string,
  phoneNumber: string,
  email: string,
  password: string,
): Promise<void> {
  await api.post('/auth/register', { name, phone_number: phoneNumber, email, password });
}

// Hàm verifyRegistrationEmail: Gửi OTP để xác minh email, lưu phiên đăng nhập được cấp sau xác minh.
export async function verifyRegistrationEmail(email: string, otp: string): Promise<User> {
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/verify-email', { email, otp });
  storeSession(data.data);
  return data.data.user;
}

// Hàm resendRegistrationCode: Yêu cầu gửi lại OTP cho địa chỉ email đang chờ xác minh.
export async function resendRegistrationCode(email: string): Promise<void> {
  await api.post('/auth/resend-verification', { email });
}

// Hàm signIn: Gửi thông tin đăng nhập, lưu cặp token và trả về hồ sơ user từ API.
export async function signIn(email: string, password: string): Promise<User> {
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/login', { email, password });
  storeSession(data.data);
  return data.data.user;
}

// Hàm signInAdmin: Đăng nhập qua endpoint chỉ cấp token cho tài khoản có role ADMIN.
export async function signInAdmin(email: string, password: string): Promise<User> {
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/admin-login', { email, password });
  storeSession(data.data);
  return data.data.user;
}

// Hàm fetchCurrentUser: Xác minh access token với API và trả hồ sơ dùng để phân quyền giao diện.
export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<User>>('/auth/me');
  return data.data;
}

export async function updateMyProfile(payload: { name: string; phone_number?: string | null }): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>('/auth/me', payload);
  storeUser(data.data);
  return data.data;
}

export async function uploadMyAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post<ApiEnvelope<User>>('/auth/me/avatar', form);
  storeUser(data.data);
  return data.data;
}

export async function changeMyPassword(current_password: string, new_password: string): Promise<void> {
  await api.post('/auth/change-password', { current_password, new_password });
  clearSession();
  window.dispatchEvent(new CustomEvent('openbook:session-expired'));
}

// Hàm signOut: Thu hồi refresh token phía server trước khi dọn phiên trên trình duyệt.
export async function signOut(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    clearSession();
  }
}

// Hàm fetchBooks: Tải trang sách quản trị, bao gồm cả draft, theo query đã được backend validation.
export async function fetchBooks(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<BookListResponse> {
  const { data } = await api.get<ApiEnvelope<Book[]>>('/admin/books', { params });
  if (!data.pagination) throw new Error('API danh sách sách không trả dữ liệu phân trang.');
  return { books: data.data, pagination: data.pagination };
}

export interface BookImportCandidate {
  id: string;
  title: string;
  author: string;
  summary: string;
  source: string;
  sourceUrl: string;
  language: 'vi';
  format: 'PDF';
  license: string;
  licenseUrl: string;
  coverUrl: string;
  coverVerified: boolean;
  coverLicense: string;
  coverLicenseUrl: string;
  coverSourceUrl: string;
  coverAttribution: string;
  coverWidth: number | null;
  coverHeight: number | null;
  contentCharacters: number;
  publicationYear: number | null;
  eligible: boolean;
  reasons: string[];
  exportAvailable: boolean;
}

export interface BookImportSearchResult {
  query: string;
  found: number;
  checked: number;
  eligible: number;
  excluded: number;
  exclusions: Array<{ reason: string; count: number }>;
  excludedCandidates: Array<{ id: string; title: string; reasons: string[] }>;
  candidates: BookImportCandidate[];
}

export async function searchBookImportCandidates(query: string): Promise<BookImportSearchResult> {
  const { data } = await api.get<ApiEnvelope<BookImportSearchResult>>('/admin/book-import/search', {
    params: { q: query },
    timeout: 90000,
  });
  return data.data;
}

export async function importBookCandidate(pageTitle: string, confirmLicense: boolean, confirmCover: boolean): Promise<{
  status: 'imported' | 'already_imported' | 'duplicate';
  book: Book;
}> {
  const { data } = await api.post<ApiEnvelope<{ status: 'imported' | 'already_imported' | 'duplicate'; book: Book }>>(
    '/admin/book-import/import', { pageTitle, confirmLicense, confirmCover }, { timeout: 180000 },
  );
  return data.data;
}

// Hàm createBook: Gửi dữ liệu form sách mới đến endpoint quản trị.
export async function createBook(
  payload: BookFormPayload,
  pdfFile: File | null = null,
  onProgress?: (percentage: number) => void,
): Promise<Book> {
  let requestBody: BookFormPayload | FormData = payload;
  if (pdfFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    formData.append('file', pdfFile);
    requestBody = formData;
  }
  const { data } = await api.post<ApiEnvelope<Book>>('/admin/books', requestBody, {
    ...(onProgress ? {
      onUploadProgress(event) {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    } : {}),
  });
  return data.data;
}

// Hàm updateBook: Cập nhật sách hiện có, backend chỉ lưu các trường thuộc model Book.
export async function updateBook(bookId: string, payload: BookFormPayload): Promise<Book> {
  const { data } = await api.put<ApiEnvelope<Book>>(`/admin/books/${encodeURIComponent(bookId)}`, payload);
  return data.data;
}

// Hàm deleteBook: Xóa sách và các dữ liệu chương/tương tác liên quan qua endpoint quản trị.
export async function deleteBook(bookId: string): Promise<void> {
  await api.delete(`/admin/books/${encodeURIComponent(bookId)}`);
}

// Hàm uploadBookFile: Gửi file sách dạng multipart tới kho riêng và báo tiến độ upload cho giao diện.
export async function uploadBookFile(
  bookId: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<{ book_id: string; original_name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ApiEnvelope<{ book_id: string; original_name: string }>>(
    `/admin/books/${encodeURIComponent(bookId)}/file`,
    formData,
    {
      onUploadProgress(event) {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
  return data.data;
}

// Hàm fetchChapters: Tải danh sách chương quản trị theo trang, từ khóa tiêu đề và cấp truy cập.
export async function fetchChapters(params: {
  page: number;
  limit: number;
  search?: string;
  access_level?: string;
}): Promise<ChapterListResponse> {
  const { data } = await api.get<ApiEnvelope<Chapter[]>>('/admin/chapters', { params });
  if (!data.pagination) throw new Error('API danh sách chương không trả dữ liệu phân trang.');
  return { chapters: data.data, pagination: data.pagination };
}

// Hàm createChapter: Tạo chương mới theo schema API và trả DTO chương đã lưu.
export async function createChapter(payload: ChapterFormPayload): Promise<Chapter> {
  const { data } = await api.post<ApiEnvelope<Chapter>>('/admin/chapters', payload);
  return data.data;
}

// Hàm updateChapter: Cập nhật tiêu đề, nội dung, thứ tự, quyền đọc hoặc ngày phát hành chương.
export async function updateChapter(chapterId: string, payload: ChapterUpdatePayload): Promise<Chapter> {
  const { data } = await api.patch<ApiEnvelope<Chapter>>(
    `/admin/chapters/${encodeURIComponent(chapterId)}`,
    payload,
  );
  return data.data;
}

// Hàm deleteChapter: Xóa một chương bằng endpoint quản trị và báo lỗi nếu API từ chối yêu cầu.
export async function deleteChapter(chapterId: string): Promise<void> {
  await api.delete(`/admin/chapters/${encodeURIComponent(chapterId)}`);
}

// Hàm fetchUsers: Lấy danh sách tài khoản quản trị theo bộ lọc role, từ khóa và phân trang.
export async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}): Promise<UserListResponse> {
  const { data } = await api.get<ApiEnvelope<User[]>>('/admin/users', { params });
  if (!data.pagination) throw new Error('API danh sách người dùng không trả dữ liệu phân trang.');
  return { users: data.data, pagination: data.pagination };
}

// Hàm fetchRecentUsers: Tải tối đa 50 tài khoản mới nhất cho bảng tổng quan ADMIN.
export async function fetchRecentUsers(): Promise<User[]> {
  const { data } = await api.get<ApiEnvelope<User[]>>('/admin/users/recent');
  return data.data;
}

// Hàm fetchUser: Lấy hồ sơ chi tiết một tài khoản theo ID qua endpoint ADMIN.
export async function fetchUser(userId: string): Promise<User> {
  const { data } = await api.get<ApiEnvelope<User>>(`/admin/users/${encodeURIComponent(userId)}`);
  return data.data;
}

// Hàm createUser: Tạo tài khoản độc giả mới qua API ADMIN.
export async function createUser(payload: UserFormPayload): Promise<User> {
  const { data } = await api.post<ApiEnvelope<User>>('/admin/users', payload);
  return data.data;
}

// Hàm updateUser: Cập nhật hồ sơ hoặc role bằng payload được backend validation cho phép.
export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>(`/admin/users/${encodeURIComponent(userId)}`, payload);
  return data.data;
}

// Hàm deleteUser: Xóa tài khoản qua API quản trị cùng quy tắc dọn dữ liệu liên quan của backend.
export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${encodeURIComponent(userId)}`);
}

// Hàm grantVip: Cấp quyền VIP đến thời điểm hết hạn đã được ADMIN chọn.
export async function grantVip(userId: string, vipExpiresAt: string): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>(
    `/admin/users/${encodeURIComponent(userId)}/vip`,
    { vip_expires_at: vipExpiresAt },
  );
  return data.data;
}

// Hàm grantPremium: Cấp quyền Premium đến thời điểm hết hạn do ADMIN chọn.
export async function grantPremium(userId: string, premiumExpiresAt: string): Promise<User> {
  const { data } = await api.patch<ApiEnvelope<User>>(
    `/admin/users/${encodeURIComponent(userId)}/premium`,
    { premium_expires_at: premiumExpiresAt },
  );
  return data.data;
}

// Hàm fetchSubscriptions: Tải yêu cầu thuê bao theo trạng thái, gói và phân trang.
export async function fetchSubscriptions(params: {
  page: number;
  limit: number;
  status?: string;
  plan?: string;
}): Promise<SubscriptionListResponse> {
  const { data } = await api.get<ApiEnvelope<Subscription[]>>('/admin/subscriptions', { params });
  if (!data.pagination) throw new Error('API thuê bao không trả dữ liệu phân trang.');
  return { subscriptions: data.data, pagination: data.pagination };
}

// Hàm fetchPendingSubscriptions: Lấy riêng yêu cầu thuê bao đang chờ xét duyệt.
export async function fetchPendingSubscriptions(): Promise<SubscriptionListResponse> {
  const { data } = await api.get<ApiEnvelope<Subscription[]>>('/admin/subscriptions/pending');
  if (!data.pagination) throw new Error('API thuê bao chờ duyệt không trả dữ liệu phân trang.');
  return { subscriptions: data.data, pagination: data.pagination };
}

// Hàm fetchSubscription: Lấy chi tiết một yêu cầu thuê bao qua endpoint ADMIN.
export async function fetchSubscription(subscriptionId: string): Promise<Subscription> {
  const { data } = await api.get<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
  return data.data;
}

// Hàm updateSubscriptionPaymentReference: Cập nhật mã giao dịch ghi chú của yêu cầu còn chờ duyệt.
export async function updateSubscriptionPaymentReference(
  subscriptionId: string,
  paymentReference: string,
): Promise<Subscription> {
  const { data } = await api.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { payment_reference: paymentReference },
  );
  return data.data;
}

// Hàm reviewSubscription: Duyệt hoặc từ chối yêu cầu chuyển khoản để backend cập nhật quyền tương ứng.
export async function reviewSubscription(subscriptionId: string, decision: 'approve' | 'reject'): Promise<Subscription> {
  const { data } = await api.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}/${decision}`,
  );
  return data.data;
}

// Hàm deleteSubscription: Xóa yêu cầu thuê bao đang chờ xử lý.
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  await api.delete(`/admin/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

// Hàm fetchReports: Lấy báo cáo theo trạng thái, từ khóa subject/email và phân trang.
export async function fetchReports(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): Promise<ReportListResponse> {
  const { data } = await api.get<ApiEnvelope<Report[]>>('/admin/reports', { params });
  if (!data.pagination) throw new Error('API báo cáo không trả dữ liệu phân trang.');
  return { reports: data.data, pagination: data.pagination };
}

// Hàm fetchReport: Lấy nội dung chi tiết báo cáo theo ID qua endpoint ADMIN.
export async function fetchReport(reportId: string): Promise<Report> {
  const { data } = await api.get<ApiEnvelope<Report>>(`/admin/reports/${encodeURIComponent(reportId)}`);
  return data.data;
}

// Hàm updateReport: Cập nhật trạng thái xử lý một báo cáo qua endpoint quản trị.
export async function updateReport(reportId: string, status: Report['status']): Promise<Report> {
  const { data } = await api.patch<ApiEnvelope<Report>>(
    `/admin/reports/${encodeURIComponent(reportId)}`,
    { status },
  );
  return data.data;
}

// Hàm deleteReport: Xóa báo cáo không còn cần theo dõi khỏi hệ thống.
export async function deleteReport(reportId: string): Promise<void> {
  await api.delete(`/admin/reports/${encodeURIComponent(reportId)}`);
}

export interface BookFormPayload {
  title: string;
  author_name: string;
  category: Book['category'];
  genre: NonNullable<Book['genre']>;
  publication_year: number | null;
  description: string;
  cover_url: string;
  access_level: Book['access_level'];
  status: Book['status'];
}

export interface ChapterFormPayload {
  book_id: string;
  title: string;
  content: string;
  chapter_number: number;
  access_level: Book['access_level'];
  published_at: string;
}

export type ChapterUpdatePayload = Omit<ChapterFormPayload, 'book_id'>;

export interface UserFormPayload {
  name: string;
  email: string;
  phone_number: string;
  password: string;
}

export type UserUpdatePayload = Partial<Omit<UserFormPayload, 'password'>> & {
  password?: string;
  role?: User['role'];
};
