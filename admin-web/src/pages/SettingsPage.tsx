import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Check, ChevronRight, LockKeyhole, LogOut, Sun, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ReaderLayout } from '../components/ReaderLayout';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';

type ThemePreference = 'auto' | 'light' | 'dark';
type ReadingSize = 'small' | 'medium' | 'large';

export function SettingsPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('openbook.theme') as ThemePreference) || 'auto');
  const [readingSize, setReadingSize] = useState<ReadingSize>(() => (localStorage.getItem('openbook.reading-size') as ReadingSize) || 'medium');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.bookTheme = theme === 'auto' ? '' : theme;
    localStorage.setItem('openbook.theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.readerSize = readingSize;
    localStorage.setItem('openbook.reading-size', readingSize);
  }, [readingSize]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingProfile(true); setProfileNotice('');
    try {
      const updated = await updateProfile({ name: name.trim(), phone_number: phoneNumber.trim() || null });
      setName(updated.name); setPhoneNumber(updated.phone_number ?? ''); setEditingProfile(false); setProfileNotice('Thông tin tài khoản đã được cập nhật.');
    } catch (error) { setProfileNotice(errorMessage(error)); }
    finally { setSavingProfile(false); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordNotice(null);
    if (!currentPassword) { setPasswordNotice({ kind: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' }); return; }
    if (newPassword.length < 8 || newPassword.length > 128) { setPasswordNotice({ kind: 'error', text: 'Mật khẩu mới cần từ 8 đến 128 ký tự.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordNotice({ kind: 'error', text: 'Mật khẩu xác nhận chưa khớp.' }); return; }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordNotice({ kind: 'success', text: 'Mật khẩu đã được cập nhật. Hãy đăng nhập lại.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      navigate('/login', { replace: true });
    } catch (error) { setPasswordNotice({ kind: 'error', text: errorMessage(error) }); }
    finally { setSavingPassword(false); }
  }

  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  return <ReaderLayout>
    <div className="bn-page-header"><h1 className="bn-page-title-main">Cài đặt</h1><p className="bn-page-subtitle-main">Tùy chỉnh tài khoản và trải nghiệm đọc sách của bạn</p></div>
    <div className="ob-settings-page">
      <section className="ob-settings-group">
        <h2>Tài khoản</h2>
        <div className="ob-settings-card ob-account-card">
          <div className="ob-settings-account-info"><strong>{user?.name || 'Chưa có tên tài khoản'}</strong><span>{user?.email || 'Chưa có email tài khoản'}</span></div>
          {!editingProfile && <button className="ob-settings-action" type="button" onClick={() => { setName(user?.name ?? ''); setPhoneNumber(user?.phone_number ?? ''); setEditingProfile(true); }}>Chỉnh sửa hồ sơ</button>}
        </div>
        {editingProfile && <form className="ob-settings-card ob-settings-profile-form" onSubmit={(event) => void saveProfile(event)}>
          <label className="ob-settings-label">Tên hiển thị<input className="ob-settings-input" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="ob-settings-label">Số điện thoại<input className="ob-settings-input" maxLength={12} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></label>
          <div className="ob-settings-form-actions"><button type="button" className="ob-settings-secondary" onClick={() => setEditingProfile(false)}>Hủy</button><button type="submit" className="ob-settings-primary" disabled={savingProfile}>{savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
        </form>}
        {profileNotice && <p className="ob-settings-notice" role="status">{profileNotice}</p>}
      </section>

      <section className="ob-settings-group">
        <h2>Hiển thị</h2>
        <div className="ob-settings-card ob-settings-options">
          <label className="ob-settings-row"><span className="ob-settings-option-icon"><Sun size={14} /></span><span className="ob-settings-row-copy"><strong>Chế độ sáng/tối</strong><small>Giao diện HarveyBook</small></span><select aria-label="Chế độ sáng/tối" value={theme} onChange={(event) => setTheme(event.target.value as ThemePreference)}><option value="auto">Tự động</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
          <label className="ob-settings-row"><span className="ob-settings-option-icon"><UserRound size={14} /></span><span className="ob-settings-row-copy"><strong>Kích thước chữ đọc</strong><small>Áp dụng cho trang đọc sách</small></span><select aria-label="Kích thước chữ đọc" value={readingSize} onChange={(event) => setReadingSize(event.target.value as ReadingSize)}><option value="small">Nhỏ</option><option value="medium">Vừa</option><option value="large">Lớn</option></select></label>
          <div className="ob-settings-row"><span className="ob-settings-option-icon">文</span><span className="ob-settings-row-copy"><strong>Ngôn ngữ</strong><small>Ngôn ngữ đang dùng trong ứng dụng</small></span><span className="ob-settings-static-value">Tiếng Việt</span></div>
        </div>
      </section>

      <section className="ob-settings-group">
        <h2>Đọc sách</h2>
        <div className="ob-settings-card ob-settings-options">
          <div className="ob-settings-row"><span className="ob-settings-option-icon"><Check size={14} /></span><span className="ob-settings-row-copy"><strong>Lưu tiến độ đọc</strong><small>Chương gần nhất được lưu tự động khi bạn mở nội dung.</small></span><span className="ob-settings-state">Theo tài khoản</span></div>
          <div className="ob-settings-row"><span className="ob-settings-option-icon"><Check size={14} /></span><span className="ob-settings-row-copy"><strong>Đồng bộ dữ liệu</strong><small>Tiến độ và chương đã lưu gắn với tài khoản</small></span><span className="ob-settings-state">Tài khoản</span></div>
          <div className="ob-settings-row is-muted"><span className="ob-settings-option-icon"><AlertCircle size={14} /></span><span className="ob-settings-row-copy"><strong>Thông báo sách mới</strong><small>Thông báo chưa được hỗ trợ</small></span></div>
        </div>
      </section>

      <section className="ob-settings-group">
        <h2>Khác</h2>
        <div className="ob-settings-card ob-settings-options">
          <Link className="ob-settings-row ob-settings-link-row" to="/support"><span className="ob-settings-option-icon"><ChevronRight size={14} /></span><span className="ob-settings-row-copy"><strong>Trợ giúp & Hỗ trợ</strong></span><ChevronRight size={14} /></Link>
          <button className="ob-settings-row ob-settings-link-row" type="button" onClick={() => { setPasswordOpen((open) => !open); setPasswordNotice(null); }}><span className="ob-settings-option-icon"><LockKeyhole size={14} /></span><span className="ob-settings-row-copy"><strong>{passwordOpen ? 'Đóng đổi mật khẩu' : 'Đổi mật khẩu'}</strong></span><ChevronRight size={14} /></button>
          {passwordOpen && <form className="ob-settings-password-form" onSubmit={(event) => void savePassword(event)}>
            {passwordNotice && <p className={`ob-settings-notice ${passwordNotice.kind}`} role={passwordNotice.kind === 'error' ? 'alert' : 'status'}>{passwordNotice.text}</p>}
            <label className="ob-settings-label">Mật khẩu hiện tại<input className="ob-settings-input" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <div className="ob-settings-password-fields"><label className="ob-settings-label">Mật khẩu mới<input className="ob-settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label className="ob-settings-label">Xác nhận mật khẩu<input className="ob-settings-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label></div>
            <button className="ob-settings-primary" type="submit" disabled={savingPassword}>{savingPassword ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</button>
          </form>}
        </div>
      </section>

      {user && <button className="ob-settings-logout" type="button" onClick={() => void signOut()}><LogOut size={14} />Đăng xuất</button>}
    </div>
  </ReaderLayout>;
}
