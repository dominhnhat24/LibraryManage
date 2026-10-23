import { useState, type FormEvent } from 'react';
import { ArrowLeft, BookOpen, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
      setNotice(`Đã tiếp nhận yêu cầu${result.id ? ` — mã tra cứu ${result.id}` : ''}.`);
      formElement.reset();
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reader-support-page min-h-screen bg-[#f7f8f6] text-[#202b28]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[900px] items-center justify-between px-4 sm:px-7">
          <Link className="inline-flex items-center gap-2 font-extrabold tracking-[0.08em] text-[#203a34]" to="/"><BookOpen size={20} /> OPENBOOK</Link>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#31564a]" to="/"><ArrowLeft size={15} /> Về thư viện</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-7 sm:py-12">
        <section className="border border-slate-200 bg-white p-5 sm:p-8">
          <p className="eyebrow">OpenBook · Hỗ trợ</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#203a34]">Liên hệ & báo lỗi</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Mô tả vấn đề hoặc gửi câu hỏi. Khách chưa đăng nhập cần cung cấp email để nhóm hỗ trợ phản hồi.</p>
          {error && <p className="mt-5 border-l-2 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</p>}
          {notice && <p className="mt-5 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}</p>}
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void sendReport(event)}>
            {!user && <label className="form-label sm:col-span-2">Email nhận phản hồi
              <input autoComplete="email" className="form-input mt-2" maxLength={254} name="email" required type="email" />
            </label>}
            {user && <p className="text-sm text-slate-600 sm:col-span-2">Phản hồi sẽ được gửi tới tài khoản <strong>{user.email}</strong>.</p>}
            <label className="form-label">Loại yêu cầu
              <select className="form-input mt-2" name="type"><option value="contact">Liên hệ hỗ trợ</option><option value="bug">Báo lỗi kỹ thuật</option></select>
            </label>
            <label className="form-label">Tiêu đề
              <input className="form-input mt-2" maxLength={200} name="subject" required />
            </label>
            <label className="form-label sm:col-span-2">Nội dung
              <textarea className="form-input mt-2 min-h-36" maxLength={5000} name="message" required />
            </label>
            <button className="button-primary sm:col-span-2 sm:justify-self-start" disabled={saving} type="submit">
              <Send size={15} /> {saving ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </form>
          {!user && <p className="mt-5 text-xs text-slate-500">Bạn cũng có thể <Link className="font-bold text-[#31564a] underline" to="/login">đăng nhập</Link> trước khi gửi yêu cầu.</p>}
        </section>
      </main>
    </div>
  );
}
