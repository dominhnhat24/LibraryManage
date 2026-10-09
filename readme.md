# OpenBook Platform (LibraryManage Evolution)

OpenBook là nền tảng đọc nội dung số gồm REST API Node.js/Express 5, MongoDB/Mongoose và ứng dụng Expo trong `library-mobile-app/`. Backend hiện tập trung vào sách số, thuê bao, bình luận, quảng cáo theo lượt đọc và tải sách riêng tư; các nghiệp vụ mượn/trả thủ công, thủ thư và tiền phạt của dự án cũ đã được gỡ khỏi API.

## Công nghệ và chạy local

- Node.js 20+, npm và MongoDB Replica Set (ví dụ `rs0`, cần transaction khi duyệt Premium).
- Express 5, Mongoose 8, JWT, bcryptjs, Nodemailer và Multer.

```powershell
npm install
Copy-Item .env.example .env
```

Đặt `MONGODB_URI`, một `JWT_SECRET` ngẫu nhiên dài ít nhất 32 ký tự, cấu hình email nếu cần gửi report và cấu hình `BOOK_STORAGE_DIR`. Kho file mặc định `private-books/` không được phục vụ static và đã bị loại khỏi Git.

Tạo admin đầu tiên bằng các biến `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (ít nhất 12 ký tự), sau đó chạy:

```powershell
npm run seed:admin
npm run dev
```

API mặc định ở `http://localhost:5001`; `GET /` là health check. Chạy kiểm thử không yêu cầu MongoDB bằng `npm test`.

## Vai trò và gói

| Tài khoản | Nội dung trả phí | Quảng cáo khi đọc | Tải offline |
| --- | --- | --- | --- |
| `free` | Không | Một quảng cáo sau mỗi ba lượt mở chương trên từng sách | Không |
| Premium đang hạn | Có | Không | Không |
| `vip` đang hạn | Có | Không | Có |
| `author` | Theo trạng thái nội dung/sản phẩm | Theo thuê bao | Không mặc định |
| `admin` | Có | Không | Có |

Premium có phí 20.000 VND mỗi tháng. Người dùng tạo yêu cầu chuyển khoản tại API; quyền chỉ được cấp sau khi admin đối soát và duyệt. VIP là quyền cao hơn Premium, chỉ được cấp qua thao tác quản trị với ngày hết hạn cụ thể.

## API chính

Tất cả URL bên dưới dùng tiền tố `/api/v1`. API yêu cầu đăng nhập nhận `Authorization: Bearer <access_token>`.

| Phương thức | Endpoint | Quyền / chức năng |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login` | Đăng ký Free, đăng nhập; trả access và refresh token |
| `POST` | `/auth/refresh` | Xoay refresh token; token cũ bị thu hồi |
| `POST` | `/auth/logout`, `GET /auth/me` | Cần đăng nhập |
| `GET` | `/books` | Tìm kiếm/lọc `title`, `author`, `year`, `category`, `search`; phân trang |
| `GET` | `/books/:bookId` | Metadata và chương; nội dung trả phí bị khóa với Free |
| `POST` | `/books/:bookId/chapters/:chapterId/read` | Cần đăng nhập; kiểm tra quyền đọc và trả cờ quảng cáo |
| `GET` | `/books/:bookId/stream` | Cần đăng nhập; stream inline nội dung theo quyền Free/Premium, không lưu cache |
| `GET` | `/books/:bookId/comments`, `POST` cùng URL | Đọc công khai; tạo bình luận/đánh giá cần đăng nhập |
| `PATCH`, `DELETE` | `/comments/:commentId` | Chủ bình luận hoặc admin |
| `POST`, `GET` | `/subscriptions`, `/subscriptions/me` | Gửi yêu cầu Premium/chuyển khoản và xem trạng thái |
| `GET` | `/downloads/:bookId` | Chỉ VIP còn hạn/admin; tải file từ kho private |
| `POST`, `PUT`, `DELETE` | `/admin/books`, `/admin/books/:bookId` | Chỉ admin; quản lý sách |
| `POST` | `/admin/books/:bookId/file` | Admin; multipart field `file`, tối đa 100 MiB |
| `GET` | `/books/mine` | Author xem các webnovel của chính mình |
| `GET` | `/admin/users/recent` | Admin; tối đa 50 tài khoản mới nhất |
| `GET` | `/admin/subscriptions/pending` | Admin; chờ đối soát |
| `PATCH` | `/admin/subscriptions/:subscriptionId/approve` hoặc `/reject` | Admin; duyệt hoặc từ chối |
| `PATCH` | `/admin/users/:userId/vip` | Admin; cấp VIP bằng `vip_expires_at` |
| `POST` | `/reports` | Báo cáo lỗi/liên hệ; email tùy chọn nếu đã đăng nhập |

`category` nhận một trong `ebook`, `audiobook`, `comic`, `webnovel`. File upload được lưu với tên UUID trong thư mục riêng, key file không trả qua catalog. Tải xuống kiểm tra quyền tại mọi request, kiểm tra đường dẫn thực chống traversal/symlink và đặt header `no-store`/`nosniff`.

Ads API quyết định `showAd: true` ở mỗi lượt đọc chương thứ ba. Client chịu trách nhiệm chỉ render Google Ads khi phản hồi cho phép; Premium/VIP luôn nhận `showAd: false`. Không nhúng khóa Google Ads vào backend.

## Cấu hình email và chuyển khoản

Để gửi email report, cấu hình `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, `ADMIN_EMAIL`. Nếu SMTP chưa cấu hình hoặc gửi thất bại, API trả lỗi rõ ràng và giữ report đã ghi trong DB để quản trị viên không mất nội dung.

Đặt `BANK_NAME`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME` sau khi xác nhận tài khoản nhận tiền chính thức. API trả các thông tin này cùng mã nội dung chuyển khoản riêng cho từng yêu cầu; đối soát hiện tại là thủ công.

## Cấu trúc backend

```text
server.js
src/
  config/       # MongoDB
  models/       # User, Book, Subscription, Comment, Report, ReadingProgress
  middlewares/  # JWT, role, ads cadence, lỗi
  controllers/  # Auth, books, subscription, downloads, comments, admin, reports
  routes/       # API versioned theo chức năng
scripts/seed-admin.js
test/           # Kiểm thử API và model không cần MongoDB
library-mobile-app/
```
