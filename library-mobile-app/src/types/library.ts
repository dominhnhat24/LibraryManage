// Kiểu dữ liệu miền thư viện dùng chung cho phản hồi API và các màn hình quản lý.
// Các trường tham chiếu có thể là ID dạng chuỗi hoặc đối tượng đã được API populate.
// Các trạng thái miền được máy chủ dùng cho độc giả, bản sao, phiếu, tình trạng trả và tiền phạt.
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

// Đầu sách được dùng trong danh mục và tham chiếu chi tiết mượn.
export interface Book {
  // Thông tin đầu sách; các thuộc tính mô tả bổ sung có thể vắng mặt trong dữ liệu API.
  _id: string;
  isbn?: string;
  title: string;
  author: string;
  publish_year?: number;
  category?: string;
  description?: string;
}

// Bản sao vật lý của đầu sách với trạng thái lưu thông riêng.
export interface BookCopy {
  // Một bản sao vật lý liên kết tới đầu sách và có trạng thái lưu thông riêng.
  _id: string;
  bookId: string | Book;
  status: BookCopyStatus;
}

// Hồ sơ độc giả có thông tin liên hệ tùy chọn và trạng thái tài khoản.
export interface Reader {
  // Hồ sơ độc giả có thông tin liên hệ tùy chọn và trạng thái tài khoản.
  _id: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: ReaderStatus;
}

// Một bản sao thuộc phiếu mượn, kèm thông tin trả nếu đã được ghi nhận.
export interface BorrowDetail {
  // Chi tiết một bản sao trong phiếu, bao gồm thời điểm và tình trạng khi trả.
  bookId: string | Book;
  copyId: string | BookCopy;
  returnedAt?: string;
  condition?: ReturnCondition;
}

// Phiếu mượn chứa độc giả, thủ thư phụ trách, thời hạn và các bản sao.
export interface BorrowCard {
  // Phiếu mượn gắn độc giả, các mốc thời gian và danh sách chi tiết mượn/trả.
  _id: string;
  readerId: string | Reader;
  librarianId?: string;
  borrowedAt: string;
  dueDate: string;
  status: BorrowCardStatus;
  details: BorrowDetail[];
}

// Khoản phạt gắn phiếu/độc giả cùng số tiền, lý do và trạng thái thanh toán.
export interface Fine {
  // Khoản phạt gắn phiếu và độc giả; hai tham chiếu có thể chưa được populate.
  _id: string;
  borrowCardId: string | Pick<BorrowCard, '_id'> | null;
  readerId: string | Reader | null;
  amount: number;
  reason: FineReason;
  status: FineStatus;
}
