// Import axios, { AxiosError, type InternalAxiosRequestConfig } từ axios để dùng trong giao diện.
/**
 * Tệp admin-web/src/api/client.ts: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
// Import type { ApiEnvelope, Bookmark, Book, Chapter, Comment, PaginationData, ReadChapte từ ../types.ts để dùng trong giao diện.
import type {
  ApiEnvelope, Bookmark, Book, Chapter, Comment, PaginationData, ReadChapterResult, ReadingProgress,
  Report, Subscription, User,
} from '../types.ts';
// Biến API_BASE_URL nhận giá trị từ import.meta.env.VITE_API_URL || 'http:. const không gán lại; let có thể cập nhật.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
// Biến ACCESS_TOKEN_KEY nhận giá trị từ 'openbook.access_token'. const không gán lại; let có thể cập nhật.
const ACCESS_TOKEN_KEY = 'openbook.access_token';
// Biến REFRESH_TOKEN_KEY nhận giá trị từ 'openbook.refresh_token'. const không gán lại; let có thể cập nhật.
const REFRESH_TOKEN_KEY = 'openbook.refresh_token';
// Biến USER_KEY nhận giá trị từ 'openbook.user'. const không gán lại; let có thể cập nhật.
const USER_KEY = 'openbook.user';

/**
 * Hàm/thành phần apiAssetUrl: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: path.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: test, replace, URL, toString.
 */
export function apiAssetUrl(path: string): string {
  // if chỉ chạy nhánh này khi điều kiện /^https?:\/\ đúng.
  if (/^https?:\/\//i.test(path)) return path;
  // Biến apiOrigin nhận giá trị từ API_BASE_URL.replace(/\/api\/v1\/?$/, ''). const không gán lại; let có thể cập nhật.
  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: new URL(path, `${apiOrigin}/`).toString().
  return new URL(path, `${apiOrigin}/`).toString();
}

// Biến api nhận giá trị từ axios.create({ baseURL: API_BASE_URL, timeout: 20_000, . const không gán lại; let có thể cập nhật.
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

// Interface RetriableRequest quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Interface AuthPayload quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
interface AuthPayload {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Interface BookListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface BookListResponse {
  books: Book[];
  pagination: PaginationData;
}

// Interface ChapterListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface ChapterListResponse {
  chapters: Chapter[];
  pagination: PaginationData;
}

// Interface UserListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface UserListResponse {
  users: User[];
  pagination: PaginationData;
}

// Interface SubscriptionListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  pagination: PaginationData;
}

// Interface ReportListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface ReportListResponse {
  reports: Report[];
  pagination: PaginationData;
}

// Interface PublicBookListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface PublicBookListResponse {
  books: Book[];
  pagination: PaginationData;
}

// Interface AdminDashboardResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
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

// Interface AdminCommentListResponse quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface AdminCommentListResponse {
  comments: Comment[];
  pagination: PaginationData;
}

// Hàm fetchAdminDashboard: Lấy số liệu tổng hợp và chuỗi lượt đọc thật từ endpoint ADMIN.
/**
 * Hàm/thành phần fetchAdminDashboard: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: days mặc định 7.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchAdminDashboard(days: 7 | 30 | 90 = 7): Promise<AdminDashboardResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<AdminDashboardResponse>>('/ad. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<AdminDashboardResponse>>('/admin/dashboard', { params: { days } });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchAdminComments: Lấy danh sách bình luận toàn hệ thống theo trang, không quét từng đầu sách.
/**
 * Hàm/thành phần fetchAdminComments: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchAdminComments(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminCommentListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Comment[]>>('/admin/comments'. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Comment[]>>('/admin/comments', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API bình luận quản trị không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { comments: data.data, pagination: data.pagination }.
  return { comments: data.data, pagination: data.pagination };
}

// Hàm fetchPublicBooks: Tải catalog sách đã xuất bản cho trang chủ độc giả.
/**
 * Hàm/thành phần fetchPublicBooks: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: search mặc định '', category optional, page mặc định 1, limit mặc định 30, genre optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchPublicBooks(
  search = '',
  category?: Book['category'],
  page = 1,
  limit = 30,
  genre?: Book['genre'],
): Promise<PublicBookListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Book[]>>('/books', { params: . const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Book[]>>('/books', {
    params: { page, limit, ...(search ? { search } : {}), ...(category ? { category } : {}), ...(genre ? { genre } : {}) },
  });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { books: data.data, pagination: data.pagination ?? { total: data.data.length, pa.
  return {
    books: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm fetchPublicBook: Lấy chi tiết metadata của một đầu sách đã xuất bản.
/**
 * Hàm/thành phần fetchPublicBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchPublicBook(bookId: string): Promise<Book> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Book>>(`/books/${encodeURICom. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Book>>(`/books/${encodeURIComponent(bookId)}`);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchReadableChapters: Lấy danh mục chương phù hợp với quyền của người đang đăng nhập.
/**
 * Hàm/thành phần fetchReadableChapters: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, page mặc định 1, limit mặc định 50.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchReadableChapters(bookId: string, page = 1, limit = 50): Promise<{
  chapters: Chapter[];
  pagination: PaginationData;
}> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Chapter[]>>( `/books/${encode. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Chapter[]>>(
    `/books/${encodeURIComponent(bookId)}/chapters`,
    { params: { page, limit } },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { chapters: data.data, pagination: data.pagination ?? { total: data.data.length,.
  return {
    chapters: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Lấy metadata trực tiếp của một chương đã lưu mà không cần tải toàn bộ catalog.
/**
 * Hàm/thành phần fetchReadableChapterMetadata: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, chapterId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchReadableChapterMetadata(bookId: string, chapterId: string): Promise<Chapter> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Chapter>>( `/books/${encodeUR. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Chapter>>(
    `/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}`,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm readBookChapter: Xin backend kiểm tra entitlement, ghi lượt đọc và trả nội dung chương.
/**
 * Hàm/thành phần readBookChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, chapterId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function readBookChapter(bookId: string, chapterId: string): Promise<ReadChapterResult> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<ReadChapterResult>>( `/books. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<ReadChapterResult>>(
    `/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}/read`,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Explicit completion is separate from opening content and safe to retry.
/**
 * Hàm/thành phần completeBookChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, chapterId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function completeBookChapter(bookId: string, chapterId: string): Promise<{
  newly_completed: boolean;
  completed_chapter_count: number;
  completed_chapters_since_ad: number;
  ad_eligibility_due: boolean;
}> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<{ newly_completed: boolean; . const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<{
    newly_completed: boolean;
    completed_chapter_count: number;
    completed_chapters_since_ad: number;
    ad_eligibility_due: boolean;
  }>>(`/books/${encodeURIComponent(bookId)}/chapters/${encodeURIComponent(chapterId)}/complete`);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchBookComments: Tải bình luận và đánh giá công khai cho một sách theo trang.
/**
 * Hàm/thành phần fetchBookComments: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, page mặc định 1, limit mặc định 10.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchBookComments(bookId: string, page = 1, limit = 10): Promise<{
  comments: Comment[];
  pagination: PaginationData;
}> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Comment[]>>( `/books/${encode. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Comment[]>>(
    `/books/${encodeURIComponent(bookId)}/comments`,
    { params: { page, limit } },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { comments: data.data, pagination: data.pagination ?? { total: data.data.length,.
  return {
    comments: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm createBookComment: Gửi nhận xét và điểm đánh giá của tài khoản đang đăng nhập.
/**
 * Hàm/thành phần createBookComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, body, rating.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function createBookComment(bookId: string, body: string, rating: number | null): Promise<Comment> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<Comment>>( `/books/${encodeU. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<Comment>>(
    `/books/${encodeURIComponent(bookId)}/comments`,
    { body, rating },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateBookComment: Chỉnh sửa bình luận/đánh giá thuộc tài khoản hoặc được ADMIN quản lý.
/**
 * Hàm/thành phần updateBookComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: commentId, payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function updateBookComment(
  commentId: string,
  payload: { body?: string; rating?: number | null },
): Promise<Comment> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<Comment>>( `/comments/${enc. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<Comment>>(
    `/comments/${encodeURIComponent(commentId)}`,
    payload,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteBookComment: Xóa bình luận thuộc tài khoản hoặc do ADMIN kiểm duyệt.
/**
 * Hàm/thành phần deleteBookComment: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: commentId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 */
export async function deleteBookComment(commentId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/comments/${encodeURIComponent(commentId)}`)
  await api.delete(`/comments/${encodeURIComponent(commentId)}`);
}

// Hàm fetchReaderBookmarks: Lấy bookmark của phiên hiện tại để tiếp tục đọc hoặc quản lý mục đã lưu.
/**
 * Hàm/thành phần fetchReaderBookmarks: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: page mặc định 1, limit mặc định 50.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchReaderBookmarks(page = 1, limit = 50): Promise<{
  bookmarks: Bookmark[];
  pagination: PaginationData;
}> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Bookmark[]>>('/bookmarks', { . const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Bookmark[]>>('/bookmarks', { params: { page, limit } });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { bookmarks: data.data, pagination: data.pagination ?? { total: data.data.length.
  return {
    bookmarks: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit, totalPages: 1 },
  };
}

// Hàm deleteReaderBookmark: Bỏ lưu một bookmark của tài khoản đang đăng nhập.
/**
 * Hàm/thành phần deleteReaderBookmark: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookmarkId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 */
export async function deleteReaderBookmark(bookmarkId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/bookmarks/${encodeURIComponent(bookmarkId)}`)
  await api.delete(`/bookmarks/${encodeURIComponent(bookmarkId)}`);
}

// Hàm saveReaderBookmark: Tạo hoặc cập nhật bookmark để tiếp tục từ chương đã chọn.
/**
 * Hàm/thành phần saveReaderBookmark: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, chapterId, bookmarkId optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function saveReaderBookmark(bookId: string, chapterId: string, bookmarkId?: string): Promise<Bookmark> {
  // Biến { data } nhận giá trị từ bookmarkId ? await api.patch<ApiEnvelope<Bookmark>>(`/b. const không gán lại; let có thể cập nhật.
  const { data } = bookmarkId
    ? await api.patch<ApiEnvelope<Bookmark>>(`/bookmarks/${encodeURIComponent(bookmarkId)}`, { chapter: chapterId })
    : await api.post<ApiEnvelope<Bookmark>>('/bookmarks', { book: bookId, chapter: chapterId });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchReadingProgress: Tải thống kê số lượt đọc theo sách của tài khoản hiện tại.
/**
 * Hàm/thành phần fetchReadingProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: page mặc định 1, limit mặc định 50, search mặc định '', bookId optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: min, max, trunc.
 */
export async function fetchReadingProgress(page = 1, limit = 50, search = '', bookId?: string): Promise<{
  progress: ReadingProgress[];
  pagination: PaginationData;
}> {
  // Biến safeLimit nhận giá trị từ Math.min(50, Math.max(1, Math.trunc(limit))). const không gán lại; let có thể cập nhật.
  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<ReadingProgress[]>>('/reading. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<ReadingProgress[]>>('/reading-progress', {
    params: { page, limit: safeLimit, ...(search ? { search } : {}), ...(bookId ? { book: bookId } : {}) },
  });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { progress: data.data, pagination: data.pagination ?? { total: data.data.length,.
  return {
    progress: data.data,
    pagination: data.pagination ?? { total: data.data.length, page, limit: safeLimit, totalPages: 1 },
  };
}

// Hàm deleteReadingProgress: Xóa một bộ đếm tiến độ đọc của tài khoản hiện tại.
/**
 * Hàm/thành phần deleteReadingProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: progressId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/reading-progress.service.js.
 */
export async function deleteReadingProgress(progressId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/reading-progress/${encodeURIComponent(progressId)}`)
  await api.delete(`/reading-progress/${encodeURIComponent(progressId)}`);
}

// Hàm clearReadingHistory: Xóa toàn bộ tiến độ đọc thuộc tài khoản đang đăng nhập.
/**
 * Hàm/thành phần clearReadingHistory: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function clearReadingHistory(): Promise<number> {
  // Biến { data } nhận giá trị từ await api.delete<ApiEnvelope<{ deleted_count: number }>. const không gán lại; let có thể cập nhật.
  const { data } = await api.delete<ApiEnvelope<{ deleted_count: number }>>('/reading-progress');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.deleted_count.
  return data.data.deleted_count;
}

// Hàm updateReadingProgress: Cập nhật bộ đếm đọc của tài khoản theo giới hạn trường do backend đặt.
/**
 * Hàm/thành phần updateReadingProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: progressId, payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 * Được tham chiếu tại: src/services/reading-progress.service.js.
 */
export async function updateReadingProgress(
  progressId: string,
  payload: Partial<Pick<ReadingProgress, 'chapters_since_ad' | 'total_chapter_reads'>>,
): Promise<ReadingProgress> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<ReadingProgress>>( `/readin. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<ReadingProgress>>(
    `/reading-progress/${encodeURIComponent(progressId)}`,
    payload,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm submitReaderReport: Gửi liên hệ hoặc báo lỗi; email phiên đăng nhập do backend tự lấy.
/**
 * Hàm/thành phần submitReaderReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function submitReaderReport(payload: {
  subject: string;
  message: string;
  type: 'contact' | 'bug';
  email?: string;
}): Promise<Partial<Report> & { confirmation_email_sent?: boolean }> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<Partial<Report> & { confirma. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<Partial<Report> & { confirmation_email_sent?: boolean }>>('/reports', payload);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchMySubscription: Lấy yêu cầu thuê bao mới nhất của tài khoản đang đăng nhập.
/**
 * Hàm/thành phần fetchMySubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchMySubscription(): Promise<Subscription | null> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Subscription | null>>('/subsc. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Subscription | null>>('/subscriptions/me');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm createReaderSubscription: Gửi yêu cầu thanh toán Premium/VIP và nhận thông tin chuyển khoản.
/**
 * Hàm/thành phần createReaderSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: plan.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function createReaderSubscription(
  plan: 'premium_monthly' | 'vip_monthly',
): Promise<Subscription> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<Subscription>>('/subscriptio. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<Subscription>>('/subscriptions', { plan });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm streamPublicBook: Lấy nội dung file qua API bảo vệ JWT/quyền đọc, không gọi URL kho lưu trữ trực tiếp.
/**
 * Hàm/thành phần streamPublicBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent, isAxiosError, text, parse, Error.
 */
export async function streamPublicBook(bookId: string): Promise<Blob> {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến response nhận giá trị từ await api.get<Blob>(`/books/${encodeURIComponent(bookId. const không gán lại; let có thể cập nhật.
    const response = await api.get<Blob>(`/books/${encodeURIComponent(bookId)}/stream`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf,application/epub+zip,*/*' },
    });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: response.data.
    return response.data;
  } catch (error: unknown) {
    // if chỉ chạy nhánh này khi điều kiện axios.isAxiosError(error) && error.response?.data instanceof Blob đúng.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      // Biến responseText nhận giá trị từ await error.response.data.text(). const không gán lại; let có thể cập nhật.
      const responseText = await error.response.data.text();
      // if chỉ chạy nhánh này khi điều kiện responseText đúng.
      if (responseText) {
        // Biến payload nhận giá trị từ chưa khởi tạo. const không gán lại; let có thể cập nhật.
        let payload: { message?: unknown } | undefined;
        // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
        try {
          // Gọi/thực thi JSON.parse với đối số để cập nhật logic/giao diện: payload = JSON.parse(responseText) as { message?: unknown }
          payload = JSON.parse(responseText) as { message?: unknown };
        } catch {
          // Gọi/thực thi biểu thức để cập nhật logic/giao diện: payload = undefined
          payload = undefined;
        }
        // if chỉ chạy nhánh này khi điều kiện typeof payload?.message === 'string' đúng.
        if (typeof payload?.message === 'string') throw new Error(payload.message);
      }
    }
    // throw phát sinh lỗi để hàm gọi phía trên xử lý.
    throw error;
  }
}

// Hàm downloadProtectedBook: Tải file từ endpoint riêng chỉ cấp quyền cho VIP đang hoạt động hoặc ADMIN.
/**
 * Hàm/thành phần downloadProtectedBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, title.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent, createObjectURL, createElement, replace, trim, append, click, remove.
 */
export async function downloadProtectedBook(bookId: string, title: string): Promise<void> {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến { data } nhận giá trị từ await api.get<Blob>(`/downloads/${encodeURIComponent(bo. const không gán lại; let có thể cập nhật.
    const { data } = await api.get<Blob>(`/downloads/${encodeURIComponent(bookId)}`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf,application/epub+zip,*/*' },
    });
    // Biến url nhận giá trị từ URL.createObjectURL(data). const không gán lại; let có thể cập nhật.
    const url = URL.createObjectURL(data);
    // Biến anchor nhận giá trị từ document.createElement('a'). const không gán lại; let có thể cập nhật.
    const anchor = document.createElement('a');
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: anchor.href = url
    anchor.href = url;
    // Gọi/thực thi title.replace với đối số để cập nhật logic/giao diện: anchor.download = `${title.replace(/[<>:"/\\|?*]/g, '').trim() || 'openbook'}.pd
    anchor.download = `${title.replace(/[<>:"/\\|?*]/g, '').trim() || 'openbook'}.pdf`;
    // Gọi/thực thi document.body.append với đối số để cập nhật logic/giao diện: document.body.append(anchor)
    document.body.append(anchor);
    // Gọi/thực thi anchor.click với đối số để cập nhật logic/giao diện: anchor.click()
    anchor.click();
    // Gọi/thực thi anchor.remove với đối số để cập nhật logic/giao diện: anchor.remove()
    anchor.remove();
    // Gọi/thực thi URL.revokeObjectURL với đối số để cập nhật logic/giao diện: URL.revokeObjectURL(url)
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    // if chỉ chạy nhánh này khi điều kiện axios.isAxiosError(error) && error.response?.data instanceof Blob đúng.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      // Biến message nhận giá trị từ await responseErrorMessage(error.response.data). const không gán lại; let có thể cập nhật.
      const message = await responseErrorMessage(error.response.data);
      // if chỉ chạy nhánh này khi điều kiện message đúng.
      if (message) throw new Error(message);
    }
    // throw phát sinh lỗi để hàm gọi phía trên xử lý.
    throw error;
  }
}

// Hàm responseErrorMessage: Giải mã JSON lỗi do API trả về dưới dạng Blob khi request tải file thất bại.
/**
 * Hàm/thành phần responseErrorMessage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: blob.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: text, parse.
 */
async function responseErrorMessage(blob: Blob): Promise<string> {
  // Biến text nhận giá trị từ await blob.text(). const không gán lại; let có thể cập nhật.
  const text = await blob.text();
  // if chỉ chạy nhánh này khi điều kiện !text đúng.
  if (!text) return '';
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến payload nhận giá trị từ JSON.parse(text) as { message?: unknown }. const không gán lại; let có thể cập nhật.
    const payload = JSON.parse(text) as { message?: unknown };
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: typeof payload.message === 'string' ? payload.message : ''.
    return typeof payload.message === 'string' ? payload.message : '';
  } catch {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ''.
    return '';
  }
}

// Hàm storeSession: Lưu token và hồ sơ đăng nhập để interceptor và route guard dùng chung.
/**
 * Hàm/thành phần storeSession: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: setItem, stringify.
 */
export function storeSession(payload: AuthPayload): void {
  // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token)
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
  // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

// Hàm clearSession: Xóa phiên local khi đăng xuất hoặc refresh token không còn hợp lệ.
/**
 * Hàm/thành phần storeUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: user.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: setItem, stringify.
 */
function storeUser(user: User): void {
  // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Hàm/thành phần clearSession: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: removeItem.
 */
export function clearSession(): void {
  // Gọi/thực thi localStorage.removeItem với đối số để cập nhật logic/giao diện: localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Gọi/thực thi localStorage.removeItem với đối số để cập nhật logic/giao diện: localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Gọi/thực thi localStorage.removeItem với đối số để cập nhật logic/giao diện: localStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY);
}

/**
 * Hàm/thành phần uploadExcelApi: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: formData.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: getItem, post.
 */
export async function uploadExcelApi(formData: FormData) {
    // Biến token nhận giá trị từ localStorage.getItem(ACCESS_TOKEN_KEY). const không gán lại; let có thể cập nhật.
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    // Biến response nhận giá trị từ await api.post("/books/import-excel", formData, { heade. const không gán lại; let có thể cập nhật.
    const response = await api.post("/books/import-excel", formData, {
        headers: {
            ...token ? {
                Authorization: `Bearer ${token}`
            } : {}
        }
    });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: response.data.
    return response.data;
}

// Hàm refreshAccessToken: Xoay refresh token một lần và dùng chung promise cho các request đồng thời.
// Biến refreshRequest nhận giá trị từ null. const không gán lại; let có thể cập nhật.
let refreshRequest: Promise<string> | null = null;
/**
 * Hàm/thành phần performRefresh: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: failedAccessToken optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: getItem, Error, storeSession, clearSession, dispatchEvent, CustomEvent.
 */
async function performRefresh(failedAccessToken?: string): Promise<string> {
  // Biến currentAccessToken nhận giá trị từ localStorage.getItem(ACCESS_TOKEN_KEY). const không gán lại; let có thể cập nhật.
  const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  // Another tab may already have refreshed while this request waited for the lock.
  // if chỉ chạy nhánh này khi điều kiện failedAccessToken && currentAccessToken && currentAccessToken !== failedAccessTo đúng.
  if (failedAccessToken && currentAccessToken && currentAccessToken !== failedAccessToken) return currentAccessToken;
  // Biến refreshToken nhận giá trị từ localStorage.getItem(REFRESH_TOKEN_KEY). const không gán lại; let có thể cập nhật.
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  // if chỉ chạy nhánh này khi điều kiện !refreshToken đúng.
  if (!refreshToken) throw new Error('Refresh token is missing');

  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến { data } nhận giá trị từ await axios.post<ApiEnvelope<AuthPayload>>( `${API_BASE. const không gán lại; let có thể cập nhật.
    const { data } = await axios.post<ApiEnvelope<AuthPayload>>(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 20_000, headers: { Accept: 'application/json' } },
    );
    // Gọi/thực thi storeSession với đối số để cập nhật logic/giao diện: storeSession(data.data)
    storeSession(data.data);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.access_token.
    return data.data.access_token;
  } catch (error: unknown) {
    // A different tab can rotate the token while this request is in flight. Never
    // erase that newer session because this tab's copy of the old token was rejected.
    // Biến latestRefreshToken nhận giá trị từ localStorage.getItem(REFRESH_TOKEN_KEY). const không gán lại; let có thể cập nhật.
    const latestRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    // Biến latestAccessToken nhận giá trị từ localStorage.getItem(ACCESS_TOKEN_KEY). const không gán lại; let có thể cập nhật.
    const latestAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    // if chỉ chạy nhánh này khi điều kiện latestRefreshToken && latestRefreshToken !== refreshToken && latestAccessToken đúng.
    if (latestRefreshToken && latestRefreshToken !== refreshToken && latestAccessToken) return latestAccessToken;
    // Gọi/thực thi clearSession với đối số để cập nhật logic/giao diện: clearSession()
    clearSession();
    // Gọi/thực thi window.dispatchEvent với đối số để cập nhật logic/giao diện: window.dispatchEvent(new CustomEvent('openbook:session-expired'))
    window.dispatchEvent(new CustomEvent('openbook:session-expired'));
    // throw phát sinh lỗi để hàm gọi phía trên xử lý.
    throw error;
  }
}

/**
 * Hàm/thành phần refreshAccessToken: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: failedAccessToken optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: performRefresh, as, refresh, finally.
 */
async function refreshAccessToken(failedAccessToken?: string): Promise<string> {
  // if chỉ chạy nhánh này khi điều kiện !refreshRequest đúng.
  if (!refreshRequest) {
    /**
     * Hàm/thành phần refresh: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: performRefresh.
     */
    const refresh = () => performRefresh(failedAccessToken);
    // Biến task nhận giá trị từ typeof navigator !== 'undefined' && 'locks' in navigato. const không gán lại; let có thể cập nhật.
    const task: Promise<string> = typeof navigator !== 'undefined' && 'locks' in navigator
      ? (navigator.locks.request as unknown as (name: string, callback: () => Promise<string>) => Promise<string>)(
        'openbook-auth-refresh', refresh,
      )
      : refresh();
    // Biến pending nhận giá trị từ task .finally(() => { refreshRequest = null; }). const không gán lại; let có thể cập nhật.
    const pending = task
      .finally(() => {
        // Gọi/thực thi biểu thức để cập nhật logic/giao diện: refreshRequest = null
        refreshRequest = null;
      });
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: refreshRequest = pending
    refreshRequest = pending;
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: pending.
    return pending;
  }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: refreshRequest!.
  return refreshRequest!;
}

// Gọi/thực thi api.interceptors.request.use với đối số để cập nhật logic/giao diện: api.interceptors.request.use((config) => { const token = localStorage.getItem(AC
api.interceptors.request.use((config) => {
  // Biến token nhận giá trị từ localStorage.getItem(ACCESS_TOKEN_KEY). const không gán lại; let có thể cập nhật.
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  // if chỉ chạy nhánh này khi điều kiện token đúng.
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: config.
  return config;
});

// Gọi/thực thi api.interceptors.response.use với đối số để cập nhật logic/giao diện: api.interceptors.response.use( (response) => response, async (error: AxiosError<
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    // Biến config nhận giá trị từ error.config as RetriableRequest | undefined. const không gán lại; let có thể cập nhật.
    const config = error.config as RetriableRequest | undefined;
    // Biến url nhận giá trị từ config?.url || ''. const không gán lại; let có thể cập nhật.
    const url = config?.url || '';
    
    // Bỏ qua nếu là request auth hoặc chính là request import-excel đang bị lỗi
    // Biến isAuthRequest nhận giá trị từ url.includes('/auth/'). const không gán lại; let có thể cập nhật.
    const isAuthRequest = url.includes('/auth/');
    // Biến isImportRequest nhận giá trị từ url.includes('books/import-excel'). const không gán lại; let có thể cập nhật.
    const isImportRequest = url.includes('books/import-excel');

    // Chỉ ghi log 401 khi đúng là lỗi xác thực; trước đây hai dòng log này chạy với mọi lỗi,
    // khiến HTTP 404 cũng bị hiểu nhầm là lỗi refresh token.
    // if chỉ chạy nhánh này khi điều kiện error.response?.status === 401 đúng.
    if (error.response?.status === 401) {
      // Gọi/thực thi console.warn với đối số để cập nhật logic/giao diện: console.warn('API trả về HTTP 401 từ URL:', url)
      console.warn('API trả về HTTP 401 từ URL:', url);
      // Gọi/thực thi console.warn với đối số để cập nhật logic/giao diện: console.warn('Refresh token có tồn tại không?', !!localStorage.getItem(REFRESH_T
      console.warn('Refresh token có tồn tại không?', !!localStorage.getItem(REFRESH_TOKEN_KEY));
    } else if (error.response?.status) {
      // Gọi/thực thi console.error với đối số để cập nhật logic/giao diện: console.error(`API trả về HTTP ${error.response.status} từ URL: ${url}`, error.r
      console.error(`API trả về HTTP ${error.response.status} từ URL: ${url}`, error.response.data);
    }

    // 1. Thử refresh token nếu thỏa điều kiện
    // if chỉ chạy nhánh này khi điều kiện error.response?.status === 401 && config && !config._retry && !isAuthRequest &&  đúng.
    if (error.response?.status === 401 && config && !config._retry && !isAuthRequest && !isImportRequest
      && localStorage.getItem(REFRESH_TOKEN_KEY)) {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: config._retry = true
      config._retry = true;
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến authorization nhận giá trị từ String(config.headers.get('Authorization') || ''). const không gán lại; let có thể cập nhật.
        const authorization = String(config.headers.get('Authorization') || '');
        // Biến failedAccessToken nhận giá trị từ /^Bearer\s+(.+)$/i.exec(authorization)?.[1]. const không gán lại; let có thể cập nhật.
        const failedAccessToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
        // Biến token nhận giá trị từ await refreshAccessToken(failedAccessToken). const không gán lại; let có thể cập nhật.
        const token = await refreshAccessToken(failedAccessToken);
        // Gọi/thực thi biểu thức để cập nhật logic/giao diện: config.headers.Authorization = `Bearer ${token}`
        config.headers.Authorization = `Bearer ${token}`;
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: api.request(config).
        return api.request(config);
      } catch (refreshError) {
        // Nếu refresh thất bại, dừng ngay tại đây và reject lỗi, không thả trôi xuống dưới
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Promise.reject(refreshError).
        return Promise.reject(refreshError);
      }
    }

    // 2. Nếu là import-excel hoặc auth request mà vẫn bị 401, TUYỆT ĐỐI KHÔNG clearSession tự động ở đây
    // if chỉ chạy nhánh này khi điều kiện error.response?.status === 401 && !isAuthRequest && !isImportRequest đúng.
    if (error.response?.status === 401 && !isAuthRequest && !isImportRequest) {
      // Gọi/thực thi clearSession với đối số để cập nhật logic/giao diện: clearSession()
      clearSession();
      // Gọi/thực thi window.dispatchEvent với đối số để cập nhật logic/giao diện: window.dispatchEvent(new CustomEvent('openbook:session-expired'))
      window.dispatchEvent(new CustomEvent('openbook:session-expired'));
    }

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Promise.reject(error).
    return Promise.reject(error);
  },
);

// Hàm errorMessage: Đổi lỗi Axios/Joi thành nội dung ngắn gọn để hiển thị trong form và bảng quản trị.
/**
 * Hàm/thành phần errorMessage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: error.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: map, join, i.
 */
export function errorMessage(error: unknown): string {
  // if chỉ chạy nhánh này khi điều kiện axios.isAxiosError<ApiEnvelope<unknown>>(error) đúng.
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    // Biến payload nhận giá trị từ error.response?.data. const không gán lại; let có thể cập nhật.
    const payload = error.response?.data;
    // if chỉ chạy nhánh này khi điều kiện payload?.violations?.length đúng.
    if (payload?.violations?.length) {
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: payload.violations.map(({ field, message }) => `${field}: ${message}`).join(' · .
      return payload.violations.map(({ field, message }) => `${field}: ${message}`).join(' · ');
    }
    // if chỉ chạy nhánh này khi điều kiện payload?.message đúng.
    if (payload?.message) return payload.message;
    // if chỉ chạy nhánh này khi điều kiện !error.response đúng.
    if (!error.response) return 'Không kết nối được máy chủ. Hãy kiểm tra API đang chạy và VITE_API_URL.';
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: `Yêu cầu thất bại (HTTP ${error.response.status}).`.
    return `Yêu cầu thất bại (HTTP ${error.response.status}).`;
  }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: error instanceof Error ? error.message : 'Đã có lỗi không xác định.'.
  return error instanceof Error ? error.message : 'Đã có lỗi không xác định.';
}

// Hàm requestRegistrationCode: Tạo tài khoản chưa xác minh và yêu cầu backend gửi mã OTP qua email.
/**
 * Hàm/thành phần requestRegistrationCode: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: name, phoneNumber, email, password.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: post.
 */
export async function requestRegistrationCode(
  name: string,
  phoneNumber: string,
  email: string,
  password: string,
): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.post('/auth/register', { name, phone_number: phoneNumber, email, passw
  await api.post('/auth/register', { name, phone_number: phoneNumber, email, password });
}

// Hàm verifyRegistrationEmail: Gửi OTP để xác minh email, lưu phiên đăng nhập được cấp sau xác minh.
/**
 * Hàm/thành phần verifyRegistrationEmail: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: email, otp.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: storeSession.
 */
export async function verifyRegistrationEmail(email: string, otp: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<AuthPayload>>('/auth/verify-. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/verify-email', { email, otp });
  // Gọi/thực thi storeSession với đối số để cập nhật logic/giao diện: storeSession(data.data)
  storeSession(data.data);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.user.
  return data.data.user;
}

// Hàm resendRegistrationCode: Yêu cầu gửi lại OTP cho địa chỉ email đang chờ xác minh.
/**
 * Hàm/thành phần resendRegistrationCode: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: email.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: post.
 */
export async function resendRegistrationCode(email: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.post('/auth/resend-verification', { email })
  await api.post('/auth/resend-verification', { email });
}

// Hàm signIn: Gửi thông tin đăng nhập, lưu cặp token và trả về hồ sơ user từ API.
/**
 * Hàm/thành phần signIn: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: email, password.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: storeSession.
 */
export async function signIn(email: string, password: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<AuthPayload>>('/auth/login',. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/login', { email, password });
  // Gọi/thực thi storeSession với đối số để cập nhật logic/giao diện: storeSession(data.data)
  storeSession(data.data);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.user.
  return data.data.user;
}

// Hàm signInAdmin: Đăng nhập qua endpoint chỉ cấp token cho tài khoản có role ADMIN.
/**
 * Hàm/thành phần signInAdmin: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: email, password.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: storeSession.
 */
export async function signInAdmin(email: string, password: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<AuthPayload>>('/auth/admin-l. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/admin-login', { email, password });
  // Gọi/thực thi storeSession với đối số để cập nhật logic/giao diện: storeSession(data.data)
  storeSession(data.data);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.user.
  return data.data.user;
}

// Hàm fetchCurrentUser: Xác minh access token với API và trả hồ sơ dùng để phân quyền giao diện.
/**
 * Hàm/thành phần fetchCurrentUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchCurrentUser(): Promise<User> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<User>>('/auth/me'). const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<User>>('/auth/me');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

/**
 * Hàm/thành phần updateMyProfile: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: storeUser.
 */
export async function updateMyProfile(payload: { name: string; phone_number?: string | null }): Promise<User> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<User>>('/auth/me', payload). const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<User>>('/auth/me', payload);
  // Gọi/thực thi storeUser với đối số để cập nhật logic/giao diện: storeUser(data.data)
  storeUser(data.data);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

/**
 * Hàm/thành phần uploadMyAvatar: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: file.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: FormData, append, storeUser.
 */
export async function uploadMyAvatar(file: File): Promise<User> {
  // Biến form nhận giá trị từ new FormData(). const không gán lại; let có thể cập nhật.
  const form = new FormData();
  // Gọi/thực thi form.append với đối số để cập nhật logic/giao diện: form.append('avatar', file)
  form.append('avatar', file);
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<User>>('/auth/me/avatar', fo. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<User>>('/auth/me/avatar', form);
  // Gọi/thực thi storeUser với đối số để cập nhật logic/giao diện: storeUser(data.data)
  storeUser(data.data);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

/**
 * Hàm/thành phần changeMyPassword: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: current_password, new_password.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: post, clearSession, dispatchEvent, CustomEvent.
 */
export async function changeMyPassword(current_password: string, new_password: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.post('/auth/change-password', { current_password, new_password })
  await api.post('/auth/change-password', { current_password, new_password });
  // Gọi/thực thi clearSession với đối số để cập nhật logic/giao diện: clearSession()
  clearSession();
  // Gọi/thực thi window.dispatchEvent với đối số để cập nhật logic/giao diện: window.dispatchEvent(new CustomEvent('openbook:session-expired'))
  window.dispatchEvent(new CustomEvent('openbook:session-expired'));
}

// Hàm signOut: Thu hồi refresh token phía server trước khi dọn phiên trên trình duyệt.
/**
 * Hàm/thành phần signOut: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: post, clearSession.
 * Được tham chiếu tại: admin-web/src/pages/SettingsPage.tsx.
 */
export async function signOut(): Promise<void> {
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.post('/auth/logout')
    await api.post('/auth/logout');
  } finally {
    // Gọi/thực thi clearSession với đối số để cập nhật logic/giao diện: clearSession()
    clearSession();
  }
}

// Hàm fetchBooks: Tải trang sách quản trị, bao gồm cả draft, theo query đã được backend validation.
/**
 * Hàm/thành phần fetchBooks: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchBooks(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
}): Promise<BookListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Book[]>>('/admin/books', { pa. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Book[]>>('/admin/books', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API danh sách sách không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { books: data.data, pagination: data.pagination }.
  return { books: data.data, pagination: data.pagination };
}

// Interface BookImportCandidate quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
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

// Interface BookImportSearchResult quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
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

/**
 * Hàm/thành phần searchBookImportCandidates: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: query.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function searchBookImportCandidates(query: string): Promise<BookImportSearchResult> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<BookImportSearchResult>>('/ad. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<BookImportSearchResult>>('/admin/book-import/search', {
    params: { q: query },
    timeout: 90000,
  });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

/**
 * Hàm/thành phần importBookCandidate: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: pageTitle, confirmLicense, confirmCover.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function importBookCandidate(pageTitle: string, confirmLicense: boolean, confirmCover: boolean): Promise<{
  status: 'imported' | 'already_imported' | 'duplicate';
  book: Book;
}> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<{ status: 'imported' | 'alre. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<{ status: 'imported' | 'already_imported' | 'duplicate'; book: Book }>>(
    '/admin/book-import/import', { pageTitle, confirmLicense, confirmCover }, { timeout: 180000 },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm createBook: Gửi dữ liệu form sách mới đến endpoint quản trị.
/**
 * Hàm/thành phần createBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload, pdfFile mặc định null, onProgress optional.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: FormData, entries, forEach, append, String, onUploadProgress, onProgress, round.
 * Được tham chiếu tại: src/services/book.service.js.
 */
export async function createBook(
  payload: BookFormPayload,
  pdfFile: File | null = null,
  onProgress?: (percentage: number) => void,
): Promise<Book> {
  // Biến requestBody nhận giá trị từ payload. const không gán lại; let có thể cập nhật.
  let requestBody: BookFormPayload | FormData = payload;
  // if chỉ chạy nhánh này khi điều kiện pdfFile đúng.
  if (pdfFile) {
    // Biến formData nhận giá trị từ new FormData(). const không gán lại; let có thể cập nhật.
    const formData = new FormData();
    // Gọi/thực thi Object.entries với đối số để cập nhật logic/giao diện: Object.entries(payload).forEach(([key, value]) => { if (value !== null && value
    Object.entries(payload).forEach(([key, value]) => {
      // if chỉ chạy nhánh này khi điều kiện value !== null && value !== undefined đúng.
      if (value !== null && value !== undefined) formData.append(key, String(value));
    });
    // Gọi/thực thi formData.append với đối số để cập nhật logic/giao diện: formData.append('file', pdfFile)
    formData.append('file', pdfFile);
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: requestBody = formData
    requestBody = formData;
  }
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<Book>>('/admin/books', reque. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<Book>>('/admin/books', requestBody, {
    ...(onProgress ? {
      /**
       * Hàm/thành phần onUploadProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
       * Tham số/props: event.
       * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
       * Gọi tiếp: onProgress, round.
       */
      onUploadProgress(event) {
        // if chỉ chạy nhánh này khi điều kiện event.total đúng.
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    } : {}),
  });
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateBook: Cập nhật sách hiện có, backend chỉ lưu các trường thuộc model Book.
/**
 * Hàm/thành phần updateBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 * Được tham chiếu tại: src/services/book.service.js.
 */
export async function updateBook(bookId: string, payload: BookFormPayload): Promise<Book> {
  // Biến { data } nhận giá trị từ await api.put<ApiEnvelope<Book>>(`/admin/books/${encode. const không gán lại; let có thể cập nhật.
  const { data } = await api.put<ApiEnvelope<Book>>(`/admin/books/${encodeURIComponent(bookId)}`, payload);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteBook: Xóa sách và các dữ liệu chương/tương tác liên quan qua endpoint quản trị.
/**
 * Hàm/thành phần deleteBook: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/book.service.js.
 */
export async function deleteBook(bookId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/admin/books/${encodeURIComponent(bookId)}`)
  await api.delete(`/admin/books/${encodeURIComponent(bookId)}`);
}

// Hàm uploadBookFile: Gửi file sách dạng multipart tới kho riêng và báo tiến độ upload cho giao diện.
/**
 * Hàm/thành phần uploadBookFile: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: bookId, file, onProgress.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: FormData, append, encodeURIComponent, onUploadProgress, onProgress, round.
 */
export async function uploadBookFile(
  bookId: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<{ book_id: string; original_name: string }> {
  // Biến formData nhận giá trị từ new FormData(). const không gán lại; let có thể cập nhật.
  const formData = new FormData();
  // Gọi/thực thi formData.append với đối số để cập nhật logic/giao diện: formData.append('file', file)
  formData.append('file', file);
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<{ book_id: string; original_. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<{ book_id: string; original_name: string }>>(
    `/admin/books/${encodeURIComponent(bookId)}/file`,
    formData,
    {
      /**
       * Hàm/thành phần onUploadProgress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
       * Tham số/props: event.
       * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
       * Gọi tiếp: onProgress, round.
       */
      onUploadProgress(event) {
        // if chỉ chạy nhánh này khi điều kiện event.total đúng.
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchChapters: Tải danh sách chương quản trị theo trang, từ khóa tiêu đề và cấp truy cập.
/**
 * Hàm/thành phần fetchChapters: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchChapters(params: {
  page: number;
  limit: number;
  search?: string;
  access_level?: string;
}): Promise<ChapterListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Chapter[]>>('/admin/chapters'. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Chapter[]>>('/admin/chapters', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API danh sách chương không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { chapters: data.data, pagination: data.pagination }.
  return { chapters: data.data, pagination: data.pagination };
}

// Hàm createChapter: Tạo chương mới theo schema API và trả DTO chương đã lưu.
/**
 * Hàm/thành phần createChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: src/services/chapter.service.js.
 */
export async function createChapter(payload: ChapterFormPayload): Promise<Chapter> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<Chapter>>('/admin/chapters',. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<Chapter>>('/admin/chapters', payload);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateChapter: Cập nhật tiêu đề, nội dung, thứ tự, quyền đọc hoặc ngày phát hành chương.
/**
 * Hàm/thành phần updateChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: chapterId, payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 * Được tham chiếu tại: src/services/chapter.service.js.
 */
export async function updateChapter(chapterId: string, payload: ChapterUpdatePayload): Promise<Chapter> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<Chapter>>( `/admin/chapters. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<Chapter>>(
    `/admin/chapters/${encodeURIComponent(chapterId)}`,
    payload,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteChapter: Xóa một chương bằng endpoint quản trị và báo lỗi nếu API từ chối yêu cầu.
/**
 * Hàm/thành phần deleteChapter: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: chapterId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/chapter.service.js.
 */
export async function deleteChapter(chapterId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/admin/chapters/${encodeURIComponent(chapterId)}`)
  await api.delete(`/admin/chapters/${encodeURIComponent(chapterId)}`);
}

// Hàm fetchUsers: Lấy danh sách tài khoản quản trị theo bộ lọc role, từ khóa và phân trang.
/**
 * Hàm/thành phần fetchUsers: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}): Promise<UserListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<User[]>>('/admin/users', { pa. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<User[]>>('/admin/users', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API danh sách người dùng không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { users: data.data, pagination: data.pagination }.
  return { users: data.data, pagination: data.pagination };
}

// Hàm fetchRecentUsers: Tải tối đa 50 tài khoản mới nhất cho bảng tổng quan ADMIN.
/**
 * Hàm/thành phần fetchRecentUsers: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export async function fetchRecentUsers(): Promise<User[]> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<User[]>>('/admin/users/recent. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<User[]>>('/admin/users/recent');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchUser: Lấy hồ sơ chi tiết một tài khoản theo ID qua endpoint ADMIN.
/**
 * Hàm/thành phần fetchUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: userId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchUser(userId: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<User>>(`/admin/users/${encode. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<User>>(`/admin/users/${encodeURIComponent(userId)}`);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm createUser: Tạo tài khoản độc giả mới qua API ADMIN.
/**
 * Hàm/thành phần createUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Được tham chiếu tại: src/services/user.service.js.
 */
export async function createUser(payload: UserFormPayload): Promise<User> {
  // Biến { data } nhận giá trị từ await api.post<ApiEnvelope<User>>('/admin/users', paylo. const không gán lại; let có thể cập nhật.
  const { data } = await api.post<ApiEnvelope<User>>('/admin/users', payload);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateUser: Cập nhật hồ sơ hoặc role bằng payload được backend validation cho phép.
/**
 * Hàm/thành phần updateUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: userId, payload.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 * Được tham chiếu tại: src/services/user.service.js.
 */
export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<User>>(`/admin/users/${enco. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<User>>(`/admin/users/${encodeURIComponent(userId)}`, payload);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteUser: Xóa tài khoản qua API quản trị cùng quy tắc dọn dữ liệu liên quan của backend.
/**
 * Hàm/thành phần deleteUser: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: userId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/user.service.js.
 */
export async function deleteUser(userId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/admin/users/${encodeURIComponent(userId)}`)
  await api.delete(`/admin/users/${encodeURIComponent(userId)}`);
}

// Hàm grantVip: Cấp quyền VIP đến thời điểm hết hạn đã được ADMIN chọn.
/**
 * Hàm/thành phần grantVip: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: userId, vipExpiresAt.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function grantVip(userId: string, vipExpiresAt: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<User>>( `/admin/users/${enc. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<User>>(
    `/admin/users/${encodeURIComponent(userId)}/vip`,
    { vip_expires_at: vipExpiresAt },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm grantPremium: Cấp quyền Premium đến thời điểm hết hạn do ADMIN chọn.
/**
 * Hàm/thành phần grantPremium: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: userId, premiumExpiresAt.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function grantPremium(userId: string, premiumExpiresAt: string): Promise<User> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<User>>( `/admin/users/${enc. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<User>>(
    `/admin/users/${encodeURIComponent(userId)}/premium`,
    { premium_expires_at: premiumExpiresAt },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm fetchSubscriptions: Tải yêu cầu thuê bao theo trạng thái, gói và phân trang.
/**
 * Hàm/thành phần fetchSubscriptions: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchSubscriptions(params: {
  page: number;
  limit: number;
  status?: string;
  plan?: string;
}): Promise<SubscriptionListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Subscription[]>>('/admin/subs. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Subscription[]>>('/admin/subscriptions', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API thuê bao không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { subscriptions: data.data, pagination: data.pagination }.
  return { subscriptions: data.data, pagination: data.pagination };
}

// Hàm fetchPendingSubscriptions: Lấy riêng yêu cầu thuê bao đang chờ xét duyệt.
/**
 * Hàm/thành phần fetchPendingSubscriptions: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchPendingSubscriptions(): Promise<SubscriptionListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Subscription[]>>('/admin/subs. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Subscription[]>>('/admin/subscriptions/pending');
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API thuê bao chờ duyệt không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { subscriptions: data.data, pagination: data.pagination }.
  return { subscriptions: data.data, pagination: data.pagination };
}

// Hàm fetchSubscription: Lấy chi tiết một yêu cầu thuê bao qua endpoint ADMIN.
/**
 * Hàm/thành phần fetchSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: subscriptionId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchSubscription(subscriptionId: string): Promise<Subscription> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Subscription>>( `/admin/subsc. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateSubscriptionPaymentReference: Cập nhật mã giao dịch ghi chú của yêu cầu còn chờ duyệt.
/**
 * Hàm/thành phần updateSubscriptionPaymentReference: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: subscriptionId, paymentReference.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function updateSubscriptionPaymentReference(
  subscriptionId: string,
  paymentReference: string,
): Promise<Subscription> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<Subscription>>( `/admin/sub. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { payment_reference: paymentReference },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm reviewSubscription: Duyệt hoặc từ chối yêu cầu chuyển khoản để backend cập nhật quyền tương ứng.
/**
 * Hàm/thành phần reviewSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: subscriptionId, decision.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function reviewSubscription(subscriptionId: string, decision: 'approve' | 'reject'): Promise<Subscription> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<Subscription>>( `/admin/sub. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<Subscription>>(
    `/admin/subscriptions/${encodeURIComponent(subscriptionId)}/${decision}`,
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteSubscription: Xóa yêu cầu thuê bao đang chờ xử lý.
/**
 * Hàm/thành phần deleteSubscription: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: subscriptionId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/subscription.service.js.
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/admin/subscriptions/${encodeURIComponent(subscriptionId)}`)
  await api.delete(`/admin/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

// Hàm fetchReports: Lấy báo cáo theo trạng thái, từ khóa subject/email và phân trang.
/**
 * Hàm/thành phần fetchReports: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: params.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: Error.
 */
export async function fetchReports(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): Promise<ReportListResponse> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Report[]>>('/admin/reports', . const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Report[]>>('/admin/reports', { params });
  // if chỉ chạy nhánh này khi điều kiện !data.pagination đúng.
  if (!data.pagination) throw new Error('API báo cáo không trả dữ liệu phân trang.');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: { reports: data.data, pagination: data.pagination }.
  return { reports: data.data, pagination: data.pagination };
}

// Hàm fetchReport: Lấy nội dung chi tiết báo cáo theo ID qua endpoint ADMIN.
/**
 * Hàm/thành phần fetchReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: reportId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 */
export async function fetchReport(reportId: string): Promise<Report> {
  // Biến { data } nhận giá trị từ await api.get<ApiEnvelope<Report>>(`/admin/reports/${en. const không gán lại; let có thể cập nhật.
  const { data } = await api.get<ApiEnvelope<Report>>(`/admin/reports/${encodeURIComponent(reportId)}`);
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm updateReport: Cập nhật trạng thái xử lý một báo cáo qua endpoint quản trị.
/**
 * Hàm/thành phần updateReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: reportId, status.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: encodeURIComponent.
 * Được tham chiếu tại: src/services/report.service.js.
 */
export async function updateReport(reportId: string, status: Report['status']): Promise<Report> {
  // Biến { data } nhận giá trị từ await api.patch<ApiEnvelope<Report>>( `/admin/reports/$. const không gán lại; let có thể cập nhật.
  const { data } = await api.patch<ApiEnvelope<Report>>(
    `/admin/reports/${encodeURIComponent(reportId)}`,
    { status },
  );
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: data.data.
  return data.data;
}

// Hàm deleteReport: Xóa báo cáo không còn cần theo dõi khỏi hệ thống.
/**
 * Hàm/thành phần deleteReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: reportId.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: delete, encodeURIComponent.
 * Được tham chiếu tại: src/services/report.service.js.
 */
export async function deleteReport(reportId: string): Promise<void> {
  // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await api.delete(`/admin/reports/${encodeURIComponent(reportId)}`)
  await api.delete(`/admin/reports/${encodeURIComponent(reportId)}`);
}

// Interface BookFormPayload quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
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

// Interface ChapterFormPayload quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface ChapterFormPayload {
  book_id: string;
  title: string;
  content: string;
  chapter_number: number;
  access_level: Book['access_level'];
  published_at: string;
}

// Kiểu ChapterUpdatePayload mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
export type ChapterUpdatePayload = Omit<ChapterFormPayload, 'book_id'>;

// Interface UserFormPayload quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
export interface UserFormPayload {
  name: string;
  email: string;
  phone_number: string;
  password: string;
}

// Kiểu UserUpdatePayload mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
export type UserUpdatePayload = Partial<Omit<UserFormPayload, 'password'>> & {
  password?: string;
  role?: User['role'];
};
