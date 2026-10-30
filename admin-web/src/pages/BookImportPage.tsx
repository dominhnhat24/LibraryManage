// Import { useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/BookImportPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useState, type FormEvent } from 'react';
// Import { AlertCircle, BookDown, Check, ExternalLink, FileCheck2, Image, LoaderCircle, S từ lucide-react để dùng trong giao diện.
import { AlertCircle, BookDown, Check, ExternalLink, FileCheck2, Image, LoaderCircle, Search } from 'lucide-react';
// Import { AdminLayout } từ ../components/AdminLayout để dùng trong giao diện.
import { AdminLayout } from '../components/AdminLayout';
// Import { errorMessage, importBookCandidate, searchBookImportCandidates, type BookImport từ ../api/client để dùng trong giao diện.
import {
  errorMessage, importBookCandidate, searchBookImportCandidates,
  type BookImportCandidate, type BookImportSearchResult,
} from '../api/client';

// Kiểu ImportState mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type ImportState = 'importing' | 'imported' | 'already_imported' | 'duplicate' | 'failed';
// Kiểu Confirmation mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type Confirmation = { license: boolean; cover: boolean };

// Trang import ebook thật từ Wikisource; chỉ hiển thị ứng viên backend đã kiểm tra license, nội dung và bìa.
/**
 * Hàm/thành phần BookImportPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, Set, search, preventDefault, trim, setLoading, setError, setSummary.
 */
export function BookImportPage() {
  // Biến [query, setQuery] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [query, setQuery] = useState('');
  // Biến [result, setResult] nhận giá trị từ useState<BookImportSearchResult | null>(null). const không gán lại; let có thể cập nhật.
  const [result, setResult] = useState<BookImportSearchResult | null>(null);
  // Biến [selected, setSelected] nhận giá trị từ useState<Set<string>>(new Set()). const không gán lại; let có thể cập nhật.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Biến [confirmations, setConfirmations] nhận giá trị từ useState<Record<string, Confirmation>>({}). const không gán lại; let có thể cập nhật.
  const [confirmations, setConfirmations] = useState<Record<string, Confirmation>>({});
  // Biến [states, setStates] nhận giá trị từ useState<Record<string, ImportState>>({}). const không gán lại; let có thể cập nhật.
  const [states, setStates] = useState<Record<string, ImportState>>({});
  // Biến [failures, setFailures] nhận giá trị từ useState<Record<string, string>>({}). const không gán lại; let có thể cập nhật.
  const [failures, setFailures] = useState<Record<string, string>>({});
  // Biến [loading, setLoading] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(false);
  // Biến [importing, setImporting] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [importing, setImporting] = useState(false);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [summary, setSummary] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [summary, setSummary] = useState('');

  /**
   * Hàm/thành phần search: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, trim, setLoading, setError, setSummary, setResult, setSelected, Set.
   */
  async function search(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Biến term nhận giá trị từ query.trim(). const không gán lại; let có thể cập nhật.
    const term = query.trim();
    // if chỉ chạy nhánh này khi điều kiện term.length < 2 || loading || importing đúng.
    if (term.length < 2 || loading || importing) return;
    // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(true)
    setLoading(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setSummary với đối số để cập nhật logic/giao diện: setSummary('')
    setSummary('');
    // Gọi/thực thi setResult với đối số để cập nhật logic/giao diện: setResult(null)
    setResult(null);
    // Gọi/thực thi setSelected với đối số để cập nhật logic/giao diện: setSelected(new Set())
    setSelected(new Set());
    // Gọi/thực thi setConfirmations với đối số để cập nhật logic/giao diện: setConfirmations({})
    setConfirmations({});
    // Gọi/thực thi setStates với đối số để cập nhật logic/giao diện: setStates({})
    setStates({});
    // Gọi/thực thi setFailures với đối số để cập nhật logic/giao diện: setFailures({})
    setFailures({});
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến response nhận giá trị từ await searchBookImportCandidates(term). const không gán lại; let có thể cập nhật.
      const response = await searchBookImportCandidates(term);
      // Gọi/thực thi setResult với đối số để cập nhật logic/giao diện: setResult(response)
      setResult(response);
    } catch (searchError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(searchError))
      setError(errorMessage(searchError));
    } finally {
      // Gọi/thực thi setLoading với đối số để cập nhật logic/giao diện: setLoading(false)
      setLoading(false);
    }
  }

  /**
   * Hàm/thành phần toggleSelected: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: id.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSelected, Set, has, delete, add.
   */
  function toggleSelected(id: string) {
    // Gọi/thực thi setSelected với đối số để cập nhật logic/giao diện: setSelected((current) => { const next = new Set(current); if (next.has(id)) next
    setSelected((current) => {
      // Biến next nhận giá trị từ new Set(current). const không gán lại; let có thể cập nhật.
      const next = new Set(current);
      // if chỉ chạy nhánh này khi điều kiện next.has(id) đúng.
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: next.
      return next;
    });
  }

  /**
   * Hàm/thành phần confirm: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: id, key, value.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setConfirmations.
   */
  function confirm(id: string, key: keyof Confirmation, value: boolean) {
    // Gọi/thực thi setConfirmations với đối số để cập nhật logic/giao diện: setConfirmations((current) => ({ ...current, [id]: { ...(current[id] || { licens
    setConfirmations((current) => ({
      ...current,
      [id]: { ...(current[id] || { license: false, cover: false }), [key]: value },
    }));
  }

  /**
   * Hàm/thành phần importSelected: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: filter, has, setImporting, setError, setSummary, setStates, setFailures, importBookCandidate.
   */
  async function importSelected() {
    // if chỉ chạy nhánh này khi điều kiện !result || importing đúng.
    if (!result || importing) return;
    // Biến queue nhận giá trị từ result.candidates.filter((candidate) => selected.has(ca. const không gán lại; let có thể cập nhật.
    const queue = result.candidates.filter((candidate) => selected.has(candidate.id)
      && confirmations[candidate.id]?.license && confirmations[candidate.id]?.cover
      && states[candidate.id] !== 'imported' && states[candidate.id] !== 'already_imported'
      && states[candidate.id] !== 'duplicate');
    // if chỉ chạy nhánh này khi điều kiện queue.length === 0 đúng.
    if (queue.length === 0) return;
    // Gọi/thực thi setImporting với đối số để cập nhật logic/giao diện: setImporting(true)
    setImporting(true);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setSummary với đối số để cập nhật logic/giao diện: setSummary('')
    setSummary('');
    // Biến importedCount nhận giá trị từ 0. const không gán lại; let có thể cập nhật.
    let importedCount = 0;
    // Biến duplicateCount nhận giá trị từ 0. const không gán lại; let có thể cập nhật.
    let duplicateCount = 0;
    // Biến failedCount nhận giá trị từ 0. const không gán lại; let có thể cập nhật.
    let failedCount = 0;
    // Vòng lặp duyệt dữ liệu hoặc lặp theo điều kiện để tạo/cập nhật kết quả.
    for (const candidate of queue) {
      // Gọi/thực thi setStates với đối số để cập nhật logic/giao diện: setStates((current) => ({ ...current, [candidate.id]: 'importing' }))
      setStates((current) => ({ ...current, [candidate.id]: 'importing' }));
      // Gọi/thực thi setFailures với đối số để cập nhật logic/giao diện: setFailures((current) => ({ ...current, [candidate.id]: '' }))
      setFailures((current) => ({ ...current, [candidate.id]: '' }));
      // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
      try {
        // Biến response nhận giá trị từ await importBookCandidate(candidate.id, true, true). const không gán lại; let có thể cập nhật.
        const response = await importBookCandidate(candidate.id, true, true);
        // Gọi/thực thi setStates với đối số để cập nhật logic/giao diện: setStates((current) => ({ ...current, [candidate.id]: response.status }))
        setStates((current) => ({ ...current, [candidate.id]: response.status }));
        // if chỉ chạy nhánh này khi điều kiện response.status === 'imported' đúng.
        if (response.status === 'imported') importedCount += 1;
        else duplicateCount += 1;
      } catch (importError: unknown) {
        // Gọi/thực thi biểu thức để cập nhật logic/giao diện: failedCount += 1
        failedCount += 1;
        // Biến message nhận giá trị từ errorMessage(importError). const không gán lại; let có thể cập nhật.
        const message = errorMessage(importError);
        // Gọi/thực thi setStates với đối số để cập nhật logic/giao diện: setStates((current) => ({ ...current, [candidate.id]: 'failed' }))
        setStates((current) => ({ ...current, [candidate.id]: 'failed' }));
        // Gọi/thực thi setFailures với đối số để cập nhật logic/giao diện: setFailures((current) => ({ ...current, [candidate.id]: message }))
        setFailures((current) => ({ ...current, [candidate.id]: message }));
      }
    }
    // Gọi/thực thi setSummary với đối số để cập nhật logic/giao diện: setSummary(`Hoàn tất: ${importedCount} mới, ${duplicateCount} đã có, ${failedCou
    setSummary(`Hoàn tất: ${importedCount} mới, ${duplicateCount} đã có, ${failedCount} lỗi.`);
    // Gọi/thực thi setImporting với đối số để cập nhật logic/giao diện: setImporting(false)
    setImporting(false);
  }

  // Biến readyCount nhận giá trị từ result?.candidates.filter((candidate) => selected.has(c. const không gán lại; let có thể cập nhật.
  const readyCount = result?.candidates.filter((candidate) => selected.has(candidate.id)
    && confirmations[candidate.id]?.license && confirmations[candidate.id]?.cover
    && states[candidate.id] !== 'imported' && states[candidate.id] !== 'already_imported'
    && states[candidate.id] !== 'duplicate').length || 0;
  // Biến completedCount nhận giá trị từ Object.values(states).filter((state) => state !== 'impo. const không gán lại; let có thể cập nhật.
  const completedCount = Object.values(states).filter((state) => state !== 'importing').length;
  // Biến queueCount nhận giá trị từ Object.values(states).filter((state) => state === 'impo. const không gán lại; let có thể cập nhật.
  const queueCount = Object.values(states).filter((state) => state === 'importing').length;

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <AdminLayout> <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg.
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24795C]">Nguồn có license rõ ràng</p>
            <h1 className="mt-1 text-2xl font-bold text-[#153D31]">Tìm và import ebook</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#526B86]">
              Tìm tác phẩm tiếng Việt trên Wikisource. Chỉ hiện sách có bản quyền được hỗ trợ, nội dung đủ dài,
              ảnh nguồn hợp lệ và có thể tạo PDF tiếng Việt để trình đọc hiện tại mở.
            </p>
          </div>
          <a className="inline-flex items-center gap-2 text-sm font-medium text-[#24795C] hover:underline"
            href="https://vi.wikisource.org/wiki/Wikisource:Th%E1%BA%BB_b%E1%BA%A3n_quy%E1%BB%81n" rel="noreferrer" target="_blank">
            Chính sách license <ExternalLink size={15} />
          </a>
        </header>

        <section className="rounded-2xl border border-[#DDE9E6] bg-white p-4 shadow-sm sm:p-5">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void search(event)}>
            <label className="sr-only" htmlFor="book-import-query">Từ khóa sách</label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#DDE9E6] bg-[#FAFCFB] px-3">
              <Search aria-hidden="true" className="shrink-0 text-[#7C9189]" size={18} />
              <input autoComplete="off" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#153D31] outline-none placeholder:text-[#8A9A94]"
                disabled={loading || importing} id="book-import-query" onChange={(event) => setQuery(event.target.value)}
                placeholder="Tên sách hoặc tác giả" value={query} />
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#24795C] px-5 text-sm font-semibold text-white transition hover:bg-[#1B6249] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || importing || query.trim().length < 2} type="submit">
              {loading ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={17} />}
              {loading ? 'Đang xác minh nguồn…' : 'Tìm sách'}
            </button>
          </form>
          <p className="mt-3 text-xs leading-5 text-[#71827B]">
            Mỗi lượt tìm kiểm tra metadata Wikisource, thẻ license trên trang, văn bản tiếng Việt, ảnh bìa và font Unicode để tạo PDF.
            Tác vụ import tải lại các dữ liệu này trước khi lưu.
          </p>
        </section>

        {error ? <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div> : null}
        {summary ? <div aria-live="polite" className="rounded-xl border border-[#C3E5D0] bg-[#E3F4EB] p-3 text-sm font-medium text-[#1B6249]">{summary}</div> : null}

        {result ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#DDE9E6] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-[#153D31]">Kết quả cho “{result.query}”</h2>
                <p className="mt-1 text-sm text-[#526B86]">{result.found} kết quả nguồn · {result.checked} đã kiểm tra · {result.eligible} đủ điều kiện · {result.excluded} bị loại</p>
                {Object.keys(states).length ? <p aria-live="polite" className="mt-1 text-xs text-[#71827B]">{completedCount} hoàn tất · {queueCount} đang tải/lưu</p> : null}
              </div>
              <button className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#24795C] px-4 text-sm font-semibold text-white hover:bg-[#1B6249] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={readyCount === 0 || importing} onClick={() => void importSelected()} type="button">
                {importing ? <LoaderCircle className="animate-spin" size={17} /> : <BookDown size={17} />}
                {importing ? `Đang import ${completedCount + queueCount}/${completedCount + queueCount + readyCount}` : `Import ${readyCount} sách đã chọn`}
              </button>
            </div>

            {result.exclusions.length ? (
              <details className="rounded-xl border border-[#DDE9E6] bg-white px-4 py-3 text-sm">
                <summary className="cursor-pointer font-medium text-[#526B86]">Vì sao một số kết quả bị loại?</summary>
                <ul className="mt-2 space-y-1 text-xs text-[#71827B]">
                  {result.exclusions.map((item) => <li key={item.reason}>{item.count} — {item.reason}</li>)}
                </ul>
                {result.excludedCandidates.length ? <ul className="mt-3 space-y-2 border-t border-[#EEF3F0] pt-3 text-xs text-[#71827B]">
                  {result.excludedCandidates.map((item) => <li key={item.id}><span className="font-semibold text-[#526B86]">{item.title}:</span> {item.reasons.join('; ')}</li>)}
                </ul> : null}
              </details>
            ) : null}

            {result.candidates.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {result.candidates.map((candidate) => (
                  <CandidateCard key={candidate.id} candidate={candidate} selected={selected.has(candidate.id)}
                    confirmation={confirmations[candidate.id] || { license: false, cover: false }}
                    state={states[candidate.id]} failure={failures[candidate.id] || ''}
                    onSelect={() => toggleSelected(candidate.id)} onConfirm={(key, checked) => confirm(candidate.id, key, checked)} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#C8D8D1] bg-white px-6 py-12 text-center">
                <BookDown className="mx-auto text-[#90A69C]" size={32} />
                <h2 className="mt-3 font-semibold text-[#153D31]">Chưa có sách đủ điều kiện</h2>
                <p className="mx-auto mt-1 max-w-xl text-sm text-[#71827B]">
                  Không có kết quả nào vượt qua tất cả bước kiểm tra. Thử từ khóa khác hoặc xem lý do loại ở phía trên.
                  Hệ thống không thêm sách mẫu hoặc thay bằng bản xem trước.
                </p>
              </div>
            )}
          </section>
        ) : !loading && !error ? (
          <div className="rounded-2xl border border-dashed border-[#C8D8D1] bg-white px-6 py-12 text-center text-sm text-[#71827B]">
            Nhập tên sách hoặc tác giả để tìm tác phẩm thật trên Wikisource.
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

/**
 * Hàm/thành phần CandidateCard: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { candidate, selected, confirmation, sta.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: return, Boolean, toLocaleString, onConfirm.
 */
function CandidateCard({
  candidate, selected, confirmation, state, failure, onSelect, onConfirm,
}: {
  candidate: BookImportCandidate;
  selected: boolean;
  confirmation: Confirmation;
  state?: ImportState;
  failure: string;
  onSelect: () => void;
  onConfirm: (key: keyof Confirmation, checked: boolean) => void;
}) {
  // Biến statusText nhận giá trị từ state === 'importing' ? 'Đang tải và xác minh PDF…' : s. const không gán lại; let có thể cập nhật.
  const statusText = state === 'importing' ? 'Đang tải và xác minh PDF…'
    : state === 'imported' ? 'Đã import thành công'
      : state === 'already_imported' || state === 'duplicate' ? 'Đã tồn tại — không tạo trùng'
        : state === 'failed' ? `Import thất bại: ${failure}` : '';
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <article className="overflow-hidden rounded-2xl border border-[#DDE9E6] bg-whi.
  return (
    <article className="overflow-hidden rounded-2xl border border-[#DDE9E6] bg-white shadow-sm">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="flex h-48 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DDE9E6] bg-[#F5FAF8]">
          {candidate.coverUrl ? <img alt={`Ảnh từ trang nguồn ${candidate.title}; cần đối chiếu trước import`} className="h-full w-full object-contain" loading="lazy" src={candidate.coverUrl} /> : <Image className="text-[#90A69C]" size={28} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold leading-6 text-[#153D31]">{candidate.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-[#526B86]">{candidate.author}</p>
            </div>
            <input aria-label={`Chọn ${candidate.title}`} checked={selected} className="mt-1 h-4 w-4 shrink-0 accent-[#24795C]" disabled={Boolean(state && state !== 'failed')} onChange={onSelect} type="checkbox" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-[#E3F4EB] px-2.5 py-1 font-medium text-[#24795C]">Tiếng Việt</span>
            <span className="rounded-full bg-[#F1F5F3] px-2.5 py-1 text-[#526B86]">PDF · {candidate.contentCharacters.toLocaleString('vi-VN')} ký tự</span>
            {candidate.publicationYear ? <span className="rounded-full bg-[#F1F5F3] px-2.5 py-1 text-[#526B86]">{candidate.publicationYear}</span> : null}
          </div>
          <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#71827B]">{candidate.summary}</p>
          <a className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#24795C] hover:underline" href={candidate.sourceUrl} rel="noreferrer" target="_blank">
            Mở trang nguồn <ExternalLink size={13} />
          </a>
        </div>
      </div>
      <div className="space-y-3 border-t border-[#E7EEEB] bg-[#FAFCFB] p-4 sm:p-5">
        <div className="flex items-start gap-2 text-xs leading-5 text-[#526B86]">
          <FileCheck2 className="mt-0.5 shrink-0 text-[#24795C]" size={15} />
          <span>License tác phẩm: <a className="font-semibold text-[#24795C] hover:underline" href={candidate.licenseUrl} rel="noreferrer" target="_blank">{candidate.license}</a>. Ảnh bìa: {candidate.coverSourceUrl ? <a className="font-semibold text-[#24795C] hover:underline" href={candidate.coverSourceUrl} rel="noreferrer" target="_blank">{candidate.coverLicense || 'mở metadata ảnh'}</a> : candidate.coverLicense || 'đã xác minh theo metadata ảnh'}{candidate.coverLicenseUrl ? <> · <a className="font-semibold text-[#24795C] hover:underline" href={candidate.coverLicenseUrl} rel="noreferrer" target="_blank">điều khoản</a></> : null}{candidate.coverAttribution ? ` · Ghi công: ${candidate.coverAttribution}` : null} · {candidate.coverWidth}×{candidate.coverHeight}px.</span>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#526B86]">
          <input checked={confirmation.license} className="mt-0.5 accent-[#24795C]" onChange={(event) => onConfirm('license', event.target.checked)} type="checkbox" />
          <span>Tôi đã mở trang nguồn và xác nhận license cho phép lưu trữ, sử dụng trong dự án.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#526B86]">
          <input checked={confirmation.cover} className="mt-0.5 accent-[#24795C]" onChange={(event) => onConfirm('cover', event.target.checked)} type="checkbox" />
          <span>Tôi đã đối chiếu ảnh xem trước và xác nhận đây là ảnh bìa đúng tác phẩm.</span>
        </label>
        {statusText ? <p aria-live="polite" className={`text-xs font-semibold ${state === 'failed' ? 'text-red-700' : 'text-[#24795C]'}`}>{state === 'imported' ? <Check className="mr-1 inline" size={14} /> : null}{statusText}</p> : null}
      </div>
    </article>
  );
}
