# OpenBook API contract for frontend

Tài liệu này ghi lại hành vi đang được triển khai trong routes/controllers backend, làm hợp đồng tích hợp cho frontend.

- Base URL local: `http://localhost:5001/api/v1`
- Endpoint cần đăng nhập nhận header `Authorization: Bearer <access_token>`.

## Quy ước response chung

- Response thành công dạng `{ "status": "success", "data": ... }`, đôi khi kèm `message` và/hoặc `pagination`.
- Lỗi dạng `{ "status": "error", "message": "..." }`; lỗi Joi có thể kèm `violations: [{ "field": "...", "message": "..." }]`.
- HTTP status thường gặp: `400` dữ liệu sai, `401` thiếu/xác thực không hợp lệ, `403` thiếu quyền, `404` không tìm thấy, `409` xung đột/trùng, `413` request/upload quá lớn và `429` vượt giới hạn.
- API phân trang mặc định `page=1`, `limit=20`; `limit` hiệu lực tối đa 50. Riêng `GET /reading-progress` chấp nhận `limit` cũ đến 100 nhưng chuẩn hóa kết quả về 50 để tương thích với client cũ. Phần lớn trả `pagination: { total, page, limit, totalPages }`. `GET /books` trả thêm `pages`, là bí danh của `totalPages`.
- Joi loại các trường body/query không khai báo; frontend không nên dựa vào việc gửi các trường không được hỗ trợ.
- Rate limit toàn API là 300 request/15 phút/IP; nhóm auth (trừ đăng nhập) là 30 request/15 phút/IP; riêng đăng nhập là 10 request/15 phút/IP.

## Xác thực

| Phương thức và path | Quyền truy cập | Request |
| --- | --- | --- |
| `POST /auth/register` | Công khai | `{ "name": "Reader", "email": "reader@example.com", "password": "at-least-8-chars", "phone_number": "" }`; có thể dùng `full_name` thay `name`, không gửi cả hai |
| `POST /auth/login` | Công khai | `{ "email": "reader@example.com", "password": "..." }` |
| `POST /auth/admin-login` | Công khai; chỉ tài khoản `ADMIN` hợp lệ mới nhận token | `{ "email": "admin@example.com", "password": "..." }` |
| `POST /auth/refresh` | Công khai, cần refresh token | `{ "refresh_token": "<refresh JWT>" }` |
| `POST /auth/logout` | Access token | Không cần body |
| `GET /auth/me` | Access token | Không cần body |

Đăng ký/xác minh/đăng nhập/refresh trả cặp token trong `data`; token JWT chứa claim `role`. `/auth/login` chỉ dành cho USER, `/auth/admin-login` chỉ cấp phiên cho ADMIN:

```json
{
  "status": "success",
  "data": {
    "access_token": "<JWT>",
    "token": "<same access JWT; compatibility field>",
    "refresh_token": "<JWT>",
    "token_type": "Bearer",
    "expires_in": "15m",
    "user": {
      "id": "<user id>",
      "name": "Reader",
      "email": "reader@example.com",
      "role": "USER",
      "is_premium": false,
      "is_vip": false
    }
  }
}
```

Đăng ký luôn tạo role `USER`, client không thể tự chọn `ADMIN`. Mỗi lần refresh thành công, token cũ bị xoay; frontend cần lưu refresh token mới. Logout thu hồi refresh token đã lưu, còn access token sẽ hết hạn theo TTL.

## Sách và đọc nội dung

| Phương thức và path | Quyền truy cập | Request / hành vi |
| --- | --- | --- |
| `GET /books` | Công khai | Query: `page`, `limit`, `search`, `title`, `author`, `year`, `category` (`ebook`, `audiobook`, `comic`, `webnovel`). Giá trị tìm kiếm được chọn theo thứ tự ưu tiên `search`, `title`, `author`; tìm không phân biệt hoa thường trong title/author. Chỉ trả sách published. |
| `GET /books/:bookId` | Công khai; token hợp lệ là tùy chọn | `bookId` có thể là ObjectId hoặc slug. Trả metadata sách published, không trả catalog chương. |
| `GET /admin/books` | ADMIN | Quản lý danh sách sách mọi trạng thái. Query `page`, `limit`, `search`, `category`, `status` (`draft`/`published`); trả `data` và `pagination`. |
| `POST /admin/books` | ADMIN | Tạo sách bằng JSON hoặc multipart `FormData`; metadata dùng các trường của book create schema, file PDF tùy chọn dùng field `file` (tối đa 100 MiB). Khi gửi PDF, metadata và file được lưu trong cùng request. |
| `GET /admin/book-import/search?q=...` | ADMIN | Tìm tác phẩm trên Wikisource tiếng Việt. Chỉ trả ứng viên có license tác phẩm nằm trong allowlist, nội dung tiếng Việt đủ dài, metadata và ảnh có thể kiểm chứng, ảnh có license được hỗ trợ, và WS Export xác nhận PDF sẵn sàng. |
| `POST /admin/book-import/import` | ADMIN | JSON `{ "pageTitle": "...", "confirmLicense": true, "confirmCover": true }`. Backend tải lại dữ liệu nguồn, chống import đồng thời/trùng, stream PDF giới hạn theo `BOOK_IMPORT_MAX_MB`, lưu ebook và bìa trong kho private, rồi tạo sách `free`/`published` kèm URL, license văn bản, license ảnh và thông tin ghi công. Không tự tạo thông báo license hay dữ liệu sách mẫu. |
| `GET /books/:bookId/cover` | Công khai | Trả ảnh bìa local của sách đã xuất bản; khóa file riêng tư không được trả về client. |
| `GET /books/:bookId/chapters` | Access token; quyền sách và entitlement chương được kiểm tra | `bookId` là ObjectId. Query `page`, `limit`. Trả danh sách metadata chương user hiện tại có thể đọc; không bao gồm nội dung chương. |
| `POST /books/:bookId/chapters/:chapterId/read` | Access token; kiểm tra quyền sách và chương | Không cần body. Trả nội dung chương và quyết định quảng cáo. |
| `GET /books/:bookId/stream` | Access token; kiểm tra quyền sách | Stream file nội dung inline; header `X-OpenBook-Show-Ad` và `X-OpenBook-Ad-Reason` mang quyết định quảng cáo. |
| `GET /downloads/:bookId` | Access token và Premium còn hạn hoặc ADMIN | Tải file riêng tư dưới dạng attachment. VIP-only không được tự động cấp quyền tải PDF Premium. |

Ví dụ response đọc chương:

```json
{
  "status": "success",
  "data": {
    "book_id": "<book id>",
    "chapter": {
      "id": "<chapter id>",
      "title": "Chapter 1",
      "order": 1,
      "content": "..."
    },
    "ad": { "showAd": false, "reason": "..." }
  }
}
```

`GET /admin/chapters` và các route CRUD chương vẫn chỉ dành cho `ADMIN`. Catalog `/books/:bookId/chapters` yêu cầu đăng nhập, lọc danh sách theo entitlement hiệu lực và không trả trường `content`; endpoint `/read` tiếp tục kiểm tra quyền trước khi trả nội dung.

## Bình luận, bookmark và tiến độ đọc

| Phương thức và path | Quyền truy cập | Request / hành vi |
| --- | --- | --- |
| `GET /books/:bookId/comments` | Công khai | Query `page`, `limit`, `search` tùy chọn; mới nhất trước |
| `POST /books/:bookId/comments` | Access token | `{ "body": "Comment text", "rating": 5 }`; có thể bỏ rating hoặc gửi `null`, nếu có phải là số nguyên 1-5 |
| `GET /comments/:commentId` | Công khai | Trả bình luận và tham chiếu tác giả/sách đã lọc |
| `PATCH /comments/:commentId` | Chủ sở hữu hoặc ADMIN | `{ "body": "Updated text" }`, `{ "rating": 4 }` hoặc cả hai |
| `DELETE /comments/:commentId` | Chủ sở hữu hoặc ADMIN | Trả thành công và bình luận đã xóa |
| `GET /bookmarks` | Access token | Query `page`, `limit`, `book` ObjectId tùy chọn; chỉ bookmark của user hiện tại |
| `POST /bookmarks` | Access token | `{ "book": "<book ObjectId>", "chapter": "<chapter ObjectId>" }` |
| `GET`, `PATCH`, `DELETE /bookmarks/:bookmarkId` | Access token; chỉ chủ sở hữu | PATCH nhận `book` và/hoặc `chapter` |
| `GET /reading-progress` | Access token | Query `page`, `limit`, `book` ObjectId tùy chọn; chỉ tiến độ của user hiện tại |
| `POST /reading-progress` | Access token | `{ "book": "<book ObjectId>", "chapters_since_ad": 0, "total_chapter_reads": 0 }` |
| `GET`, `PATCH`, `DELETE /reading-progress/:progressId` | Access token; chỉ chủ sở hữu | PATCH nhận `chapters_since_ad` (0-2) và/hoặc `total_chapter_reads` (số nguyên không âm) |

Backend không nhận user ID từ client cho các tài nguyên cá nhân; danh tính được lấy từ access token.

## Thuê bao

| Phương thức và path | Quyền truy cập | Request / hành vi |
| --- | --- | --- |
| `POST /subscriptions` | Access token | `{ "plan": "premium_monthly", "payment_reference": "optional bank reference" }`; plan nhận `premium_monthly` hoặc `vip_monthly` |
| `GET /subscriptions/me` | Access token | Trả yêu cầu mới nhất hoặc `data: null`; yêu cầu `pending` có kèm thông tin thanh toán; đây không phải endpoint lịch sử phân trang |
| `POST /webhooks/sepay` | SePay API Key qua header `Authorization: Apikey ...` | Nhận giao dịch ngân hàng vào; chỉ tự kích hoạt khi mã chuyển khoản và số tiền khớp một yêu cầu pending; giao dịch lặp được nhận diện bằng transaction ID. |

Tạo yêu cầu trả dữ liệu subscription và `payment_instructions` gồm số tiền, nội dung chuyển khoản, thông tin ngân hàng đã cấu hình. VIP là 10.000 VND/tháng, Premium là 20.000 VND/tháng. Mỗi user chỉ có tối đa một yêu cầu pending. Khi bật SePay webhook, entitlement bắt đầu sau khi giao dịch tiền vào khớp mã và số tiền; ADMIN vẫn có thể xử lý ngoại lệ.

## Quản lý chương chỉ dành cho ADMIN

`/admin/chapters` hỗ trợ `GET` (query `page`, `limit`, `search`, `book_id`, `access_level`), `POST` (book ID, title, chapter number và content/access/date tùy chọn), cùng `GET`, `PATCH`, `DELETE` theo ID chương. Mọi route dưới `/admin` cần access token có role `ADMIN`.

## Xóa tài khoản qua quản trị

`DELETE /admin/users/:userId` yêu cầu role `ADMIN` và xóa user cùng dữ liệu gắn trực tiếp (bookmark, tiến độ, bình luận, report, subscription), các sách/chương user sở hữu cùng file sách riêng tư. Các subscription do user xét duyệt của người khác vẫn được giữ, nhưng trường `reviewed_by` được đặt thành `null`. Thao tác MongoDB chạy trong transaction nên yêu cầu replica set/cluster hỗ trợ transaction.

## Lưu ý cấu hình tích hợp

- Cấu hình `CORS_ORIGINS` bằng đúng origin frontend, phân tách bằng dấu phẩy. Các origin local chỉ được chấp nhận ngoài production.
- Production yêu cầu `RATE_LIMIT_REDIS_URL` hoặc `REDIS_URL`; `TRUST_PROXY` phải khớp sơ đồ proxy tin cậy thực tế.
- Duyệt subscription cần MongoDB hỗ trợ transaction (replica set hoặc cluster tương thích).
- Không để lộ đường dẫn kho sách riêng tư hoặc ghi access/refresh token vào log.
- Wikisource import cần User-Agent có URL/email liên hệ (ưu tiên `WIKISOURCE_USER_AGENT`; nếu trống, dùng `SMTP_USER`/`ADMIN_EMAIL`), tuần tự hóa API và tuân theo `Retry-After`. PDF được dàn trang nội bộ bằng font Unicode; cấu hình `BOOK_PDF_FONT_PATH` nếu không có font hệ thống phù hợp.
