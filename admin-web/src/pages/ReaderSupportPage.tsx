// Import { useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/ReaderSupportPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useState, type FormEvent } from 'react';
// Import { BookOpen, Mail, Pencil, Send, Tag } từ lucide-react để dùng trong giao diện.
import { BookOpen, Mail, Pencil, Send, Tag } from 'lucide-react';
// Import { Link } từ react-router-dom để dùng trong giao diện.
import { Link } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import { errorMessage, submitReaderReport } từ ../api/client để dùng trong giao diện.
import { errorMessage, submitReaderReport } from '../api/client';

// Hàm ReaderSupportPage: Cho phép độc giả đã đăng nhập hoặc khách gửi liên hệ/báo lỗi tới ADMIN.
/**
 * Hàm/thành phần ReaderSupportPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useState, sendReport, preventDefault, FormData, setSaving, setError, setNotice.
 */
export function ReaderSupportPage() {
  // Biến { user } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user } = useAuth();
  // Biến [saving, setSaving] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [saving, setSaving] = useState(false);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');

  // Hàm sendReport: Xác thực form, gửi nội dung hỗ trợ và hiển thị mã tra cứu từ API.
  /**
   * Hàm/thành phần sendReport: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, FormData, setSaving, setError, setNotice, submitReaderReport, String, get.
   * Được tham chiếu tại: admin-web/src/pages/ReaderAccountPage.tsx.
   */
  async function sendReport(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Biến formElement nhận giá trị từ event.currentTarget. const không gán lại; let có thể cập nhật.
    const formElement = event.currentTarget;
    // Biến form nhận giá trị từ new FormData(formElement). const không gán lại; let có thể cập nhật.
    const form = new FormData(formElement);
    // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(true)
    setSaving(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến result nhận giá trị từ await submitReaderReport({ email: user?.email ?? String. const không gán lại; let có thể cập nhật.
      const result = await submitReaderReport({
        email: user?.email ?? String(form.get('email') ?? '').trim(),
        subject: String(form.get('subject') ?? '').trim(),
        message: String(form.get('message') ?? '').trim(),
        type: String(form.get('type')) === 'bug' ? 'bug' : 'contact',
      });
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice(result.confirmation_email_sent === false ? `Đã tiếp nhận yêu cầu${resu
      setNotice(result.confirmation_email_sent === false
        ? `Đã tiếp nhận yêu cầu${result.id ? ` — mã tra cứu ${result.id}` : ''}, nhưng chưa gửi được email xác nhận.`
        : `Đã tiếp nhận yêu cầu và gửi email xác nhận${result.id ? ` — mã tra cứu ${result.id}` : ''}.`);
      // Gọi/thực thi formElement.reset với đối số để cập nhật logic/giao diện: formElement.reset()
      formElement.reset();
    } catch (submitError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(submitError))
      setError(errorMessage(submitError));
    } finally {
      // Gọi/thực thi setSaving với đối số để cập nhật logic/giao diện: setSaving(false)
      setSaving(false);
    }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <ReaderShell> <div className="harvey-support-page"> <div className="harvey-sup.
  return (
    <ReaderShell>
      <div className="harvey-support-page">
      <div className="harvey-support-content">
        <section className="harvey-support-card">
          <p className="harvey-eyebrow">HARVEYBOOK · HỖ TRỢ</p>
          <h1>Liên hệ &amp; báo lỗi</h1>
          <p className="harvey-support-intro">Mô tả vấn đề hoặc gửi câu hỏi. Khách chưa đăng nhập cần cung cấp email để nhóm hỗ trợ phản hồi.</p>
          {error && <p className="harvey-support-alert is-error" role="alert">{error}</p>}
          {notice && <p className="harvey-support-alert is-success" role="status">{notice}</p>}
          <form className="harvey-support-form" onSubmit={(event) => void sendReport(event)}>
            {!user && <label className="harvey-form-field full">Email nhận phản hồi<span><Mail size={18} /><input autoComplete="email" maxLength={254} name="email" placeholder="Nhập email của bạn" required type="email" /></span></label>}
            {user && <p className="harvey-support-user full">Phản hồi sẽ được gửi tới tài khoản <strong>{user.email}</strong>.</p>}
            <label className="harvey-form-field">Loại yêu cầu<span><BookOpen size={18} /><select name="type"><option value="contact">Liên hệ hỗ trợ</option><option value="bug">Báo lỗi kỹ thuật</option></select></span></label>
            <label className="harvey-form-field">Tiêu đề<span><Tag size={18} /><input maxLength={200} name="subject" placeholder="Nhập tiêu đề" required /></span></label>
            <label className="harvey-form-field full">Nội dung<span className="is-textarea"><Pencil size={18} /><textarea maxLength={5000} name="message" placeholder="Mô tả chi tiết vấn đề của bạn..." required /></span></label>
            <button className="harvey-primary-button" disabled={saving} type="submit"><Send size={17} /> {saving ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
          </form>
          {!user && <p className="harvey-support-signin">Bạn cũng có thể <Link to="/login">đăng nhập</Link> trước khi gửi yêu cầu.</p>}
        </section>
      </div>
      </div>
    </ReaderShell>
  );
}
