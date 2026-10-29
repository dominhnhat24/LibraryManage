# Báo cáo tổng quan Backend OpenBook

**Ngày lập:** 11/10/2026  
**Phạm vi:** Chỉ phần backend trong repository `LibraryManage`; không mô tả ứng dụng mobile.

## 1. Tóm tắt dự án

Backend OpenBook cung cấp REST API cho nền tảng đọc sách số. Các chức năng chính gồm tài khoản và phiên đăng nhập, danh mục sách/chương, phân quyền đọc nội dung Free/Premium/VIP, thuê bao thanh toán thủ công, bình luận, bookmark, tiến độ đọc, báo cáo hỗ trợ và quản trị nội dung.

Ứng dụng được viết bằng Node.js ES modules, Express 5 và MongoDB thông qua Mongoose. API được gom dưới tiền tố `/api/v1`. Phần xử lý được chia theo routes, controllers, services, models, middlewares và validations.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ / thư viện | Vai trò |
|---|---|---|
| Runtime | Node.js, ES modules | Chạy backend |
| HTTP API | Express 5 | Router, middleware và HTTP server |
| Cơ sở dữ liệu | MongoDB, Mongoose 8 | Lưu trữ dữ liệu và định nghĩa schema |
| Kiểm tra đầu vào | Joi | Kiểm tra body và route params |
| Xác thực | JSON Web Token, `jsonwebtoken` | Access token và refresh token |
| Mã hóa mật khẩu | `bcryptjs` | Băm và xác minh mật khẩu |
| CORS | `cors` | Giới hạn nguồn gọi API |
| Upload | Multer | Nhận tệp sách vào bộ nhớ trước khi ghi kho riêng |
| Email | Nodemailer | Gửi email báo cáo/hỗ trợ theo cấu hình SMTP |
| Slug | `slugify` | Sinh đường dẫn thân thiện SEO |
| Kiểm thử | Node.js test runner | `npm test` |

## 3. Kiến trúc backend

Luồng xử lý một request thông thường:

```text
HTTP request
  -> middleware chung (logger, CORS, parse body)
  -> route theo chức năng
  -> xác thực JWT / phân quyền (nếu cần)
  -> Joi validation
  -> controller
  -> service nghiệp vụ
  -> Mongoose model
  -> MongoDB
  -> JSON response hoặc error middleware
```

- **Routes** khai báo endpoint và thứ tự middleware.
- **Controllers** đọc dữ liệu từ request, gọi service hoặc nghiệp vụ chuyên biệt và tạo HTTP response.
- **Services** gom CRUD, lọc/phân trang, kiểm tra quan hệ và quy tắc nghiệp vụ.
- **Models** định nghĩa schema, enum, index, quan hệ tham chiếu và các phương thức của tài khoản.
- **Middlewares** xử lý xác thực, phân quyền, validation, quảng cáo theo lượt đọc, logging và lỗi tập trung.
- **Utils / constants** chứa lỗi API, xử lý slug, bảo vệ kho file, vai trò, trạng thái và giới hạn phân trang.

## 4. Cấu trúc thư mục

```text
server.js
src/
  config/          Cấu hình MongoDB và mail
  constants/       Vai trò, trạng thái, phân trang
  controllers/     Bộ tiếp nhận request và trả response
  middlewares/     Xác thực, role, validation, logging, quảng cáo, lỗi
  models/          Mongoose schemas
  routes/          Các nhóm API
  services/        CRUD và nghiệp vụ
  utils/           ApiError, async handler, slug, kho file riêng tư
  validations/     Joi schemas cho body và params
scripts/
  seed-admin.js          Tạo/cập nhật tài khoản ADMIN đầu tiên
  migrate-user-roles.js  Chuyển role dữ liệu cũ về ADMIN/USER
test/
  openbook-api.test.js
  openbook-models.test.js
  validation.test.js
  download-security.test.js
```

Các service nghiệp vụ hiện có: `book`, `chapter`, `user`, `subscription`, `bookmark`, `reading-progress`, `comment` và `report`. Xác thực JWT được xử lý trong `auth.controller.js`; luồng OTP legacy đã được gỡ vì không có route sử dụng.

## 5. Mô hình dữ liệu

| Model | Dữ liệu/chức năng chính | Ràng buộc đáng chú ý |
|---|---|---|
| `User` | Tên, email, số điện thoại, password hash, role, quyền VIP/Premium, thời hạn, refresh token hash | Role chỉ `ADMIN` hoặc `USER`; email duy nhất; mật khẩu và refresh token không được select mặc định |
| `Book` | Tiêu đề, slug, tác giả, danh mục, năm, mô tả, ảnh bìa, cấp truy cập, khóa file, chủ sở hữu, trạng thái | Danh mục ebook/audiobook/comic/webnovel; trạng thái draft/published; file key ẩn khỏi truy vấn mặc định |
| `Chapter` | Sách cha, tiêu đề, slug, nội dung, thứ tự, cấp truy cập, ngày xuất bản | `chapter_number` duy nhất trong cùng một sách |
| `Subscription` | User, gói tháng, số tiền, trạng thái, thời gian hiệu lực, tham chiếu thanh toán, mã chuyển khoản, người duyệt | Mỗi user tối đa một yêu cầu `pending`; trạng thái pending/active/rejected/expired |
| `Comment` | Sách, user, nội dung, điểm đánh giá | Một bình luận/đánh giá mỗi user trên mỗi sách; rating từ 1 đến 5 |
| `Bookmark` | User, sách, chương | Một bookmark cho một sách trên mỗi user |
| `ReadingProgress` | User, sách, số chương từ quảng cáo gần nhất, tổng lượt mở chương | Một tiến độ cho một sách trên mỗi user |
| `Report` | User tùy chọn, email, chủ đề, nội dung, loại và trạng thái | Có thể gửi khi chưa đăng nhập; trạng thái open/in_progress/resolved |
### Tách vai trò và quyền thuê bao

`ADMIN` / `USER` dùng để kiểm soát quyền quản trị API. VIP và Premium là entitlement độc lập trên User, có cờ và ngày hết hạn riêng:

- **Free / USER:** đọc nội dung Free; có thể nhận quảng cáo theo chu kỳ lượt đọc.
- **Premium còn hạn:** đọc nội dung Premium và VIP, không nhận quảng cáo.
- **VIP còn hạn:** quyền VIP và đọc không quảng cáo; không tự động được tải file Premium.
- **Premium còn hạn:** quyền Premium, bao gồm quyền VIP và tải file theo chính sách Premium.
- **ADMIN:** được cấp quyền đọc và tải theo logic của model entitlement, đồng thời có quyền quản trị API.

## 6. Danh sách API hiện tại

Tất cả endpoint nằm dưới `/api/v1`. Các route quản trị dùng `verifyToken` và `requireAdmin` ở cấp router; các route cá nhân yêu cầu access token. Token gửi trong header `Authorization` theo dạng `Bearer TOKEN`.

### 6.1. Health check và xác thực

| Method | Endpoint | Truy cập | Chức năng |
|---|---|---|---|
| `GET` | `/` | Công khai | Health check |
| `POST` | `/auth/register` | Công khai | Tạo tài khoản USER và phát cặp token |
| `POST` | `/auth/login` | Công khai | Xác minh thông tin đăng nhập, phát cặp token |
| `POST` | `/auth/refresh` | Refresh token | Xoay refresh token và phát cặp token mới |
| `POST` | `/auth/logout` | Đăng nhập | Thu hồi refresh token hiện tại |
| `GET` | `/auth/me` | Đăng nhập | Trả hồ sơ công khai hiện tại |

Access token mặc định sống 15 phút, refresh token mặc định 7 ngày. Refresh token được lưu dưới dạng hash trong DB và được xoay sau khi sử dụng.

### 6.2. Sách và chương

| Method | Endpoint | Truy cập | Chức năng |
|---|---|---|---|
| `GET` | `/books` | Công khai | Liệt kê sách published, hỗ trợ tìm kiếm và lọc category/year |
| `GET` | `/books/:bookId` | Công khai, token tùy chọn | Xem metadata sách theo ObjectId hoặc slug |
| `GET` | `/books/:bookId/chapters` | Đăng nhập và có entitlement phù hợp | Liệt kê chương được phép đọc; chỉ trả metadata, có phân trang |
| `GET` | `/admin/books` | ADMIN | Tìm kiếm/lọc sách mọi trạng thái và phân trang |
| `POST` | `/books` | ADMIN | Tạo sách |
| `PUT` | `/books/:bookId` | ADMIN | Cập nhật sách |
| `DELETE` | `/books/:bookId` | ADMIN | Xóa sách và dữ liệu liên quan |
| `GET` | `/books/:bookId/stream` | Đăng nhập, theo cấp truy cập | Phát file inline từ kho riêng |
| `POST` | `/books/:bookId/chapters/:chapterId/read` | Đăng nhập, theo cấp truy cập | Kiểm tra quyền đọc sách/chương và tính trạng thái quảng cáo |
| `GET` | `/admin/chapters` | ADMIN | Liệt kê chương, có phân trang/lọc |
| `POST` | `/admin/chapters` | ADMIN | Tạo chương |
| `GET` | `/admin/chapters/:chapterId` | ADMIN | Lấy chương theo ObjectId hoặc slug |
| `PATCH` | `/admin/chapters/:chapterId` | ADMIN | Cập nhật chương |
| `DELETE` | `/admin/chapters/:chapterId` | ADMIN | Xóa chương |

Danh mục sách: `ebook`, `audiobook`, `comic`, `webnovel`. Sách/chương có cấp truy cập `free`, `premium` hoặc `vip`. Slug được tạo từ tiêu đề; slug tiếng Việt xử lý cả chữ `đ/Đ`.

### 6.3. Thuê bao và file tải xuống

| Method | Endpoint | Truy cập | Chức năng |
|---|---|---|---|
| `POST` | `/subscriptions` | Đăng nhập | Tạo yêu cầu gói VIP/Premium tháng |
| `GET` | `/subscriptions/me` | Đăng nhập | Xem trạng thái yêu cầu gần nhất của tài khoản |
| `GET` | `/downloads/:bookId` | Premium còn hạn hoặc ADMIN | Tải file từ kho riêng |
| `POST` | `/admin/books/:bookId/file` | ADMIN | Upload file sách; multipart field `file`, tối đa 100 MiB |
| `GET` | `/admin/subscriptions` | ADMIN | Liệt kê yêu cầu thuê bao |
| `GET` | `/admin/subscriptions/pending` | ADMIN | Liệt kê yêu cầu chờ xét duyệt |
| `GET` | `/admin/subscriptions/:subscriptionId` | ADMIN | Xem chi tiết yêu cầu |
| `PATCH` | `/admin/subscriptions/:subscriptionId` | ADMIN | Cập nhật tham chiếu thanh toán khi yêu cầu còn pending |
| `DELETE` | `/admin/subscriptions/:subscriptionId` | ADMIN | Xóa yêu cầu còn pending |
| `PATCH` | `/admin/subscriptions/:subscriptionId/approve` | ADMIN | Duyệt yêu cầu, cấp entitlement trong transaction |
| `PATCH` | `/admin/subscriptions/:subscriptionId/reject` | ADMIN | Từ chối yêu cầu pending |

Upload lưu file bằng UUID trong thư mục `BOOK_STORAGE_DIR` (mặc định `private-books`), không phục vụ tĩnh. Khi tải/stream, backend kiểm tra quyền và đường dẫn thực, chống path traversal và symlink thoát khỏi kho.

### 6.4. Người dùng và quản trị

| Method | Endpoint | Truy cập | Chức năng |
|---|---|---|---|
| `GET` | `/admin/users` | ADMIN | Tìm/lọc và phân trang tài khoản |
| `POST` | `/admin/users` | ADMIN | Tạo tài khoản USER qua service |
| `GET` | `/admin/users/recent` | ADMIN | Xem tối đa 50 tài khoản mới nhất |
| `GET` | `/admin/users/:userId` | ADMIN | Xem hồ sơ |
| `PATCH` | `/admin/users/:userId` | ADMIN | Cập nhật trường được cho phép |
| `DELETE` | `/admin/users/:userId` | ADMIN | Xóa tài khoản và dữ liệu liên quan trong transaction; dọn file của sách sở hữu |
| `PATCH` | `/admin/users/:userId/vip` | ADMIN | Cấp VIP đến thời điểm tương lai |
| `POST` | `/admin/books` | ADMIN | Tạo sách |
| `PUT` | `/admin/books/:bookId` | ADMIN | Cập nhật sách |
| `DELETE` | `/admin/books/:bookId` | ADMIN | Xóa sách |

Các trường password hash, refresh token hash, file key và user sở hữu không được nhận như dữ liệu tự do từ client trong các luồng tương ứng.

### 6.5. Bình luận, bookmark, tiến độ đọc và báo cáo

| Method | Endpoint | Truy cập | Chức năng |
|---|---|---|---|
| `GET` | `/books/:bookId/comments` | Công khai | Danh sách bình luận của sách |
| `POST` | `/books/:bookId/comments` | Đăng nhập | Tạo bình luận/đánh giá |
| `GET` | `/comments/:commentId` | Công khai | Xem bình luận |
| `PATCH` | `/comments/:commentId` | Chủ sở hữu hoặc ADMIN | Sửa nội dung/đánh giá |
| `DELETE` | `/comments/:commentId` | Chủ sở hữu hoặc ADMIN | Xóa bình luận |
| `GET`, `POST` | `/bookmarks` | Đăng nhập | Liệt kê/tạo bookmark của chính user |
| `GET`, `PATCH`, `DELETE` | `/bookmarks/:bookmarkId` | Chủ sở hữu | Xem/sửa/xóa bookmark |
| `GET`, `POST` | `/reading-progress` | Đăng nhập | Liệt kê/tạo tiến độ đọc của chính user |
| `GET`, `PATCH`, `DELETE` | `/reading-progress/:progressId` | Chủ sở hữu | Xem/sửa/xóa tiến độ đọc |
| `POST` | `/reports` | Công khai hoặc token tùy chọn | Gửi liên hệ/báo lỗi |
| `GET` | `/admin/reports` | ADMIN | Lọc và phân trang báo cáo |
| `GET` | `/admin/reports/:reportId` | ADMIN | Xem báo cáo |
| `PATCH` | `/admin/reports/:reportId` | ADMIN | Cập nhật trạng thái báo cáo |
| `DELETE` | `/admin/reports/:reportId` | ADMIN | Xóa báo cáo |

Mỗi thao tác bookmark/tiến độ chỉ truy cập dữ liệu thuộc tài khoản đang đăng nhập. Báo cáo được lưu trước khi thử gửi email; lỗi cấu hình SMTP hoặc gửi email được trả kèm mã báo cáo để có thể tra cứu lại.

## 7. Validation, response và xử lý lỗi

- Joi schemas ở `src/validations/model.validation.js` kiểm tra trường, enum, kích thước, ObjectId/slug params và từ chối trường không khai báo.
- `validateBody` ghi lại body đã chuẩn hóa; `validateParams` kiểm tra route params trước khi truy vấn.
- `asyncHandler` chuyển lỗi async đến error middleware.
- Lỗi nghiệp vụ dùng `ApiError` với HTTP status như 400, 401, 403, 404, 409, 502/503.
- Response thành công chủ yếu theo dạng `{ status: "success", data, ... }`; response lỗi được chuẩn hóa tại middleware xử lý lỗi.
- API dùng giới hạn JSON body 1 MiB; CORS cho phép origin cấu hình và một số origin nội bộ khi không chạy production.

## 8. Cấu hình môi trường

Các biến cấu hình được liệt kê trong `.env.example`:

| Biến | Mục đích |
|---|---|
| `PORT` | Cổng HTTP; mặc định trong server là 5001 |
| `MONGODB_URI` | URI MongoDB |
| `JWT_SECRET` | Bí mật JWT, server yêu cầu tối thiểu 32 ký tự |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` | Thời hạn access/refresh token |
| `CORS_ORIGINS` | Danh sách origin, phân tách bằng dấu phẩy |
| `BOOK_STORAGE_DIR` | Thư mục lưu file sách không public |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, `ADMIN_EMAIL` | SMTP và địa chỉ nhận báo cáo |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | Thông tin chạy seed ADMIN; mật khẩu tối thiểu 12 ký tự |
| `BANK_NAME`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME` | Thông tin hiển thị cho quy trình chuyển khoản thủ công |

Không đưa giá trị bí mật trong `.env` vào tài liệu hoặc log.

## 9. Cách chạy và kiểm thử dự kiến

```powershell
npm install
Copy-Item .env.example .env
# Cập nhật MONGODB_URI và JWT_SECRET trong .env
npm run seed:admin
npm run dev
```

Các script trong `package.json`:

- `npm start`: chạy server.
- `npm run dev`: chạy server với nodemon.
- `npm test`: chạy bộ kiểm thử Node.js.
- `npm run seed:admin`: tạo/cập nhật tài khoản ADMIN ban đầu.
- `npm run migrate:roles`: chuyển role dữ liệu cũ sang hai role hiện hành; cần sao lưu DB trước khi chạy migration.

Luồng duyệt subscription dùng MongoDB transaction; MongoDB phải chạy dưới replica set hoặc môi trường hỗ trợ transaction. URI mẫu trong `.env.example` có `replicaSet=rs0`.

## 10. Kiểm thử và kiểm tra hiện trạng

Lần kiểm tra ngày 11/10/2026:

- `npm test`: **32/32 test đạt**; bộ test không cần kết nối MongoDB.
- `npm audit --omit=dev`: **0 vulnerability** trong dependency production.
- `npm audit`: còn **3 cảnh báo high** trong chuỗi dependency phát triển `nodemon` / `chokidar` / `braces`. `npm audit fix --dry-run` chỉ đề xuất `--force` và hạ Nodemon xuống bản 1.x có breaking change; chưa áp dụng.
- Chưa chạy được integration test với MongoDB replica set: `localhost:27017` không reachable và process hiện tại không có `MONGODB_URI`. Cần chạy các kịch bản transaction, refresh/logout và CRUD cascade trên môi trường test chuyên dụng trước deploy.

## 11. Các điểm còn cần hoàn thiện trước khi phát hành

1. **Integration tests:** chạy với MongoDB replica set cho refresh token rotation/logout, duyệt subscription và cập nhật entitlement theo transaction, xóa tài khoản/sách/file, cũng như upload/stream/download và lọc catalog chương.
2. **Production readiness:** cấu hình chính xác `CORS_ORIGINS`, Redis rate limit, `TRUST_PROXY`, MongoDB replica set, SMTP và kho file persistent/private; thiết lập quy trình backup/restore cả MongoDB lẫn kho file.
3. **Dependency phát triển:** xử lý audit high ở Nodemon/Chokidar/Braces bằng cách cập nhật dependency có kiểm soát; không dùng `npm audit fix --force` khi nó thay đổi major version ngoài dự kiến.
4. **Health/readiness:** root `/` chỉ xác nhận tiến trình HTTP phản hồi, chưa xác nhận MongoDB/Redis sẵn sàng. Có thể bổ sung readiness probe trước khi triển khai nhiều instance.

Hợp đồng request/response dành cho frontend được ghi tại [API_CONTRACT.md](./API_CONTRACT.md); cần cập nhật tài liệu này cùng với mọi thay đổi route hoặc payload.

## 12. Kết luận

Backend hiện có các nhóm chức năng cốt lõi gồm xác thực JWT, phân quyền ADMIN/USER, entitlement Free/Premium/VIP, catalog sách, đọc chương, bookmark/tiến độ, thuê bao, báo cáo và quản trị. Test hiện tại xanh nhưng chưa thay thế integration test trên MongoDB. Trước khi hoàn thiện frontend đọc sách, cần chốt API danh sách chương; trước deploy cần xử lý các mục ở mục 11.
