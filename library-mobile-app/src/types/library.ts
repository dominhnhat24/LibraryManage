// Các kiểu miền OpenBook cho tài khoản, danh mục và gói VIP.
import type { UserRole } from '@/services/api';

export type BookCategory = 'ebook' | 'audiobook' | 'comic' | 'webnovel';

export interface Book {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  category?: BookCategory | string;
  description?: string;
  coverImage?: string;
  content?: string;
  body?: string;
  fileUrl?: string;
  language?: string;
  publishedAt?: string;
}

export interface ApiUser {
  _id?: string;
  id?: string;
  name?: string;
  full_name?: string;
  email: string;
  role: UserRole;
}

export interface Subscription {
  _id?: string;
  id?: string;
  plan?: string;
  status?: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export function getBookId(book: Book): string {
  return book._id ?? book.id ?? '';
}
