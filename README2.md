# OpenBook — Kiến trúc và lộ trình phát triển

OpenBook là nền tảng đọc ebook, truyện tranh, audiobook và webnovel. Tài liệu này mô tả **cấu trúc mục tiêu khi dự án được hoàn thiện và triển khai**, dựa trên các model/schema và ứng dụng đang có trong workspace.

> **Trạng thái hiện tại:** dự án đang là một ứng dụng backend Express/Mongoose dạng layered monolith và một ứng dụng Expo Router. Các thư mục `modules/`, `features/` và `deploy/` trong cây mục tiêu bên dưới là định hướng; không có nghĩa tất cả đã được tạo hoặc triển khai. Chưa nên gọi kiến trúc hiện tại là microservices.

## Chú giải trạng thái

- ✅ Đã có trong workspace hoặc đã có schema/luồng tương ứng.
- 🟡 Đã có một phần; cần hoàn thiện hoặc xác nhận nghiệp vụ.
- 🔜 Đề xuất cho giai đoạn tiếp theo.
- 🔒 Cấu hình nhạy cảm hoặc dữ liệu không được đưa vào Git/public web.

## Tổng quan công nghệ

| Phần | Công nghệ hiện tại | Hướng triển khai |
| --- | --- | --- |
| Backend API | Node.js, Express 5, Mongoose | Một API service dạng modular monolith; chỉ tách service độc lập khi có nhu cầu vận hành rõ ràng |
| Database | MongoDB | MongoDB managed/production có backup; cần replica set nếu dùng transaction |
| Client | Expo SDK, React Native, Expo Router, TypeScript | Build mobile qua Expo/EAS; có thể phát hành web riêng nếu cần |
| File sách | Lưu trên private filesystem qua `BOOK_STORAGE_DIR` | Chuyển sang object storage private, có backup và URL tải có hạn khi mở rộng |
| Deploy | 🔜 Chưa thấy Docker/CI deploy trong workspace | Container hóa API, cấu hình secrets ở hosting và tự động chạy kiểm thử |

## Cây thư mục mục tiêu

Đây là **cây đích để phát triển dần**, không yêu cầu di chuyển toàn bộ mã nguồn cùng lúc. Các model hiện có được ghi tên cạnh vị trí dự kiến; những model đánh dấu 🔜 chưa tồn tại.

```text
LibraryManage/
├── 🔒 .env.example                    # Tên biến môi trường mẫu, không chứa secrets thật
├── 🔒 .gitignore                      # Loại .env, dependency, log và file sách khỏi Git
├── package.json                       # Lệnh và dependency backend
├── package-lock.json                  # Khóa dependency backend
├── server.js                          # Điểm khởi chạy; kết nối DB và mở HTTP listener
│
├── src/                               # 🔵 Backend API
│   ├── app.js                         # 🔜 Tạo Express app và đăng ký middleware/routes
│   ├── config/
│   │   ├── db.js                      # ✅ Kết nối MongoDB
│   │   └── mailer.js                  # ✅ Cấu hình gửi email
│   ├── modules/                       # 🔜 Gom mã theo nghiệp vụ khi refactor dần
│   │   ├── auth/
│   │   │   ├── auth.routes.js         # ✅ Routes hiện ở src/routes/auth.routes.js
│   │   │   ├── auth.controller.js     # ✅ Controller hiện ở src/controllers/auth.controller.js
│   │   │   ├── auth.service.js        # 🟡 Có OTP service cũ; cần nối route hoặc loại bỏ
│   │   │   ├── user.model.js          # ✅ User: hồ sơ, role, quyền hạn, refresh-token hash
│   │   │   └── auth.validation.js     # 🔜 Tách kiểm tra input khỏi controller
│   │   ├── books/
│   │   │   ├── book.routes.js         # ✅ Routes hiện ở src/routes/book.routes.js
│   │   │   ├── book.controller.js     # ✅ Controller hiện ở src/controllers/book.controller.js
│   │   │   ├── book.model.js          # ✅ Book và chapter nhúng hiện tại
│   │   │   └── book.validation.js     # 🔜 Validate payload/query theo nghiệp vụ
│   │   ├── chapters/
│   │   │   ├── chapter.routes.js      # 🔜 API chương riêng khi cần phân trang/tăng tải
│   │   │   ├── chapter.service.js     # 🔜 Nghiệp vụ xuất bản và entitlement của chương
│   │   │   └── chapter.model.js       # 🔜 Tách khỏi Book nếu dữ liệu chương lớn
│   │   ├── subscriptions/
│   │   │   ├── subscription.routes.js # ✅ Routes hiện ở src/routes/subscription.routes.js
│   │   │   ├── subscription.controller.js # ✅ Tạo request, xem trạng thái, duyệt/từ chối
│   │   │   ├── subscription.model.js  # ✅ Plan, giá, trạng thái, hạn dùng, người duyệt
│   │   │   └── payment-event.model.js # 🔜 Lưu webhook/giao dịch khi tích hợp cổng thanh toán
│   │   ├── interactions/
│   │   │   ├── comment.model.js       # ✅ Bình luận/đánh giá; mỗi user một đánh giá/sách
│   │   │   └── reading-progress.model.js # ✅ Hiện lưu bộ đếm quảng cáo theo user/sách
│   │   ├── reports/
│   │   │   └── report.model.js        # ✅ Báo cáo liên hệ/lỗi và trạng thái xử lý
│   │   └── admin/                     # ✅ Nghiệp vụ quản trị hiện phân bố trong controllers/routes
│   ├── shared/
│   │   ├── middleware/                # ✅ Auth, role, quảng cáo, xử lý lỗi
│   │   ├── errors/                    # ✅ ApiError và chuẩn hóa lỗi
│   │   └── utils/                     # ✅ Async handler, private book storage
│   └── infrastructure/
│       ├── email/                     # ✅ Mailer hiện ở src/config/mailer.js
│       ├── file-storage/              # ✅ Private filesystem hiện có; 🔜 object storage
│       └── payment/                   # 🔜 Adapter thanh toán và xác minh webhook
│
├── test/                              # ✅ Kiểm thử hiện có
│   ├── openbook-api.test.js           # Kiểm thử hợp đồng API
│   ├── openbook-models.test.js        # Kiểm thử schema/model
│   └── download-security.test.js      # Kiểm thử bảo vệ tải file
│
├── library-mobile-app/                # 🟢 Ứng dụng Expo
│   ├── app.json                       # Cấu hình Expo
│   ├── eas.json                       # 🔜 Cấu hình build/phát hành nếu dùng EAS
│   └── src/
│       ├── app/                       # ✅ Expo Router: các màn hình/route
│       ├── features/                  # 🔜 Gom UI và logic theo nghiệp vụ
│       │   ├── auth/                  # Login, register, profile/session
│       │   ├── books/                 # Catalog, tìm kiếm, chi tiết sách
│       │   ├── reader/                # Đọc sách, quảng cáo, tiến độ
│       │   └── subscriptions/         # Đăng ký và theo dõi gói
│       ├── services/                  # ✅ API client hiện tại
│       ├── components/                # ✅ UI components hiện tại
│       ├── hooks/                     # ✅ Hooks hiện tại
│       └── types/                     # ✅ Kiểu dữ liệu client hiện tại
│
├── deploy/                            # 🟠 🔜 Tài nguyên triển khai
│   ├── Dockerfile.api                 # Đóng gói backend production
│   ├── compose.yaml                   # Môi trường local; không mở MongoDB production công khai
│   └── nginx.conf                     # Chỉ cần nếu tự vận hành reverse proxy
│
└── .github/workflows/                 # 🟠 🔜 CI: lint/test/build/deploy theo môi trường
```

## Backend hiện có theo schema

### `User`

Schema trong `src/models/user.model.js` lưu tên, email, số điện thoại, bcrypt password hash, role, trạng thái/thời hạn VIP và Premium, cùng hash refresh token. Password và refresh-token hash được ẩn khi query mặc định. Model có `hasActivePremium()`, `hasActiveVip()` và `toPublicJSON()`.

**Role hiện có:** `free`, `vip`, `author`, `admin`. Premium hiện được lưu bằng các trường `is_premium` và `premium_expires_at`, không phải role riêng. Quyền có hiệu lực cần được xác định theo thời hạn, không chỉ theo giá trị role.

### `Book` và chapter nhúng

Schema trong `src/models/book.model.js` lưu tiêu đề, tác giả dạng tên, category (`ebook`, `audiobook`, `comic`, `webnovel`), năm xuất bản, mô tả, cover, cờ `is_free`, file key private, owner, status (`draft`, `published`) và mảng chapter nhúng.

Mỗi chapter hiện có `title`, `content`, `order`, `published_at`. Đây là cách lưu hiện tại; chapter chưa có collection/model độc lập. Có thể giữ thiết kế này cho quy mô nhỏ. Nếu cần nhiều chương, phân trang, thống kê hoặc cập nhật chương độc lập, cân nhắc schema riêng với `book`, `title`, `content`/storage reference, `order`, `access_level`, `status` và index phù hợp.

### `Subscription`

Schema trong `src/models/subscription.model.js` hiện lưu user, plan `premium_monthly`, số tiền VND, trạng thái (`pending`, `active`, `rejected`, `expired`), thời điểm bắt đầu/hết hạn, payment reference, transfer note và người duyệt. Có unique partial index ngăn một user tạo nhiều request đang pending.

Luồng hiện tại là yêu cầu chuyển khoản và admin duyệt; chưa phải tích hợp payment gateway tự động. Nếu thêm cổng thanh toán, nên bổ sung bản ghi giao dịch/payment event riêng để lưu provider, transaction ID, số tiền, trạng thái, thời điểm và kết quả xác minh webhook; cần idempotency để webhook gửi lặp không kích hoạt quyền nhiều lần.

### `Comment`, `ReadingProgress`, `Report`

- `Comment`: liên kết `Book` và `User`, nội dung, rating 1–5; unique index theo book/user.
- `ReadingProgress`: hiện là bộ đếm lượt đọc/chapter giữa các lần quảng cáo theo user/book (`chapters_since_ad`, `total_chapter_reads`), **chưa lưu vị trí chapter/page/audio để đồng bộ tiến độ đọc**. Có thể mở rộng thành progress record hoặc tạo schema riêng khi làm đồng bộ đa thiết bị.
- `Report`: email, subject, message, loại `contact`/`bug`, trạng thái xử lý và user tùy chọn.
- `TempUser`: có schema file riêng cho OTP đăng ký, nhưng cần xác nhận luồng này còn được sử dụng; tên file/model cần thống nhất với import trong auth service.

## Quyền thành viên: quy tắc cần chốt trước khi mở rộng

Đặc tả sản phẩm định hướng:

| Tier | Đọc sách miễn phí | Nội dung VIP | Quảng cáo | Offline |
| --- | --- | --- | --- | --- |
| Free | Có | Không | Theo chu kỳ đọc đã cấu hình | Không |
| VIP | Có | Có | Không | Theo quyết định sản phẩm |
| Premium | Có | Có | Không | Có |
| Admin | Có | Có | Không | Có |

> **Cần quyết định:** mô tả sản phẩm ban đầu nói Premium bao gồm VIP và thêm offline, nhưng một số middleware hiện tại gắn quyền download với VIP/Admin. Trước khi phát hành cần thống nhất bảng trên và kiểm thử quyền cho từng tier; không dùng UI client thay cho kiểm tra ở API.

Về thiết kế, nên kiểm tra capability nghiệp vụ như `canReadPaidContent`, `shouldShowAds` và `canDownloadOffline` qua một helper/service dùng chung. Không nên để mỗi route tự suy diễn quyền từ role và các boolean khác nhau.

## API và trạng thái

### Đã có trong backend

Tất cả API dùng tiền tố `/api/v1`.

| Nhóm | Endpoint tiêu biểu | Ghi chú |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | JWT access/refresh; đăng ký hiện tạo tài khoản Free |
| Books | `GET /books`, `GET /books/:bookId`, `POST /books`, `PUT /books/:bookId`, `DELETE /books/:bookId` | Catalog, metadata và thao tác theo quyền hiện hành |
| Reading | `POST /books/:bookId/chapters/:chapterId/read`, `GET /books/:bookId/stream` | Có kiểm tra quyền đọc và bộ đếm quảng cáo |
| Downloads | `GET /downloads/:bookId` | Protected route; cần rà soát quy tắc tier theo đặc tả cuối cùng |
| Subscriptions | `POST /subscriptions`, `GET /subscriptions/me` | Tạo request và xem trạng thái |
| Admin | `/admin/users`, `/admin/books`, `/admin/subscriptions`, `/admin/reports` | Các route hiện có gồm user gần đây, sách, duyệt subscription, báo cáo |
| Interactions | `/books/:bookId/comments`, `/comments/:commentId` | Đọc, tạo, sửa, xóa bình luận theo quyền |
| Reports | `POST /reports` | Tạo báo cáo; có thể gửi kèm phiên đăng nhập |

Các route cụ thể có thể thay đổi theo implementation; `src/routes/` và test API là nguồn sự thật cho hành vi hiện tại.

### Đề xuất API cho giai đoạn sau

| Module | Endpoint đề xuất | Mục đích |
| --- | --- | --- |
| Auth/OTP | `POST /auth/register/otp`, `POST /auth/register/verify`, `POST /auth/password/forgot`, `POST /auth/password/reset` | Chỉ triển khai nếu tiếp tục dùng OTP; giới hạn resend/thử và lưu OTP an toàn |
| Chapters | `GET /books/:bookId/chapters`, `GET /books/:bookId/chapters/:chapterId`, `POST/PUT/DELETE /admin/books/:bookId/chapters/:chapterId` | Danh sách phân trang và quản trị chương độc lập |
| Reading progress | `GET/PUT /users/me/reading-progress/:bookId` | Lưu vị trí đọc thực tế để đồng bộ nhiều thiết bị |
| Payment | `POST /subscriptions/checkout`, `POST /payments/:provider/webhook` | Checkout và callback đã xác minh từ nhà cung cấp |
| Admin | `GET /admin/analytics`, `PATCH /admin/books/:bookId/status` | Thống kê và workflow duyệt nội dung khi cần |

Đây là endpoint đề xuất, chưa khẳng định đang tồn tại. Webhook phải xác minh chữ ký từ nhà cung cấp, kiểm tra số tiền/đơn hàng và xử lý lặp an toàn.

## Frontend

Ứng dụng hiện có trong `library-mobile-app/` dùng Expo Router, React Native và TypeScript. `src/app/` chứa route/màn hình; `src/services/` có API client; `src/components/`, `src/hooks/`, `src/types/` dùng chung.

Khi số lượng màn hình tăng, tổ chức dần phần nghiệp vụ theo feature:

```text
library-mobile-app/src/
├── app/                       # Điều hướng và route; giữ màn hình mỏng
├── features/
│   ├── auth/                  # Form, hook, API xác thực
│   ├── books/                 # Catalog, search, chi tiết
│   ├── reader/                # Đọc sách, quảng cáo, reading progress
│   └── subscriptions/         # Gói cước, thanh toán, lịch sử
├── services/                  # HTTP client và tích hợp API
├── components/                # Component dùng chung
├── hooks/                     # Hook dùng chung
└── types/                     # DTO/type theo hợp đồng API
```

Ứng dụng cần hiển thị trạng thái quyền để điều hướng phù hợp, nhưng backend luôn là nơi quyết định quyền đọc/tải. Với app mobile, nên đánh giá secure storage dành riêng cho token thay vì coi AsyncStorage là kho bí mật.

## Docker và đưa dịch vụ lên Internet

Chưa thấy Dockerfile/compose/CI deploy trong workspace. Khi chuẩn bị triển khai:

1. Tạo image riêng cho API; cài production dependencies, chạy user không phải root và chỉ expose cổng ứng dụng cần thiết.
2. Thêm `.dockerignore` loại `.env`, `node_modules`, log, test artifacts và thư mục chứa sách riêng tư.
3. Dùng secret manager/environment variables của hosting cho Mongo URI, JWT secret, SMTP và thông tin payment; không đưa secrets vào Git, image hoặc log.
4. Dùng MongoDB managed có backup; chỉ dùng transaction khi môi trường MongoDB hỗ trợ replica set.
5. Lưu file sách ở storage private bền vững; container filesystem có thể mất khi deploy/restart.
6. Bật HTTPS, giới hạn CORS theo domain client, cấu hình domain/API URL và health check.
7. CI tối thiểu chạy test; deploy chỉ sau khi test thành công. Mobile build/phát hành riêng qua EAS hoặc kênh phù hợp.

`compose.yaml` hữu ích cho môi trường local/staging. Không mở database trực tiếp ra Internet và không dùng cấu hình development thay cho production.

## Lộ trình phát triển

### P0 — Chốt nghiệp vụ và kiểm soát quyền

- Chốt tier VIP/Premium và quyền đọc, quảng cáo, offline.
- Viết test ma trận Free/VIP/Premium/Admin cho chapter, stream, download và quảng cáo.
- Xác nhận OTP/reset có còn trong phạm vi; nếu có thì nối route và đồng bộ tên model, nếu không thì ngừng luồng cũ an toàn.

### P1 — Hoàn thiện Book và Chapter

- Bảo đảm ownership của Author được kiểm tra cho mọi thao tác cập nhật/xóa.
- Chuẩn hóa draft/published và quy tắc public catalog.
- Khi quy mô chương yêu cầu, tách `Chapter` thành collection riêng, thêm phân trang/index và endpoint đọc có kiểm tra entitlement.

### P2 — Tiến độ và trải nghiệm đọc

- Phân biệt bộ đếm quảng cáo hiện tại với vị trí đọc thực tế.
- Lưu chapter/page/time position theo user/book, đồng bộ đa thiết bị và xử lý cập nhật đồng thời.
- Hoàn thiện UI trạng thái loading/error/empty và offline theo entitlement được chốt.

### P3 — Subscription và thanh toán

- Duy trì luồng duyệt tay nếu phù hợp giai đoạn đầu.
- Trước payment gateway, định nghĩa trạng thái đơn hàng, webhook signature verification, idempotency, hoàn tiền và gia hạn.
- Quyền thành viên chỉ đổi sau khi xác minh thanh toán ở backend.

### P4 — Production readiness

- Thêm Docker, CI test, health/metrics/logging, backup/restore và giám sát lỗi.
- Chuyển private files sang object storage có chính sách truy cập và retention rõ ràng.
- Rà soát rate limiting, validation, giới hạn upload, CORS, secrets và phụ thuộc trước khi public API.

## Chuẩn code và nguyên tắc kiến trúc

- Duy trì modular monolith; không chia microservices chỉ để có nhiều service.
- Controller xử lý HTTP; service chứa quy tắc nghiệp vụ; model định nghĩa schema và index; validation kiểm tra input ở biên API.
- Không nhận `owner`, role, trạng thái thanh toán hay quyền tier đáng tin cậy từ client.
- Dùng một nguồn quy tắc entitlement cho tất cả route liên quan đọc, quảng cáo và download.
- Không trả `password_hash`, refresh token/hash, private file key hoặc dữ liệu nhạy cảm qua API.
- Dùng transaction cho các cập nhật nhiều document cần tính nguyên tử; thiết kế retry/idempotency cho webhook.
- Giữ test cho schema, hợp đồng API, authorization và thao tác file riêng tư.

## Chạy dự án hiện tại

Yêu cầu Node.js 20+ và MongoDB. Việc duyệt subscription hiện dùng transaction, vì vậy môi trường MongoDB cần hỗ trợ transaction (ví dụ replica set).

```powershell
npm install
Copy-Item .env.example .env
```

Điền các biến cần thiết trong `.env` theo `.env.example`, sau đó:

```powershell
npm run dev
```

Chạy backend tests:

```powershell
npm test
```

Chạy ứng dụng Expo:

```powershell
Set-Location library-mobile-app
npm install
npm start
```

Không commit `.env`, thông tin ngân hàng/thanh toán, token, log hoặc nội dung sách riêng tư.
