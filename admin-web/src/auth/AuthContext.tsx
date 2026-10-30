// Import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/auth/AuthContext.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
// Import axios từ axios để dùng trong giao diện.
import axios from 'axios';
// Import { changeMyPassword, clearSession, fetchCurrentUser, signIn, signInAdmin, signOut từ ../api/client.ts để dùng trong giao diện.
import {
  changeMyPassword, clearSession, fetchCurrentUser, signIn, signInAdmin, signOut,
  updateMyProfile, uploadMyAvatar, verifyRegistrationEmail,
} from '../api/client.ts';
// Import type { User } từ ../types để dùng trong giao diện.
import type { User } from '../types';


// Interface AuthContextValue quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginAdmin: (email: string, password: string) => Promise<User>;
  verifyEmail: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (payload: { name: string; phone_number?: string | null }) => Promise<User>;
  uploadAvatar: (file: File) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}


// Biến AuthContext nhận giá trị từ createContext<AuthContextValue | null>(null). const không gán lại; let có thể cập nhật.
const AuthContext = createContext<AuthContextValue | null>(null);

// Hàm AuthProvider: Khởi tạo/duy trì phiên user và cung cấp các thao tác xác thực cho toàn bộ router.
/**
 * Hàm/thành phần AuthProvider: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { children }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, setUser, setLoading, addEventListener, getItem, return, removeEventListener.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Biến [user, setUser] nhận giá trị từ useState<User | null>(null). const không gán lại; let có thể cập nhật.
  const [user, setUser] = useState<User | null>(null);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { let active = true; const handleExpired = () => { if (!active)
  useEffect(() => {
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    /**
     * Hàm/thành phần handleExpired: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: setUser, setLoading.
     */
    const handleExpired = () => {
      // if chỉ chạy nhánh này khi điều kiện !active đúng.
      if (!active) return;
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(null)
      setUser(null);
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    };

    // Always listen for expiration. The app often starts logged out, then a login
    // happens without a reload; returning before this listener was registered left
    // the context stale when a later API refresh failed.
    // Gọi/thực thi window.addEventListener với đối số để cập nhật logic/giao diện: window.addEventListener('openbook:session-expired', handleExpired)
    window.addEventListener('openbook:session-expired', handleExpired);

    // Biến token nhận giá trị từ localStorage.getItem('openbook.access_token'). const không gán lại; let có thể cập nhật.
    const token = localStorage.getItem('openbook.access_token');
    // if chỉ chạy nhánh này khi điều kiện !token đúng.
    if (!token) {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; window.removeEventListener('openbook:session-expired', h.
      return () => {
        // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
        active = false;
        // Gọi/thực thi window.removeEventListener với đối số để cập nhật logic/giao diện: window.removeEventListener('openbook:session-expired', handleExpired)
        window.removeEventListener('openbook:session-expired', handleExpired);
      };
    }

    // Gọi/thực thi fetchCurrentUser với đối số để cập nhật logic/giao diện: fetchCurrentUser() .then((currentUser) => { if (active) setUser(currentUser); })
    fetchCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch((error: unknown) => {
        // Clear credentials only when the server explicitly rejects the session.
        // A temporary network/server failure must not sign the reader out or hide
        // their database-backed favorites.
        // Biến unauthorized nhận giá trị từ axios.isAxiosError(error) && error.response?.status ===. const không gán lại; let có thể cập nhật.
        const unauthorized = axios.isAxiosError(error) && error.response?.status === 401;
        // if chỉ chạy nhánh này khi điều kiện unauthorized đúng.
        if (unauthorized) {
          // Gọi/thực thi clearSession với đối số để cập nhật logic/giao diện: clearSession()
          clearSession();
          // if chỉ chạy nhánh này khi điều kiện active đúng.
          if (active) setUser(null);
          // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
          return;
        }

        // if chỉ chạy nhánh này khi điều kiện active đúng.
        if (active) {
          // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
          try {
            // Biến cachedUser nhận giá trị từ localStorage.getItem('openbook.user'). const không gán lại; let có thể cập nhật.
            const cachedUser = localStorage.getItem('openbook.user');
            // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(cachedUser ? JSON.parse(cachedUser) as User : null)
            setUser(cachedUser ? JSON.parse(cachedUser) as User : null);
          } catch {
            // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(null)
            setUser(null);
          }
        }
      })
      .finally(() => { if (active) setLoading(false); });

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; window.removeEventListener('openbook:session-expired', h.
    return () => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: active = false
      active = false;
      // Gọi/thực thi window.removeEventListener với đối số để cập nhật logic/giao diện: window.removeEventListener('openbook:session-expired', handleExpired)
      window.removeEventListener('openbook:session-expired', handleExpired);
    };
  }, []);

  // Biến value nhận giá trị từ useMemo<AuthContextValue>(() => ({ user, loading, async. const không gán lại; let có thể cập nhật.
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    /**
     * Hàm/thành phần login: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: email, password.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: signIn, setUser.
     * Được tham chiếu tại: src/controllers/auth.controller.js.
     */
    async login(email, password) {
      // Biến currentUser nhận giá trị từ await signIn(email, password). const không gán lại; let có thể cập nhật.
      const currentUser = await signIn(email, password);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(currentUser)
      setUser(currentUser);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: currentUser.
      return currentUser;
    },
    /**
     * Hàm/thành phần loginAdmin: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: email, password.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: signInAdmin, setUser.
     */
    async loginAdmin(email, password) {
      // Biến currentUser nhận giá trị từ await signInAdmin(email, password). const không gán lại; let có thể cập nhật.
      const currentUser = await signInAdmin(email, password);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(currentUser)
      setUser(currentUser);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: currentUser.
      return currentUser;
    },
    /**
     * Hàm/thành phần verifyEmail: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: email, otp.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: verifyRegistrationEmail, setUser.
     */
    async verifyEmail(email, otp) {
      // Biến currentUser nhận giá trị từ await verifyRegistrationEmail(email, otp). const không gán lại; let có thể cập nhật.
      const currentUser = await verifyRegistrationEmail(email, otp);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(currentUser)
      setUser(currentUser);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: currentUser.
      return currentUser;
    },
    /**
     * Hàm/thành phần updateProfile: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: payload.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: updateMyProfile, setUser.
     */
    async updateProfile(payload) {
      // Biến updated nhận giá trị từ await updateMyProfile(payload). const không gán lại; let có thể cập nhật.
      const updated = await updateMyProfile(payload);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(updated)
      setUser(updated);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: updated.
      return updated;
    },
    /**
     * Hàm/thành phần uploadAvatar: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: file.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: uploadMyAvatar, setUser.
     */
    async uploadAvatar(file) {
      // Biến updated nhận giá trị từ await uploadMyAvatar(file). const không gán lại; let có thể cập nhật.
      const updated = await uploadMyAvatar(file);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(updated)
      setUser(updated);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: updated.
      return updated;
    },
    /**
     * Hàm/thành phần changePassword: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: currentPassword, newPassword.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: changeMyPassword, setUser.
     */
    async changePassword(currentPassword, newPassword) {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await changeMyPassword(currentPassword, newPassword)
      await changeMyPassword(currentPassword, newPassword);
      // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(null)
      setUser(null);
    },
    /**
     * Hàm/thành phần logout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: không có tham số.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: signOut, setUser.
     */
    async logout() {
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await signOut()
        await signOut();
      } finally {
        // Gọi/thực thi setUser với đối số để cập nhật logic/giao diện: setUser(null)
        setUser(null);
      }
    },
  }), [user, loading]);

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <AuthContext.Provider value={value}>{children}</AuthContext.Provider>.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hàm useAuth: Lấy context xác thực; báo lỗi sớm nếu component đặt ngoài provider.
/**
 * Hook useAuth: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useContext, Error.
 */
export function useAuth(): AuthContextValue {
  // Biến context nhận giá trị từ useContext(AuthContext). const không gán lại; let có thể cập nhật.
  const context = useContext(AuthContext);
  // if chỉ chạy nhánh này khi điều kiện !context đúng.
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: context.
  return context;
}
