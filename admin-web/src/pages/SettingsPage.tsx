// Import { useEffect, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/SettingsPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState, type FormEvent } from 'react';
// Import { AlertCircle, Check, ChevronRight, LockKeyhole, LogOut, Sun, UserRound } từ lucide-react để dùng trong giao diện.
import { AlertCircle, Check, ChevronRight, LockKeyhole, LogOut, Sun, UserRound } from 'lucide-react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { ReaderLayout } từ ../components/ReaderLayout để dùng trong giao diện.
import { ReaderLayout } from '../components/ReaderLayout';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { errorMessage } từ ../api/client để dùng trong giao diện.
import { errorMessage } from '../api/client';

// Kiểu ThemePreference mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type ThemePreference = 'auto' | 'light' | 'dark';
// Kiểu ReadingSize mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type ReadingSize = 'small' | 'medium' | 'large';

/**
 * Hàm/thành phần SettingsPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, getItem, useEffect, setItem, saveProfile, preventDefault.
 */
export function SettingsPage() {
  // Biến { user, updateProfile, changePasswo nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, updateProfile, changePassword, logout } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [editingProfile, setEditingProfile] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [editingProfile, setEditingProfile] = useState(false);
  // Biến [name, setName] nhận giá trị từ useState(user?.name ?? ''). const không gán lại; let có thể cập nhật.
  const [name, setName] = useState(user?.name ?? '');
  // Biến [phoneNumber, setPhoneNumber] nhận giá trị từ useState(user?.phone_number ?? ''). const không gán lại; let có thể cập nhật.
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  // Biến [savingProfile, setSavingProfile] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [savingProfile, setSavingProfile] = useState(false);
  // Biến [profileNotice, setProfileNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [profileNotice, setProfileNotice] = useState('');
  // Biến [theme, setTheme] nhận giá trị từ useState<ThemePreference>(() => (localStorage.getItem('. const không gán lại; let có thể cập nhật.
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('openbook.theme') as ThemePreference) || 'auto');
  // Biến [readingSize, setReadingSize] nhận giá trị từ useState<ReadingSize>(() => (localStorage.getItem('open. const không gán lại; let có thể cập nhật.
  const [readingSize, setReadingSize] = useState<ReadingSize>(() => (localStorage.getItem('openbook.reading-size') as ReadingSize) || 'medium');
  // Biến [passwordOpen, setPasswordOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [passwordOpen, setPasswordOpen] = useState(false);
  // Biến [currentPassword, setCurrentPasswor nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [currentPassword, setCurrentPassword] = useState('');
  // Biến [newPassword, setNewPassword] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [newPassword, setNewPassword] = useState('');
  // Biến [confirmPassword, setConfirmPasswor nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [confirmPassword, setConfirmPassword] = useState('');
  // Biến [passwordNotice, setPasswordNotice] nhận giá trị từ useState<{ kind: 'success' | 'error'; text: string } | . const không gán lại; let có thể cập nhật.
  const [passwordNotice, setPasswordNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  // Biến [savingPassword, setSavingPassword] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [savingPassword, setSavingPassword] = useState(false);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { document.documentElement.dataset.bookTheme = theme === 'auto'
  useEffect(() => {
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: document.documentElement.dataset.bookTheme = theme === 'auto' ? '' : theme
    document.documentElement.dataset.bookTheme = theme === 'auto' ? '' : theme;
    // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('openbook.theme', theme)
    localStorage.setItem('openbook.theme', theme);
  }, [theme]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { document.documentElement.dataset.readerSize = readingSize; loc
  useEffect(() => {
    // Gọi/thực thi biểu thức để cập nhật logic/giao diện: document.documentElement.dataset.readerSize = readingSize
    document.documentElement.dataset.readerSize = readingSize;
    // Gọi/thực thi localStorage.setItem với đối số để cập nhật logic/giao diện: localStorage.setItem('openbook.reading-size', readingSize)
    localStorage.setItem('openbook.reading-size', readingSize);
  }, [readingSize]);

  /**
   * Hàm/thành phần saveProfile: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setSavingProfile, setProfileNotice, updateProfile, trim, setName, setPhoneNumber, setEditingProfile.
   */
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault(); setSavingProfile(true); setProfileNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến updated nhận giá trị từ await updateProfile({ name: name.trim(), phone_number: . const không gán lại; let có thể cập nhật.
      const updated = await updateProfile({ name: name.trim(), phone_number: phoneNumber.trim() || null });
      // Gọi/thực thi setName với đối số để cập nhật logic/giao diện: setName(updated.name)
      setName(updated.name); setPhoneNumber(updated.phone_number ?? ''); setEditingProfile(false); setProfileNotice('Thông tin tài khoản đã được cập nhật.');
    } catch (error) { setProfileNotice(errorMessage(error)); }
    finally { setSavingProfile(false); }
  }

  /**
   * Hàm/thành phần savePassword: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setPasswordNotice, setSavingPassword, changePassword, setCurrentPassword, setNewPassword, setConfirmPassword, navigate.
   */
  async function savePassword(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault(); setPasswordNotice(null);
    // if chỉ chạy nhánh này khi điều kiện !currentPassword đúng.
    if (!currentPassword) { setPasswordNotice({ kind: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' }); return; }
    // if chỉ chạy nhánh này khi điều kiện newPassword.length < 8 || newPassword.length > 128 đúng.
    if (newPassword.length < 8 || newPassword.length > 128) { setPasswordNotice({ kind: 'error', text: 'Mật khẩu mới cần từ 8 đến 128 ký tự.' }); return; }
    // if chỉ chạy nhánh này khi điều kiện newPassword !== confirmPassword đúng.
    if (newPassword !== confirmPassword) { setPasswordNotice({ kind: 'error', text: 'Mật khẩu xác nhận chưa khớp.' }); return; }
    // Gọi/thực thi setSavingPassword với đối số để cập nhật logic/giao diện: setSavingPassword(true)
    setSavingPassword(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await changePassword(currentPassword, newPassword)
      await changePassword(currentPassword, newPassword);
      // Gọi/thực thi setPasswordNotice với đối số để cập nhật logic/giao diện: setPasswordNotice({ kind: 'success', text: 'Mật khẩu đã được cập nhật. Hãy đăng
      setPasswordNotice({ kind: 'success', text: 'Mật khẩu đã được cập nhật. Hãy đăng nhập lại.' });
      // Gọi/thực thi setCurrentPassword với đối số để cập nhật logic/giao diện: setCurrentPassword('')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/login', { replace: true })
      navigate('/login', { replace: true });
    } catch (error) { setPasswordNotice({ kind: 'error', text: errorMessage(error) }); }
    finally { setSavingPassword(false); }
  }

  /**
   * Hàm/thành phần signOut: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: logout, navigate.
   * Được tham chiếu tại: admin-web/src/api/client.ts.
   */
  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderLayout> <div className="bn-page-header"><h1 className="bn-page-title-main.
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
