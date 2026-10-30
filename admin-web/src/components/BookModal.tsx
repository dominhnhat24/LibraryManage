// Import { useEffect, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/BookModal.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState, type FormEvent } from 'react';
// Import { BookOpen, ImagePlus, X } từ lucide-react để dùng trong giao diện.
import { BookOpen, ImagePlus, X } from 'lucide-react';
// Import type { Book } từ ../types để dùng trong giao diện.
import type { Book } from '../types';
// Import type { BookFormPayload } từ ../api/client để dùng trong giao diện.
import type { BookFormPayload } from '../api/client';

// Biến initialForm nhận giá trị từ { title: '', author_name: '', category: 'ebook', genre:. const không gán lại; let có thể cập nhật.
const initialForm: BookFormPayload = {
  title: '',
  author_name: '',
  category: 'ebook',
  genre: 'van_hoc_viet_nam',
  publication_year: null,
  description: '',
  cover_url: '',
  access_level: 'free',
  status: 'published',
};

// Hàm BookModal: Hiển thị form tạo/sửa metadata đúng với Book model và không nhận trường giá chưa được backend hỗ trợ.
/**
 * Hàm/thành phần BookModal: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { book, saving, uploadProgress = 0, onCl.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, setForm, setPdfFile, setFormError, submitForm, preventDefault, onSave.
 */
export function BookModal({ book, saving, uploadProgress = 0, onClose, onSave }: {
  book: Book | null;
  saving: boolean;
  uploadProgress?: number;
  onClose: () => void;
  onSave: (payload: BookFormPayload, pdfFile: File | null) => Promise<void>;
}) {
  // Biến [form, setForm] nhận giá trị từ useState<BookFormPayload>(initialForm). const không gán lại; let có thể cập nhật.
  const [form, setForm] = useState<BookFormPayload>(initialForm);
  // Biến [pdfFile, setPdfFile] nhận giá trị từ useState<File | null>(null). const không gán lại; let có thể cập nhật.
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  // Biến [formError, setFormError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [formError, setFormError] = useState('');
  // Biến pdfSupported nhận giá trị từ form.category !== 'audiobook'. const không gán lại; let có thể cập nhật.
  const pdfSupported = form.category !== 'audiobook';

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { setForm(book ? { title: book.title, author_name: book.author_n
  useEffect(() => {
    // Gọi/thực thi setForm với đối số để cập nhật logic/giao diện: setForm(book ? { title: book.title, author_name: book.author_name, category: boo
    setForm(book ? {
      title: book.title,
      author_name: book.author_name,
      category: book.category,
      genre: book.genre || 'van_hoc_viet_nam',
      publication_year: book.publication_year,
      description: book.description || '',
      cover_url: book.cover_url || '',
      access_level: book.access_level,
      status: book.status,
    } : initialForm);
    // Gọi/thực thi setPdfFile với đối số để cập nhật logic/giao diện: setPdfFile(null)
    setPdfFile(null);
    // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('')
    setFormError('');
  }, [book]);

  // Hàm updateField: Cập nhật một thuộc tính form theo kiểu dữ liệu của payload API.
  /**
   * Hàm/thành phần updateField: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: field, value.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setForm.
   */
  function updateField<K extends keyof BookFormPayload>(field: K, value: BookFormPayload[K]) {
    // Gọi/thực thi setForm với đối số để cập nhật logic/giao diện: setForm((current) => ({ ...current, [field]: value }))
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Hàm submitForm: Kiểm tra trường bắt buộc, chuyển năm xuất bản sang number và gửi payload tới callback lưu.
  /**
   * Hàm/thành phần submitForm: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setFormError, onSave, trim.
   * Được tham chiếu tại: admin-web/src/components/ChapterModal.tsx.
   */
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError('')
    setFormError('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await onSave({ ...form, title: form.title.trim(), author_name: form.author_name.
      await onSave({
        ...form,
        title: form.title.trim(),
        author_name: form.author_name.trim(),
        publication_year: form.publication_year || null,
      }, pdfFile);
    } catch (error) {
      // Gọi/thực thi setFormError với đối số để cập nhật logic/giao diện: setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin s
      setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin sách.');
    }
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { .
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      // if chỉ chạy nhánh này khi điều kiện event.target === event.currentTarget && !saving đúng.
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section aria-labelledby="book-modal-title" aria-modal="true" className="modal-panel" role="dialog">
        <header className="flex items-start justify-between border-b border-[#DDE9E6] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-[#e9eee9] text-[#24795C]"><BookOpen size={19} /></span>
            <div>
              <p className="eyebrow">Danh mục thư viện</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#202b28]" id="book-modal-title">
                {book ? 'Chỉnh sửa đầu sách' : 'Thêm đầu sách'}
              </h2>
            </div>
          </div>
          <button aria-label="Đóng cửa sổ" className="icon-button" disabled={saving} onClick={onClose} type="button">
            <X size={17} />
          </button>
        </header>

        <form className="max-h-[calc(100vh-11rem)] overflow-y-auto" onSubmit={submitForm}>
          <div className="grid gap-x-5 gap-y-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <label className="field-label sm:col-span-2">
              Tên sách <span className="text-rose-600">*</span>
              <input autoFocus className="form-input mt-2" maxLength={200} onChange={(event) => updateField('title', event.target.value)} placeholder="Ví dụ: Nhà giả kim" required value={form.title} />
            </label>
            <label className="field-label">
              Tác giả <span className="text-rose-600">*</span>
              <input className="form-input mt-2" maxLength={120} onChange={(event) => updateField('author_name', event.target.value)} placeholder="Tên tác giả" required value={form.author_name} />
            </label>
            <label className="field-label">
              Hình thức nội dung <span className="text-rose-600">*</span>
              <select className="form-input mt-2" onChange={(event) => {
                // Biến nextCategory nhận giá trị từ event.target.value as BookFormPayload['category']. const không gán lại; let có thể cập nhật.
                const nextCategory = event.target.value as BookFormPayload['category'];
                // Gọi/thực thi updateField với đối số để cập nhật logic/giao diện: updateField('category', nextCategory)
                updateField('category', nextCategory);
                // if chỉ chạy nhánh này khi điều kiện nextCategory === 'audiobook' đúng.
                if (nextCategory === 'audiobook') setPdfFile(null);
              }} value={form.category}>
                <option value="ebook">E-book</option>
                <option value="audiobook">Sách nói</option>
                <option value="comic">Truyện tranh</option>
                <option value="webnovel">Web novel</option>
              </select>
            </label>
            <label className="field-label">
              Danh mục sách
              <select className="form-input mt-2" onChange={(event) => updateField('genre', event.target.value as BookFormPayload['genre'])} value={form.genre}>
                <option value="van_hoc_viet_nam">Văn học Việt Nam</option>
                <option value="truyen_ngan_viet_nam">Truyện ngắn Việt Nam</option>
                <option value="tho_viet_nam">Thơ Việt Nam</option>
                <option value="van_hoc_dan_gian">Văn học dân gian</option>
                <option value="van_hoc_the_gioi">Văn học thế giới</option>
                <option value="kinh_doanh">Kinh doanh</option>
                <option value="phat_trien_ban_than">Phát triển bản thân</option>
                <option value="tam_ly_hoc">Tâm lý học</option>
                <option value="lich_su">Lịch sử</option>
                <option value="khoa_hoc">Khoa học</option>
              </select>
            </label>
            <label className="field-label">
              Mức truy cập / gói
              <select className="form-input mt-2" onChange={(event) => updateField('access_level', event.target.value as BookFormPayload['access_level'])} value={form.access_level}>
                <option value="free">Miễn phí</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
              <span className="mt-1.5 block text-[11px] font-normal text-slate-500">Backend hiện quản lý quyền đọc theo gói, chưa có giá riêng cho từng sách.</span>
            </label>
            <label className="field-label">
              Trạng thái
              <select className="form-input mt-2" onChange={(event) => updateField('status', event.target.value as BookFormPayload['status'])} value={form.status}>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </label>
            <label className="field-label">
              Năm xuất bản
              <input className="form-input mt-2" max="3000" min="1" onChange={(event) => updateField('publication_year', event.target.value ? Number(event.target.value) : null)} placeholder="2026" type="number" value={form.publication_year ?? ''} />
            </label>
            <label className="field-label sm:col-span-2">
              Đường dẫn ảnh bìa
              <div className="relative mt-2">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="form-input pl-10" onChange={(event) => updateField('cover_url', event.target.value)} placeholder="https://example.com/book-cover.jpg" value={form.cover_url} />
              </div>
            </label>
            <label className="field-label sm:col-span-2">
              Mô tả
              <textarea className="form-input mt-2 min-h-24 resize-y" maxLength={5000} onChange={(event) => updateField('description', event.target.value)} placeholder="Giới thiệu ngắn về cuốn sách..." value={form.description} />
            </label>
            <label className="field-label sm:col-span-2">
              File PDF (tùy chọn)
              <input
                accept="application/pdf,.pdf"
                className="form-input mt-2 file:mr-3 file:border-0 file:bg-[#E3F4EB] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#24795C]"
                disabled={saving || !pdfSupported}
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <span className="mt-1.5 block text-[11px] font-normal text-slate-500">
                {pdfSupported
                  ? 'PDF được lưu trong kho riêng tư và chỉ tải được sau khi API xác thực quyền đọc. Tối đa 100 MiB.'
                  : 'Sách nói cần file âm thanh; không thể tải PDF cho thể loại này.'}
              </span>
            </label>
            {formError && <p className="sm:col-span-2 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</p>}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-[#DDE9E6] bg-[#FFFFFF] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button className="button-secondary" disabled={saving} onClick={onClose} type="button">Hủy</button>
            <button className="button-primary" disabled={saving} type="submit">
              {saving ? `Đang lưu${pdfFile ? ` PDF ${uploadProgress}%` : '...'}` : book ? 'Lưu thay đổi' : 'Tạo đầu sách'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
