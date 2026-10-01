// Điểm vào ứng dụng chuyển người dùng tới màn hình đăng nhập để bắt đầu phiên làm việc.
import { Redirect, type RelativePathString } from 'expo-router';

// Route gốc chuyển tiếp người dùng tới luồng đăng nhập.
export default function IndexScreen() {
  // Redirect thay vì giữ màn hình trung gian trong lịch sử điều hướng.
  return <Redirect href={'/auth/login' as RelativePathString} />;
}
