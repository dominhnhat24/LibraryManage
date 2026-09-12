-- 1. Bảng Books: Lưu thông tin gốc của các đầu sách
CREATE TABLE Books (
    book_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    publish_year INT,
    category VARCHAR(100),
    author VARCHAR(255) NOT NULL
);

-- 2. Bảng Books_Copies: Quản lý các bản sao vật lý của từng cuốn sách trong kho
CREATE TABLE Books_Copies (
    coppy_id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- Ví dụ: Available (có sẵn), Borrowed (đang mượn), Damaged (hỏng)
    CONSTRAINT fk_books_copies_book FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE CASCADE
);

-- 3. Bảng Librarian: Quản lý thông tin thủ thư và tài khoản đăng nhập
CREATE TABLE Librarian (
    librarian_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL UNIQUE,
    hash_pass VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    roll VARCHAR(50) NOT NULL -- Phân quyền: admin, staff,...
);

-- 4. Bảng Readers: Quản lý thông tin độc giả (thành viên thư viện)
CREATE TABLE Readers (
    reader_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50) NOT NULL -- Trạng thái: Active (hoạt động), Blocked (bị khóa)
);

-- 5. Bảng Borrow_Card: Quản lý thông tin chung của một phiếu mượn sách
CREATE TABLE Borrow_Card (
    borrow_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    librarian_id INT NOT NULL,
    borrow_day DATE NOT NULL,
    due_date DATE NOT NULL,
    Status VARCHAR(50) NOT NULL, -- Trạng thái phiếu: Borrowing (đang mượn), Returned (đã trả), Overdue (quá hạn)
    CONSTRAINT fk_borrow_reader FOREIGN KEY (reader_id) REFERENCES Readers(reader_id),
    CONSTRAINT fk_borrow_librarian FOREIGN KEY (librarian_id) REFERENCES Librarian(librarian_id)
);

-- 6. Bảng Borrow_Card_Detail: Chi tiết từng cuốn sách/bản sao cụ thể có trong phiếu mượn
CREATE TABLE Borrow_Card_Detail (
    detail_id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_id INT NOT NULL,
    copies_id INT NOT NULL,
    returned_day DATE, -- Ngày thực tế trả cuốn sách này
    status_returned_date VARCHAR(50), -- Trạng thái sách khi trả: Good, Lost, Damaged
    CONSTRAINT fk_detail_borrow FOREIGN KEY (borrow_id) REFERENCES Borrow_Card(borrow_id) ON DELETE CASCADE,
    CONSTRAINT fk_detail_copy FOREIGN KEY (copies_id) REFERENCES Books_Copies(coppy_id)
);

-- 7. Bảng Fines: Quản lý các khoản tiền phạt vi phạm (trả quá hạn, làm mất/hỏng sách)
CREATE TABLE Fines (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_id INT NOT NULL,
    reader_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL, -- Số tiền phạt
    reason TEXT, -- Lý do phạt
    payment_status VARCHAR(50) NOT NULL, -- Trạng thái thanh toán: Pending (chưa trả), Paid (đã trả)
    CONSTRAINT fk_fines_borrow FOREIGN KEY (borrow_id) REFERENCES Borrow_Card(borrow_id),
    CONSTRAINT fk_fines_reader FOREIGN KEY (reader_id) REFERENCES Readers(reader_id)
);