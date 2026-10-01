# Ứng dụng di động LibraryManage

Ứng dụng Expo/React Native kết nối với REST API của dự án LibraryManage. Các màn hình được định tuyến bằng Expo Router và đặt trong `src/app/`.

## Yêu cầu

- Node.js và npm.
- Backend LibraryManage đang chạy; xem hướng dẫn cài đặt và cấu hình tại [README gốc](../readme.md).

## Cài đặt và chạy

Từ thư mục `library-mobile-app`:

```powershell
npm install
npm start
```

Hoặc chạy trực tiếp trên Android, iOS hay web:

```powershell
npm run android
npm run ios
npm run web
```

## Kết nối backend

Mặc định ứng dụng dùng backend ở cổng `5001` và chọn địa chỉ theo nền tảng:

- Web: `http://localhost:5001/api/v1`
- Android Emulator: `http://10.0.2.2:5001/api/v1`
- Thiết bị thật: dùng địa chỉ máy chạy Expo trên cùng mạng Wi-Fi.

Có thể đặt `EXPO_PUBLIC_API_URL` để chỉ định URL khác trước khi chạy Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.10:5001/api/v1'
npm start
```

Thay địa chỉ ví dụ bằng địa chỉ backend mà thiết bị truy cập được. Với trình duyệt, nếu gặp lỗi CORS, hãy thêm origin frontend vào `CORS_ORIGINS` trong file `.env` của backend.

Nếu không kết nối được, xác nhận backend đang chạy, thiết bị và backend có thể liên lạc qua mạng, URL có hậu tố `/api/v1`, và firewall không chặn cổng backend. Màn hình `debug-connection` có thể giúp kiểm tra URL và trạng thái kết nối.

## Kiểm tra mã

```powershell
npm run lint
npx tsc --noEmit
```
