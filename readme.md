# Admin UI Implementation Status & Backend Gaps

## A. Các chức năng đã tích hợp

| Chức năng | API/model thực tế | Trạng thái | Ghi chú |
|---|---|---|---|
| Dashboard statistics | Không có endpoint tổng hợp; sử dụng các endpoint danh sách để tính tổng | Hoàn thành (partial) | Tổng số sách, chương, người dùng, thuê bao chờ duyệt và báo cáo mở được tính từ các endpoint riêng |
| Quản lý sách | `/admin/books` (GET, POST, PUT, DELETE) | Hoàn thành | |
| Quản lý chương | `/admin/chapters` (GET, POST, PUT, DELETE) | Hoàn thành | |
| Quản lý người dùng | `/admin/users` (GET, POST, PATCH, DELETE) | Hoàn thành | |
| Quản lý thuê bao | `/admin/subscriptions/pending`, `/admin/subscriptions/:id/approve`, `/admin/subscriptions/:id/reject` | Hoàn thành | |
| Quản lý báo cáo | `/admin/reports` (GET, PATCH, DELETE) | Hoàn thành | |
| Quản lý bình luận | `/books/:bookId/comments`, `/comments/:id` | Hoàn thành | |

## B. Backend gaps

| Chức năng | Thiếu API | Ghi chú |
|---|---|---|
| Tổng hợp dashboard (số liệu tổng quan) | Không có endpoint tổng hợp, phải tính thủ công từ các endpoint hiện có | Cần thêm API `/admin/dashboard-stats` để trả về object với các trường `books`, `chapters`, `users`, `pendingSubscriptions`, `openReports` |
| Biểu đồ lượt đọc theo thời gian | Không có endpoint thống kê lượt đọc | Cần API `/admin/reading-stats?range=weekly` trả về dữ liệu thời gian và lượt đọc |
| Biểu đồ phân bố thể loại sách | Không có endpoint thống kê thể loại | Cần API `/admin/category-stats` trả về {category, count} |
| Hoạt động gần đây (audit log) | Không có API ghi log hành động admin | Cần API `/admin/recent-activities` để trả về danh sách hành động gần đây |

## C. Lỗi hoặc giới hạn còn tồn tại

- Dashboard hiện không hiển thị biểu đồ vì thiếu API thống kê.
- Sidebar chưa có khả năng thu gọn trên màn hình nhỏ (responsive).
- Một số màu sắc và border radius chưa hoàn toàn khớp với thiết kế tham chiếu; cần tinh chỉnh CSS vars.


HarveyBook là nền tảng đọc nội dung số gồm REST API Node.js/Express 5, MongoDB/Mongoose và ứng dụng Expo trong `library-mobile-app/`. Backend hiện tập trung vào sách số, thuê bao, bình luận, quảng cáo theo lượt đọc và tải sách riêng tư; các nghiệp vụ mượn/trả thủ công, thủ thư và tiền phạt của dự án cũ đã được gỡ khỏi API.

## Công nghệ và chạy local

- Node.js 20+, npm và MongoDB Replica Set (ví dụ `rs0`, cần transaction khi duyệt Premium).
- Express 5, Mongoose 8, JWT, bcryptjs, Nodemailer và Multer.

```powershell
npm install
Copy-Item .env.example .env
```

Đặt `MONGODB_URI`, một `JWT_SECRET` ngẫu nhiên dài ít nhất 32 ký tự, cấu hình email nếu cần gửi report và cấu hình `BOOK_STORAGE_DIR`. Kho file mặc định `private-books/` không được phục vụ static và đã bị loại khỏi Git.

Trong production, đặt `RATE_LIMIT_REDIS_URL` (hoặc `REDIS_URL`) để chia sẻ bộ đếm rate limit giữa các instance; server từ chối khởi động production nếu chưa cấu hình Redis. Nếu API đứng sau reverse proxy, đặt `TRUST_PROXY` bằng số hop tin cậy hoặc danh sách IP/CIDR proxy cụ thể, ví dụ `TRUST_PROXY=1` cho đúng một proxy. Không đặt `TRUST_PROXY=true`; cấu hình trust proxy sai có thể khiến địa chỉ IP dùng cho rate limit bị giả mạo. Upload sách đối chiếu phần mở rộng, MIME type và magic bytes trước khi ghi file.

## Docker và Render

`Dockerfile` build frontend React/Vite và backend Node.js vào cùng một image. Trong production, frontend gọi `/api/v1` trên cùng origin; Express phục vụ SPA và endpoint kiểm tra sức khỏe `/health`.

Build và chạy thử image ở máy local:

```powershell
docker build -t harveybook .
docker run --rm -p 10000:10000 --env-file .env -e PORT=10000 harveybook
```

Khi tạo Render Web Service, chọn triển khai bằng Docker từ repository này và đặt Health Check Path là `/health`. Khai báo các biến môi trường production trên Render: `MONGODB_URI`, `JWT_SECRET`, `RATE_LIMIT_REDIS_URL` (hoặc `REDIS_URL`), `TRUST_PROXY=1`, cùng các biến email/Supabase nếu ứng dụng đang dùng. Render cấp URL HTTPS `onrender.com`; có thể thêm domain riêng sau khi service đã chạy rồi mới khai báo URL webhook SePay.

Lưu ý: sách và ảnh đại diện hiện lưu trong `BOOK_STORAGE_DIR` và `AVATAR_STORAGE_DIR` trên filesystem. Filesystem container không phải kho lưu trữ bền vững; trước khi nhận upload trên production, cần gắn persistent disk vào Render và đặt cả hai biến này vào thư mục được mount (ví dụ `/var/data/private-books` và `/var/data/private-avatars`), hoặc chuyển các file đó sang object storage. MongoDB và Redis cần là dịch vụ ngoài container để dữ liệu/rate limit tồn tại khi deploy lại.

Tạo admin đầu tiên bằng các biến `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (ít nhất 12 ký tự); có thể truyền `ADMIN_PHONE` để lưu số điện thoại, sau đó chạy:

```powershell
npm run seed:admin
npm run dev
```

API mặc định ở `http://localhost:5001`; `GET /` là health check. Chạy kiểm thử không yêu cầu MongoDB bằng `npm test`.

## Ứng dụng người đọc Expo

Ứng dụng người đọc nằm trong `library-mobile-app/`. Các luồng thiết yếu gồm đăng nhập/đăng ký có OTP email, tìm kiếm và lọc catalog, xem chi tiết và chương theo quyền đọc, lưu chương, đọc tiếp, hồ sơ và đăng ký Premium/VIP.

```powershell
Set-Location library-mobile-app
npm install
npm run start
```

Thiết lập `EXPO_PUBLIC_API_URL` nếu API không ở địa chỉ mặc định. Android emulator dùng `http://10.0.2.2:5001/api/v1`; thiết bị thật cần dùng địa chỉ LAN của máy chạy backend.

## Web admin React

Web React/Vite trong `admin-web/` cung cấp catalog/trang đọc cơ bản cho độc giả cùng console quản trị:

```powershell
Set-Location admin-web
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mặc định frontend gọi `http://localhost:5001/api/v1`; có thể đặt `VITE_API_URL` trong `admin-web/.env.local` để đổi API origin. Trang người đọc ở `/`, đăng nhập USER ở `/login`; đăng ký `/register` cần OTP email. Admin đăng nhập riêng ở `/admin/login`, khu vực quản trị nằm tại `/admin/dashboard` (alias `/admin`), sách (`/admin/books`), chương (`/admin/chapters`), người dùng (`/admin/users`), thuê bao (`/admin/subscriptions`) và báo cáo (`/admin/reports`). Admin tải PDF trong form sách; file được lưu ở kho riêng `BOOK_STORAGE_DIR`, không công khai URL nội bộ, và chỉ được stream sau khi backend kiểm tra JWT cùng entitlement. Giá riêng từng sách chưa có trong model; giao diện thể hiện mức truy cập Free/Premium/VIP.

## Vai trò và quyền đọc

Role quản trị chỉ có `USER` và `ADMIN`. Free/Premium/VIP là trạng thái quyền đọc (entitlement) của tài khoản, không phải role:

| Role / entitlement | Quyền đọc | Quảng cáo khi đọc | Tải offline |
| --- | --- | --- | --- |
| `USER`, không có gói còn hạn (Free) | Nội dung `free` | Có thể xuất hiện theo chu kỳ lượt đọc | Không |
| `USER`, VIP còn hạn | Nội dung `free` và `vip` | Không | Không |
| `USER`, Premium còn hạn | Nội dung `free`, `premium` và `vip` | Không | Có |
| `ADMIN` | Quản trị API và đọc nội dung | Không | Có |

Yêu cầu thuê bao tháng được tạo qua API và chỉ có hiệu lực sau khi ADMIN đối soát/duyệt. Model hiện chấp nhận `premium_monthly` và `vip_monthly`; phí lưu theo bản ghi thuê bao (mặc định 20.000 VND/tháng).

## API chính

Tất cả URL bên dưới dùng tiền tố `/api/v1`. API yêu cầu đăng nhập nhận `Authorization: Bearer <access_token>`.

| Phương thức | Endpoint | Quyền / chức năng |
| --- | --- | --- |
| `POST` | `/auth/register` | Tạo tài khoản USER chờ xác minh và gửi OTP email |
| `POST` | `/auth/verify-email` | Xác minh OTP, sau đó trả access và refresh token |
| `POST` | `/auth/resend-verification` | Gửi lại OTP cho tài khoản chưa xác minh |
| `POST` | `/auth/login` | Cổng đăng nhập USER; trả access và refresh token có role `USER` |
| `POST` | `/auth/admin-login` | Cổng đăng nhập ADMIN riêng; backend chỉ cấp token nếu role hiện tại là `ADMIN` |
| `POST` | `/auth/refresh` | Xoay refresh token; token cũ bị thu hồi |
| `POST` | `/auth/logout`, `GET /auth/me` | Cần đăng nhập |
| `GET` | `/books` | Tìm kiếm/lọc `title`, `author`, `year`, `category`, `search`; phân trang |
| `GET` | `/books/:bookId` | Metadata sách đã xuất bản theo ObjectId hoặc slug |
| `GET` | `/books/:bookId/chapters` | Cần đăng nhập; phân trang catalog chương, chỉ metadata chương theo entitlement |
| `POST` | `/books/:bookId/chapters/:chapterId/read` | Cần đăng nhập; kiểm tra quyền đọc và trả cờ quảng cáo |
| `GET` | `/books/:bookId/stream` | Cần đăng nhập; stream inline nội dung theo quyền Free/Premium/VIP, không lưu cache |
| `GET` | `/books/:bookId/comments`, `POST` cùng URL | Đọc công khai; tạo bình luận/đánh giá cần đăng nhập |
| `PATCH`, `DELETE` | `/comments/:commentId` | Chủ bình luận hoặc admin |
| `POST`, `GET` | `/subscriptions`, `/subscriptions/me` | Gửi yêu cầu thuê bao/chuyển khoản và xem yêu cầu mới nhất |
| `GET` | `/downloads/:bookId` | Chỉ Premium còn hạn/admin; tải file từ kho private |
| `POST`, `PUT`, `DELETE` | `/admin/books`, `/admin/books/:bookId` | Chỉ admin; tạo sách nhận JSON hoặc multipart `FormData` (metadata và PDF field `file` trong một request, tối đa 100 MiB), cập nhật/xóa sách |
| `POST` | `/admin/books/:bookId/file` | Admin; multipart field `file`, tối đa 100 MiB |
| `DELETE` | `/admin/users/:userId` | Admin; xóa user cùng bookmark, tiến độ, bình luận, báo cáo, thuê bao, sách/chương sở hữu và file sách private |
| `GET` | `/admin/users/recent` | Admin; tối đa 50 tài khoản mới nhất |
| `GET` | `/admin/subscriptions/pending` | Admin; chờ đối soát |
| `PATCH` | `/admin/subscriptions/:subscriptionId/approve` hoặc `/reject` | Admin; duyệt hoặc từ chối |
| `PATCH` | `/admin/users/:userId/vip` | Admin; cấp VIP bằng `vip_expires_at` |
| `POST` | `/reports` | Báo cáo lỗi/liên hệ; email tùy chọn nếu đã đăng nhập |

`category` nhận một trong `ebook`, `audiobook`, `comic`, `webnovel`. File upload được lưu với tên UUID trong thư mục riêng, key file không trả qua catalog. Tải xuống kiểm tra quyền tại mọi request, kiểm tra đường dẫn thực chống traversal/symlink và đặt header `no-store`/`nosniff`.

Catalog chương cho người đọc yêu cầu đăng nhập và chỉ liệt kê metadata của chương mà tài khoản có entitlement để đọc; nội dung chương chỉ được trả từ endpoint đọc sau khi kiểm tra quyền. `/admin/chapters` vẫn dành riêng cho ADMIN. Xem [API_CONTRACT.md](./API_CONTRACT.md) để biết payload và phân trang.

Ads API quyết định `showAd: true` ở mỗi lượt đọc chương thứ ba. Client chịu trách nhiệm chỉ render Google Ads khi phản hồi cho phép; Premium/VIP luôn nhận `showAd: false`. Không nhúng khóa Google Ads vào backend.

## Cấu hình email và chuyển khoản

Để gửi OTP đăng ký và email report, cấu hình trong `.env` ở thư mục gốc dự án. Tên khuyến nghị là `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`; `MAIL_FROM` có thể bỏ trống để dùng `MAIL_USER`. Các tên cũ `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` và `SMTP_FROM` cũng được hỗ trợ. Với Gmail, dùng `smtp.gmail.com`, cổng `587`, tài khoản Gmail và **Google App Password** (không dùng mật khẩu đăng nhập Gmail); bật xác minh 2 bước để tạo App Password. `ADMIN_EMAIL` là địa chỉ nhận report. Khởi động lại backend sau khi sửa `.env`. Đăng ký tạo tài khoản chờ xác minh; client xác minh mã 6 chữ số trong 5 phút qua `POST /auth/verify-email`, có thể yêu cầu gửi lại qua `POST /auth/resend-verification`. Tài khoản mới chỉ được đăng nhập sau khi xác minh; cấu hình SMTP thiếu/sai khiến đăng ký trả lỗi rõ ràng.

Đặt `BANK_NAME`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME` sau khi xác nhận tài khoản nhận tiền chính thức. API trả các thông tin này cùng mã nội dung chuyển khoản riêng cho từng yêu cầu; đối soát hiện tại là thủ công.

## Cấu trúc backend

```text
server.js
src/
  config/       # MongoDB
  models/       # User, Book, Chapter, Subscription, Comment, Bookmark, ReadingProgress, Report
  middlewares/  # JWT, role, ads cadence, lỗi
  controllers/  # Auth, books, subscription, downloads, comments, admin, reports
  routes/       # API versioned theo chức năng
scripts/seed-admin.js
test/           # Kiểm thử API và model không cần MongoDB
library-mobile-app/
```
