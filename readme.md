# HƯỚNG DẪN THIẾT KẾ MODULE, API VÀ ROADMAP DỰ ÁN QUẢN LÝ THƯ VIỆN

---

## PHẦN 1: PHÂN TÍCH MODULE & API CHI TIẾT (CHUẨN THỰC CHIẾN)

### 1. Module Auth & Users (Xác thực & Phân quyền)
* **Mục tiêu:** Quản lý đăng nhập, phân quyền cho Librarian (admin/staff) và Readers (nếu có tính năng độc giả tự login).
* **Các API cần có:**
* `POST /api/auth/login`: Nhận `user_name`/`email` và `password`, so sánh hash password, trả về JWT Token.
* `POST /api/auth/register`: (Dành cho Readers hoặc tạo Librarian mới bởi Admin).
* **Thành phần kỹ thuật:**
* **Middleware:** `verifyToken` (giải mã JWT, gán `req.user`), `checkRole` (kiểm tra quyền admin/staff).
* **Validation:** Joi/Zod kiểm tra định dạng email, độ dài password tối thiểu.

### 2. Module Books (Quản lý đầu sách)
* **Mục tiêu:** Quản lý thông tin chung của đầu sách.
* **Các API cần có:**
* `GET /api/books`: Lấy danh sách có phân trang (`page`, `limit`), tìm kiếm động (`search` trên `title`, `author`), lọc theo `category`, `publish_year`. Sử dụng `Promise.all` kết hợp `countDocuments`.
* `GET /api/books/:id`: Lấy chi tiết một đầu sách.
* `POST /api/books`: Tạo đầu sách mới (Chỉ Admin/Staff).
* `PUT /api/books/:id`: Cập nhật thông tin sách.
* `DELETE /api/books/:id`: Xóa sách (kiểm tra ràng buộc xem còn bản sao hay không trước khi xóa).
* **Thành phần kỹ thuật:**
* **Validation:** Bắt buộc có `title`, `author`, `publish_year`.

### 3. Module Book Copies (Quản lý bản sao sách trong kho)
* **Mục tiêu:** Quản lý từng cuốn sách vật lý cụ thể (mỗi bản có một mã riêng để mượn/trả).
* **Các API cần có:**
* `GET /api/book-copies`: Lấy danh sách bản sao (có filter theo `book_id`, `status` như `available`, `borrowed`).
* `POST /api/book-copies`: Thêm bản sao mới cho một `book_id` (kèm số lượng muốn tạo thêm).
* `PUT /api/book-copies/:id`: Cập nhật trạng thái bản sao.
* `DELETE /api/book-copies/:id`: Xóa bản sao.

### 4. Module Readers (Quản lý bạn đọc)
* **Mục tiêu:** Quản lý thông tin người mượn sách.
* **Các API cần có:**
* `GET /api/readers`: Lấy danh sách độc giả (có phân trang, tìm kiếm theo `full_name`, `phone`, `email`).
* `GET /api/readers/:id`: Xem lịch sử mượn sách của độc giả này.
* `POST /api/readers`: Thêm độc giả mới.
* `PUT /api/readers/:id`: Cập nhật thông tin.
* `DELETE /api/readers/:id`: Xóa/Khóa thẻ độc giả (đổi `status`).

### 4.1 Module Librarian (Thủ thư)
* **
### 5. Module Borrow Card (Nghiệp vụ Mượn - Trả sách) - Cốt lõi logic
* **Mục tiêu:** Xử lý toàn bộ luồng mượn và trả sách, tác động trực tiếp đến kho (`Books_Copies`) và tiền phạt (`Fines`).
* **Các API cần có:**
* `GET /api/borrow-cards`: Lấy danh sách phiếu mượn (filter theo `status`, `reader_id`, phân trang).
* `POST /api/borrow-cards`: Tạo phiếu mượn (Transaction):
1. Kiểm tra các `copies_id` có đang `available` hay không.
2. Tạo bản ghi trong `Borrow_Card`.
3. Tạo các bản ghi trong `Borrow_Card_Detail`.
4. Cập nhật trạng thái các `Books_Copies` thành `borrowed`.
* `PUT /api/borrow-cards/:id/return`: Trả sách (Transaction):
1. Cập nhật `returned_day` và `status_returned_date` trong `Borrow_Card_Detail`.
2. Cập nhật lại trạng thái `Books_Copies` về `available`.
3. Kiểm tra ngày trả có quá hạn (`due_date`) hay không. Nếu quá hạn, tự động sinh bản ghi phạt vào bảng `Fines`.

### 6. Module Fines (Quản lý tiền phạt)
* **Mục tiêu:** Theo dõi các khoản phạt do trả quá hạn hoặc làm hỏng sách.
* **Các API cần có:**
* `GET /api/fines`: Lấy danh sách phiếu phạt (filter theo `payment_status` như `paid`/`unpaid`, `reader_id`).
* `PUT /api/fines/:id/pay`: Cập nhật trạng thái thanh toán tiền phạt thành `paid`.

## PHẦN 2: HƯỚNG ĐI (ROADMAP) TRIỂN KHAI TỪNG MODULE

Để không bị rối và code chạy thông suốt, bắt buộc phải triển khai theo thứ tự phân tầng từ dưới lên trên (**Database -> Core Middleware -> Logic chính**):

### Bước 1: Setup Core & Models (Móng nhà)
1. Kết nối Database (Mongoose/Sequelize tùy chọn).
2. Viết toàn bộ các Mongoose Schema dựa chính xác trên ERD: `Books`, `Books_Copies`, `Librarian`, `Readers`, `Borrow_Card`, `Borrow_Card_Detail`, `Fines`. Đảm bảo định nghĩa đúng các kiểu dữ liệu và khóa ngoại (`ObjectId` reference).

### Bước 2: Viết Middleware dùng chung
1. **Error Handling Middleware:** Bắt lỗi tập trung (`try`/`catch` global) để các controller không phải viết lại lặp code `res.status(500)`.
2. **Auth Middleware (`verifyToken`, `checkRole`):** Dùng để bảo vệ các API yêu cầu đăng nhập.
3. **Validation Middleware:** Cấu hình Joi/Zod schema dùng chung cho việc validate dữ liệu đầu vào.

### Bước 3: Triển khai các Module độc lập (CRUD cơ bản trước)
1. **Module Readers & Librarian:** Viết API đăng nhập, tạo/sửa/xóa thông tin cơ bản.
2. **Module Books & Book Copies:** Viết API quản lý sách, áp dụng chuẩn phân trang, dynamic filter, `Promise.all` như đã phân tích ở phần trước.

### Bước 4: Triển khai Module Phức tạp nhất (Borrow Card)
1. Độc giả tạo phiếu mượn ở trạng thái `Pending`; thủ thư duyệt phiếu bằng transaction, đồng thời chuyển các bản sao khả dụng sang `Borrowed`.
2. Thủ thư nhận trả toàn bộ hoặc từng phần bằng transaction; cập nhật trạng thái bản sao và phát sinh `Fine` nếu quá hạn, hỏng hoặc mất.

### Bước 5: Hoàn thiện Module Fines & Test tổng thể
1. Xử lý API thanh toán tiền phạt.
2. Dùng Postman test toàn bộ luồng:
$$\text{Tạo sách} \rightarrow \text{Tạo độc giả} \rightarrow \text{Mượn sách} \rightarrow \text{Trả sách} \rightarrow \text{Phát sinh phạt}$$

## API backend hiện tại

- API được mount dưới tiền tố `/api/v1`; backend dùng MongoDB/Mongoose và ES Modules.
- `GET /api/v1/readers` và `GET /api/v1/readers/:id` chỉ dành cho Librarian vì dữ liệu trả về có thông tin cá nhân.
- Độc giả tạo/hủy phiếu mượn; Librarian duyệt/trả phiếu. Các thao tác duyệt/trả chỉ dùng namespace `/api/v1/borrow-cards/:id/approve|return`.
- Reader chỉ xem BorrowCard/Fine của chính mình; Librarian có thể truy vấn toàn bộ.
- `npm test` chạy các kiểm thử HTTP/RBAC không cần MongoDB. Để chạy transaction thực tế, cấu hình `MONGODB_URI` trỏ tới MongoDB Replica Set hoặc deployment hỗ trợ transactions.
- Cần cấu hình `JWT_SECRET` bằng chuỗi bí mật ngẫu nhiên đủ mạnh trước khi chạy server; ứng dụng sẽ từ chối khởi động nếu thiếu biến này.
- Có thể dùng [.env.example](./.env.example) làm mẫu; thay giá trị `JWT_SECRET` bằng secret riêng trước khi chạy và không commit file `.env`.
- Chạy kiểm thử luồng MongoDB thật bằng PowerShell: `$env:RUN_DB_INTEGRATION = '1'; npm test`. Test dùng dữ liệu định danh riêng và tự xóa các bản ghi mà nó tạo.