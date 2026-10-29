export type UserRole = 'ADMIN' | 'USER';
export type BookCategory = 'ebook' | 'audiobook' | 'comic' | 'webnovel';
export type BookGenre = 'van_hoc_viet_nam' | 'truyen_ngan_viet_nam' | 'tho_viet_nam' | 'van_hoc_dan_gian' | 'van_hoc_the_gioi' | 'kinh_doanh' | 'phat_trien_ban_than' | 'tam_ly_hoc' | 'lich_su' | 'khoa_hoc';
export type BookAccess = 'free' | 'premium' | 'vip';
export type BookStatus = 'draft' | 'published';
export type BookReaderMode = 'chapters' | 'pdf' | 'unsupported' | 'unavailable';

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_premium?: boolean;
  premium_expires_at?: string | null;
  is_vip?: boolean;
  vip_expires_at?: string | null;
  createdAt?: string;
}

export interface UserReference {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  role?: UserRole;
}

export interface Comment {
  _id: string;
  id?: string;
  body: string;
  rating: number | null;
  book: string | { _id?: string; id?: string; title?: string; slug?: string };
  user: string | UserReference;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  _id: string;
  id?: string;
  book: string | { _id?: string; id?: string; title?: string; slug?: string; cover_url?: string };
  chapter: string | { _id?: string; id?: string; title?: string; slug?: string; chapter_number?: number };
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  _id: string;
  id?: string;
  book: string | { _id?: string; id?: string; title?: string; author_name?: string; slug?: string; cover_url?: string };
  chapters_since_ad: number;
  total_chapter_reads: number;
  completed_chapter_count?: number;
  completed_chapters_since_ad?: number;
  last_read_chapter?: string | { _id?: string; id?: string; title?: string; slug?: string; chapter_number?: number; access_level?: BookAccess };
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  id?: string;
  plan: 'vip_monthly' | 'premium_monthly';
  amount_vnd: number;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  starts_at?: string | null;
  expires_at?: string | null;
  payment_reference?: string | null;
  transfer_note: string;
  user: string | UserReference;
  reviewed_by?: string | UserReference | null;
  
  // Các trường phục vụ Webhook tự động
  gateway?: 'manual' | 'momo' | 'sepay' | 'casso' | string;
  transaction_id?: string | null;
  auto_approved?: boolean;

  payment_instructions?: {
    amount_vnd?: number;
    transfer_note?: string;
    bank_name?: string | null;
    bank_account?: string | null;
    bank_account_name?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  id?: string;
  email: string;
  subject: string;
  message: string;
  type: 'contact' | 'bug';
  status: 'open' | 'in_progress' | 'resolved';
  user?: string | UserReference | null;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  id?: string;
  title: string;
  slug?: string;
  author_name: string;
  category: BookCategory;
  genre?: BookGenre;
  publication_year: number | null;
  description: string;
  cover_url: string;
  access_level: BookAccess;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
  import_source?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  license_name?: string | null;
  license_url?: string | null;
  cover_source_url?: string | null;
  cover_license_name?: string | null;
  cover_license_url?: string | null;
  cover_attribution?: string | null;
  language?: string | null;
  file_format?: string | null;
  file_size?: number | null;
  verified_at?: string | null;
  reader_mode?: BookReaderMode;
}

export interface ChapterBookReference {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category?: BookCategory;
  cover_url?: string;
}

// Gộp chung thành một interface Chapter duy nhất, tránh khai báo đè gây lỗi trùng lặp
export interface Chapter {
  _id: string;
  id?: string;
  book_id: string | ChapterBookReference;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  chapter_number: number;
  access_level: BookAccess;
  published_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadChapterResult {
  book_id: string;
  chapter: { id: string; title: string; order: number; content: string };
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  pagination?: PaginationData;
  violations?: Array<{ field: string; message: string }>;
}
