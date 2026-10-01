# LibraryManage

Ứng dụng quản lý thư viện gồm REST API viết bằng Express/MongoDB và ứng dụng di động đa nền tảng xây dựng bằng Expo, React Native.

## Chức năng

- Quản lý đầu sách và các bản sao trong kho.
- Quản lý tài khoản độc giả, thủ thư và đăng nhập bằng JWT.
- Tạo, duyệt, hủy phiếu mượn; hỗ trợ trả sách từng phần.
- Tự ghi nhận tiền phạt do quá hạn, hỏng hoặc mất sách; thủ thư có thể thanh toán hoặc miễn phạt.
- Trang tổng quan cho thủ thư và các màn hình tra cứu dành cho độc giả.

## Công nghệ

- **Backend:** Node.js, Express 5, Mongoose, MongoDB.
- **Mobile:** Expo SDK 57, React Native, Expo Router, TypeScript.
- **Kiểm thử:** Node.js test runner; kiểm thử luồng nghiệp vụ có thể chạy với MongoDB.

## Cấu trúc dự án

```text
.
├── server.js                 # Điểm khởi chạy REST API
├── src/
│   ├── controllers/          # Xử lý request/response
│   ├── middlewares/          # JWT, phân quyền, validation và lỗi
│   ├── models/               # Schema và kết nối MongoDB
│   ├── routes/               # Các nhóm endpoint
│   ├── services/             # Logic nghiệp vụ
│   └── validators/           # Kiểm tra dữ liệu đầu vào
├── scripts/seed-admin.js     # Tạo hoặc cập nhật tài khoản thủ thư
├── test/                     # Kiểm thử API và luồng nghiệp vụ
└── library-mobile-app/       # Ứng dụng Expo
```

## Yêu cầu

- Node.js và npm.
- MongoDB Replica Set tên `rs0` (hoặc một MongoDB deployment hỗ trợ transaction) để dùng các luồng mượn/trả sách.

Backend dùng MongoDB transaction khi duyệt và trả sách. Nếu MongoDB chạy cục bộ, cần khởi động nó ở chế độ Replica Set và khởi tạo Replica Set trước khi chạy các luồng đó. URI mẫu trong `.env.example` đã dùng `replicaSet=rs0`.

## Cài đặt và chạy backend

Từ thư mục gốc của repository:

```powershell
npm install
Copy-Item .env.example .env
```

Mở `.env`, kiểm tra `MONGODB_URI` và thay `JWT_SECRET` bằng một chuỗi bí mật ngẫu nhiên riêng, đủ mạnh. Không commit `.env` hoặc chia sẻ secret này. Các biến cấu hình được hỗ trợ:

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng HTTP; mặc định `5001`. |
| `MONGODB_URI` | URI kết nối MongoDB; mẫu trỏ tới database `librarymanage` trên Replica Set `rs0`. |
| `JWT_SECRET` | Khóa ký JWT; bắt buộc để khởi động backend. |
| `OVERDUE_FINE_PER_DAY` | Mức phạt cho mỗi ngày quá hạn. |
| `DAMAGED_BOOK_FINE` | Mức phạt khi sách bị hỏng. |
| `LOST_BOOK_FINE` | Mức phạt khi sách bị mất. |
| `CORS_ORIGINS` | Tùy chọn: danh sách origin được phép, phân tách bằng dấu phẩy. |

Tạo tài khoản thủ thư ban đầu bằng cách đặt `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_FULL_NAME` và `ADMIN_PASSWORD` trong `.env`, sau đó chạy:

```powershell
npm run seed:admin
```

Hãy tự đặt thông tin tài khoản, đặc biệt là mật khẩu; không dùng thông tin mặc định khi triển khai thật. Sau khi tạo tài khoản, khởi động API:

```powershell
npm run dev
```

API mặc định chạy tại `http://localhost:5001`. Kiểm tra máy chủ bằng cách mở `http://localhost:5001/`; endpoint này trả về trạng thái hoạt động của API.

Các lệnh backend khác:

```powershell
npm start       # Chạy không dùng nodemon
npm test        # Chạy kiểm thử không cần MongoDB
```

Để chạy thêm kiểm thử luồng nghiệp vụ với MongoDB đã cấu hình:

```powershell
$env:RUN_DB_INTEGRATION = '1'
npm test
```

Kiểm thử này tạo dữ liệu riêng và dọn dữ liệu đã tạo khi hoàn tất.

## Chạy ứng dụng di động

Mở terminal thứ hai:

```powershell
Set-Location library-mobile-app
npm install
npm start
```

Expo hiển thị các lựa chọn mở ứng dụng trên thiết bị hoặc emulator. Có thể chạy trực tiếp trên từng nền tảng:

```powershell
npm run android
npm run ios
npm run web
```

Ứng dụng mặc định kết nối tới backend cổng `5001`; URL được chọn theo nền tảng (web dùng `localhost`, Android Emulator dùng `10.0.2.2`). Để ghi đè URL, đặt biến `EXPO_PUBLIC_API_URL` trước khi chạy Expo, ví dụ:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.10:5001/api/v1'
npm start
```

Thay địa chỉ mẫu bằng địa chỉ backend có thể truy cập từ thiết bị. Điện thoại thật và máy chạy backend cần kết nối cùng mạng; backend phải cho phép origin của ứng dụng web nếu chạy trên trình duyệt. Xem thêm [README của ứng dụng di động](./library-mobile-app/README.md).

## API

Các endpoint được đặt dưới tiền tố `/api/v1`. Những endpoint cần đăng nhập nhận JWT qua header:

```http
Authorization: Bearer <access-token>
```

Đăng ký độc giả và đăng nhập:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "full_name": "Nguyen Van A",
  "email": "reader@example.com",
  "password": "your-password"
}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "reader@example.com",
  "password": "your-password"
}
```

### Các nhóm endpoint

| Nhóm | Endpoint chính | Quyền |
| --- | --- | --- |
| Xác thực | `POST /auth/register`, `POST /auth/login` | Công khai |
| Đầu sách | `GET /books`, `GET /books/:id`; `POST`, `PUT`, `DELETE /books` | Đọc công khai; tạo/sửa/xóa cần thủ thư |
| Bản sao | `GET /book-copies`, `GET /book-copies/:id`; `POST`, `PUT`, `DELETE /book-copies` | Đọc công khai; tạo/sửa/xóa cần thủ thư |
| Độc giả | `GET /readers/me`; CRUD `/readers` và `/readers/:id` | Độc giả chỉ xem hồ sơ của mình; quản lý cần thủ thư |
| Thủ thư | `/librarians`, `/librarians/me`, `/librarians/:id` | Thủ thư |
| Phiếu mượn | `GET`, `POST /borrow-cards`; `GET /borrow-cards/:id`; `PATCH /borrow-cards/:id/cancel`, `/approve`, `/return` | Độc giả và thủ thư; hủy dành cho độc giả, duyệt/trả dành cho thủ thư |
| Tiền phạt | `GET /fines`, `GET /fines/:id`; `PATCH /fines/:id/pay`, `/waive` | Độc giả xem khoản phạt của mình; thủ thư quản lý |
| Tổng quan | `GET /dashboard` | Thủ thư |

Các URL trong bảng được nối sau `/api/v1`. Ví dụ, endpoint đăng nhập đầy đủ là `/api/v1/auth/login`. Dữ liệu đầu vào không hợp lệ trả HTTP 400; endpoint cần xác thực trả HTTP 401 nếu thiếu/sai token và HTTP 403 nếu không đủ quyền.

## Chất lượng mã

Ứng dụng di động có các lệnh:

```powershell
Set-Location library-mobile-app
npm run lint
npx tsc --noEmit
```
