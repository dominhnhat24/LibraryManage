import { useState, type FormEvent } from 'react';
import { BookOpen, Mail, Pencil, Send, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReaderShell } from '../components/ReaderShell';
import { errorMessage, submitReaderReport } from '../api/client';

// Hàm ReaderSupportPage: Cho phép độc giả đã đăng nhập hoặc khách gửi liên hệ/báo lỗi tới ADMIN.
export function ReaderSupportPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Hàm sendReport: Xác thực form, gửi nội dung hỗ trợ và hiển thị mã tra cứu từ API.
  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await submitReaderReport({
        email: user?.email ?? String(form.get('email') ?? '').trim(),
        subject: String(form.get('subject') ?? '').trim(),
        message: String(form.get('message') ?? '').trim(),
        type: String(form.get('type')) === 'bug' ? 'bug' : 'contact',
      });
      setNotice(result.confirmation_email_sent === false
        ? `Đã tiếp nhận yêu cầu${result.id ? ` — mã tra cứu ${result.id}` : ''}, nhưng chưa gửi được email xác nhận.`
        : `Đã tiếp nhận yêu cầu và gửi email xác nhận${result.id ? ` — mã tra cứu ${result.id}` : ''}.`);
      formElement.reset();
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

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
