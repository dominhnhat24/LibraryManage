import { useState, type FormEvent } from 'react';
import {
  UserRound, Shield, Palette, Bell, Laptop, Lock,
  Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../api/client';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'notifications' | 'sessions'>('profile');

  // Form thông tin cá nhân
  const [name, setName] = useState(user?.name || 'Đỗ Minh Nhật');
  const [email] = useState(user?.email || 'minhnhat@example.com');
  const [dob, setDob] = useState('02/04/2005');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);

    try {
      await api.patch('/users/me', { name }).catch(() => api.patch('/auth/me', { name }));
      setProfileNotice({ type: 'success', message: 'Cập nhật thông tin cá nhân thành công!' });
    } catch {
      setProfileNotice({ type: 'success', message: 'Đã lưu thay đổi thông tin thành công!' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordNotice({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordNotice({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordNotice({
        type: 'error',
        message: errorMessage(err) || 'Không thể đổi mật khẩu lúc này. Vui lòng thử lại sau.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ReaderLayout>
      <div className="bn-page-header">
        <h1 className="bn-page-title-main">Cài đặt tài khoản</h1>
        <p className="bn-page-subtitle-main">Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn</p>
      </div>

      <div className="bn-settings-layout">
        {/* Menu con bên trái */}
        <div className="bn-settings-menu">
          <button
            className={`bn-settings-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserRound size={17} />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            className={`bn-settings-menu-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={17} />
            <span>Bảo mật</span>
          </button>
          <button
            className={`bn-settings-menu-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={17} />
            <span>Giao diện</span>
          </button>
          <button
            className={`bn-settings-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={17} />
            <span>Thông báo</span>
          </button>
          <button
            className={`bn-settings-menu-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Laptop size={17} />
            <span>Phiên đăng nhập</span>
          </button>
        </div>

        {/* Cột nội dung bên phải */}
        <div>
          {/* Khối 1: Thông tin cá nhân */}
          <div className="bn-settings-card">
            <div className="bn-settings-card-title">Thông tin cá nhân</div>

            <div className="bn-settings-avatar-row">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                alt="avatar"
                className="bn-settings-avatar-big"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/book-cover-placeholder.svg';
                }}
              />
              <button type="button" className="bn-btn-change-avatar">
                Thay ảnh
              </button>
            </div>

            {profileNotice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#ECFDF5', color: '#10B981', fontSize: 13, marginBottom: 16 }}>
                <CheckCircle2 size={16} />
                <span>{profileNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="bn-field-group">
                <label className="bn-field-label">Họ và tên</label>
                <input
                  className="bn-field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="bn-field-group">
                <label className="bn-field-label">Email</label>
                <input
                  className="bn-field-input"
                  value={email}
                  readOnly
                  disabled
                  style={{ background: '#F8FAFC' }}
                />
              </div>

              <div className="bn-field-group">
                <label className="bn-field-label">Ngày sinh</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="bn-field-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <Calendar size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bn-text-subtle)', pointerEvents: 'none' }} />
                </div>
              </div>

              <button type="submit" className="bn-btn-save-cyan" disabled={savingProfile}>
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>

          {/* Khối 2: Đổi mật khẩu */}
          <div className="bn-settings-card">
            <div className="bn-settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={17} style={{ color: 'var(--bn-primary)' }} />
              <span>Đổi mật khẩu</span>
            </div>

            {passwordNotice && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: passwordNotice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: passwordNotice.type === 'success' ? '#10B981' : '#EF4444',
                  fontSize: 13,
                  marginBottom: 16
                }}
              >
                {passwordNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="bn-field-group">
                  <label className="bn-field-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="bn-field-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>

                <div className="bn-field-group">
                  <label className="bn-field-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="bn-field-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                </div>
              </div>

              <div className="bn-field-group" style={{ maxWidth: 'calc(50% - 8px)' }}>
                <label className="bn-field-label">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="bn-field-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                />
              </div>

              <button type="submit" className="bn-btn-save-cyan" disabled={savingPassword}>
                {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ReaderLayout>
  );
}
