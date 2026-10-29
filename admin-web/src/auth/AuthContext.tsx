import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import {
  changeMyPassword, clearSession, fetchCurrentUser, signIn, signInAdmin, signOut,
  updateMyProfile, uploadMyAvatar, verifyRegistrationEmail,
} from '../api/client.ts';
import type { User } from '../types';


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


const AuthContext = createContext<AuthContextValue | null>(null);

// Hàm AuthProvider: Khởi tạo/duy trì phiên user và cung cấp các thao tác xác thực cho toàn bộ router.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const handleExpired = () => {
      if (!active) return;
      setUser(null);
      setLoading(false);
    };

    // Always listen for expiration. The app often starts logged out, then a login
    // happens without a reload; returning before this listener was registered left
    // the context stale when a later API refresh failed.
    window.addEventListener('openbook:session-expired', handleExpired);

    const token = localStorage.getItem('openbook.access_token');
    if (!token) {
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener('openbook:session-expired', handleExpired);
      };
    }

    fetchCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch((error: unknown) => {
        // Clear credentials only when the server explicitly rejects the session.
        // A temporary network/server failure must not sign the reader out or hide
        // their database-backed favorites.
        const unauthorized = axios.isAxiosError(error) && error.response?.status === 401;
        if (unauthorized) {
          clearSession();
          if (active) setUser(null);
          return;
        }

        if (active) {
          try {
            const cachedUser = localStorage.getItem('openbook.user');
            setUser(cachedUser ? JSON.parse(cachedUser) as User : null);
          } catch {
            setUser(null);
          }
        }
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      window.removeEventListener('openbook:session-expired', handleExpired);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const currentUser = await signIn(email, password);
      setUser(currentUser);
      return currentUser;
    },
    async loginAdmin(email, password) {
      const currentUser = await signInAdmin(email, password);
      setUser(currentUser);
      return currentUser;
    },
    async verifyEmail(email, otp) {
      const currentUser = await verifyRegistrationEmail(email, otp);
      setUser(currentUser);
      return currentUser;
    },
    async updateProfile(payload) {
      const updated = await updateMyProfile(payload);
      setUser(updated);
      return updated;
    },
    async uploadAvatar(file) {
      const updated = await uploadMyAvatar(file);
      setUser(updated);
      return updated;
    },
    async changePassword(currentPassword, newPassword) {
      await changeMyPassword(currentPassword, newPassword);
      setUser(null);
    },
    async logout() {
      try {
        await signOut();
      } finally {
        setUser(null);
      }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hàm useAuth: Lấy context xác thực; báo lỗi sớm nếu component đặt ngoài provider.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
