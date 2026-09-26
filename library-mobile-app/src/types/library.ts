export type ReaderStatus = 'Active' | 'Blocked';
export type BookCopyStatus = 'Available' | 'Borrowed' | 'Damaged' | 'Lost' | 'Maintenance';
export type BorrowCardStatus =
  | 'Pending'
  | 'Borrowing'
  | 'PartiallyReturned'
  | 'Returned'
  | 'Overdue'
  | 'Cancelled';
export type ReturnCondition = 'Good' | 'Damaged' | 'Lost';
export type FineReason = 'Overdue' | 'Damaged' | 'Lost';
export type FineStatus = 'Pending' | 'Paid' | 'Waived';

export interface Book {
  _id: string;
  isbn?: string;
  title: string;
  author: string;
  publish_year?: number;
  category?: string;
  description?: string;
}

export interface BookCopy {
  _id: string;
  bookId: string | Book;
  status: BookCopyStatus;
}

export interface Reader {
  _id: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: ReaderStatus;
}

export interface BorrowDetail {
  bookId: string | Book;
  copyId: string | BookCopy;
  returnedAt?: string;
  condition?: ReturnCondition;
}

export interface BorrowCard {
  _id: string;
  readerId: string | Reader;
  librarianId?: string;
  borrowedAt: string;
  dueDate: string;
  status: BorrowCardStatus;
  details: BorrowDetail[];
}

export interface Fine {
  _id: string;
  borrowCardId: string | Pick<BorrowCard, '_id'> | null;
  readerId: string | Reader | null;
  amount: number;
  reason: FineReason;
  status: FineStatus;
}
