// Import { BookOpen, FileUp, Pencil, Trash2 } từ lucide-react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/BookTable.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { BookOpen, FileUp, Pencil, Trash2 } from 'lucide-react';
// Import { useState } từ react để dùng trong giao diện.
import { useState } from 'react';
// Import axios từ axios để dùng trong giao diện.
import axios from 'axios';
// Import type { Book } từ ../types để dùng trong giao diện.
import type { Book } from '../types';

// Biến categories nhận giá trị từ { ebook: 'E-book', audiobook: 'Sách nói', comic: 'Truyệ. const không gán lại; let có thể cập nhật.
const categories: Record<Book['category'], string> = {
  ebook: 'E-book',
  audiobook: 'Sách nói',
  comic: 'Truyện tranh',
  webnovel: 'Web novel',
};
// Biến genres nhận giá trị từ { van_hoc_viet_nam: 'Văn học Việt Nam', truyen_ngan_vie. const không gán lại; let có thể cập nhật.
const genres: Record<NonNullable<Book['genre']>, string> = {
  van_hoc_viet_nam: 'Văn học Việt Nam',
  truyen_ngan_viet_nam: 'Truyện ngắn Việt Nam',
  tho_viet_nam: 'Thơ Việt Nam',
  van_hoc_dan_gian: 'Văn học dân gian',
  van_hoc_the_gioi: 'Văn học thế giới',
  kinh_doanh: 'Kinh doanh',
  phat_trien_ban_than: 'Phát triển bản thân',
  tam_ly_hoc: 'Tâm lý học',
  lich_su: 'Lịch sử',
  khoa_hoc: 'Khoa học',
};

// Biến accessNames nhận giá trị từ { free: 'Miễn phí', premium: 'Premium', vip: 'VIP', }. const không gán lại; let có thể cập nhật.
const accessNames: Record<Book['access_level'], string> = {
  free: 'Miễn phí',
  premium: 'Premium',
  vip: 'VIP',
};

/**
 * Hàm/thành phần BookTable: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { books, setBooks, token, onEdit, onDele.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: map, setSelectedIds, includes, filter, async, confirm, alert, delete.
 */
export function BookTable({
  books,
  setBooks,
  token,
  onEdit,
  onDelete,
  onUpload,
  onRead,
}: {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  token: string;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onUpload: (book: Book) => void;
  onRead: (book: Book) => void;
}) {
  // Biến [selectedIds, setSelectedIds] nhận giá trị từ useState<string[]>([]). const không gán lại; let có thể cập nhật.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Xử lý chọn/bỏ chọn tất cả các checkbox
  /**
   * Hàm/thành phần handleSelectAll: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: e.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: map, setSelectedIds.
   */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if chỉ chạy nhánh này khi điều kiện e.target.checked đúng.
    if (e.target.checked) {
      // Biến allIds nhận giá trị từ books.map((book) => book._id). const không gán lại; let có thể cập nhật.
      const allIds = books.map((book) => book._id);
      // Gọi/thực thi setSelectedIds với đối số để cập nhật logic/giao diện: setSelectedIds(allIds)
      setSelectedIds(allIds);
    } else {
      // Gọi/thực thi setSelectedIds với đối số để cập nhật logic/giao diện: setSelectedIds([])
      setSelectedIds([]);
    }
  };

  // Xử lý chọn/bỏ chọn từng dòng sách độc lập
  /**
   * Hàm/thành phần handleSelectOne: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: id.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: includes, setSelectedIds, filter.
   */
  const handleSelectOne = (id: string) => {
    // if chỉ chạy nhánh này khi điều kiện selectedIds.includes(id) đúng.
    if (selectedIds.includes(id)) {
      // Gọi/thực thi setSelectedIds với đối số để cập nhật logic/giao diện: setSelectedIds(selectedIds.filter((item) => item !== id))
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      // Gọi/thực thi setSelectedIds với đối số để cập nhật logic/giao diện: setSelectedIds([...selectedIds, id])
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Gọi API xóa hàng loạt
/**
 * Hàm/thành phần handleBulkDelete: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: confirm, alert, delete, setBooks, filter, includes, setSelectedIds, error.
 */
const handleBulkDelete = async () => {
  // if chỉ chạy nhánh này khi điều kiện selectedIds.length === 0 đúng.
  if (selectedIds.length === 0) return;

  // Biến confirmDelete nhận giá trị từ window.confirm( `Bạn có chắc chắn muốn xóa vĩnh viễn ${. const không gán lại; let có thể cập nhật.
  const confirmDelete = window.confirm(
    `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} cuốn sách đã chọn không?`
  );

  // if chỉ chạy nhánh này khi điều kiện !confirmDelete đúng.
  if (!confirmDelete) return;

  // if chỉ chạy nhánh này khi điều kiện !token đúng.
  if (!token) {
    // Gọi/thực thi alert với đối số để cập nhật logic/giao diện: alert('Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.')
    alert('Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.');
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
    return;
  }

  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến response nhận giá trị từ await axios.delete( 'http:. const không gán lại; let có thể cập nhật.
    const response = await axios.delete(
      'http://localhost:5000/api/v1/books/bulk',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          ids: selectedIds,
        },
      }
    );

    // Gọi/thực thi alert với đối số để cập nhật logic/giao diện: alert(response.data.message)
    alert(response.data.message);

    // Gọi/thực thi setBooks với đối số để cập nhật logic/giao diện: setBooks((prevBooks) => prevBooks.filter((book) => !selectedIds.includes(book._i
    setBooks((prevBooks) =>
      prevBooks.filter((book) => !selectedIds.includes(book._id))
    );

    // Gọi/thực thi setSelectedIds với đối số để cập nhật logic/giao diện: setSelectedIds([])
    setSelectedIds([]);
  } catch (error: any) {
    // Gọi/thực thi console.error với đối số để cập nhật logic/giao diện: console.error( 'Lỗi khi xóa hàng loạt:', error.response?.data || error.message )
    console.error(
      'Lỗi khi xóa hàng loạt:',
      error.response?.data || error.message
    );

    // Gọi/thực thi alert với đối số để cập nhật logic/giao diện: alert( error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện xóa hàng lo
    alert(
      error.response?.data?.message ||
      'Có lỗi xảy ra khi thực hiện xóa hàng loạt.'
    );
  }
};


  // if chỉ chạy nhánh này khi điều kiện books.length === 0 đúng.
  if (books.length === 0) {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="flex min-h-64 flex-col items-center justify-center px-6 text-c.
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <span className="grid h-14 w-14 place-items-center border border-[#e6e4dc] bg-[#faf9f6] text-[#78837c]">
          <BookOpen size={24} strokeWidth={1.5} />
        </span>
        <h3 className="mt-4 text-sm font-bold text-slate-800">Chưa tìm thấy đầu sách</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Thử đổi từ khóa hoặc bộ lọc, hoặc thêm sách mới vào thư viện.</p>
      </div>
    );
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="space-y-4"> {} {selectedIds.length > 0 && ( <div className="mx.
  return (
    <div className="space-y-4">
  {/* 🛠️ Thanh công cụ hành động hàng loạt (Thiết kế mới hiện đại, trực quan hơn) */}
  {selectedIds.length > 0 && (
    <div className="mx-6 flex items-center justify-between bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border border-red-200/80 px-6 py-3.5 rounded-2xl shadow-md backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs shadow-inner">
          ✓
        </span>
        <span className="text-slate-700 font-medium text-sm">
          Đã chọn <strong className="text-red-600 font-bold px-1.5 py-0.5 bg-red-100/60 rounded-md">{selectedIds.length}</strong> đầu sách
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Nút hủy chọn nhanh */}
        <button
          onClick={() => setSelectedIds([])}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition hover:bg-slate-200/50 cursor-pointer"
          type="button"
        >
          Bỏ chọn tất cả
        </button>

        {/* Nút xóa chính */}
        <button
          onClick={handleBulkDelete}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Xóa các mục đã chọn ({selectedIds.length})
        </button>
      </div>
    </div>
  )}

  <div className="overflow-x-auto rounded-xl border border-[#e9e8e2] shadow-sm bg-white">
    <table className="w-full min-w-[950px] border-collapse text-left">
      <thead>
        <tr className="border-b border-[#e9e8e2] bg-[#F8FBF9] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <th className="p-4 w-12 text-center">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={books.length > 0 && selectedIds.length === books.length}
              className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500 cursor-pointer transition accent-rose-600"
            />
          </th>
              <th className="px-6 py-3.5">Đầu sách</th>
              <th className="px-4 py-3.5">Thể loại nội dung</th>
              <th className="px-4 py-3.5">Định dạng</th>
              <th className="px-4 py-3.5">Giá / gói</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5">Năm</th>
              <th className="px-6 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3F0]">
            {books.map((book) => {
              // Biến isSelected nhận giá trị từ selectedIds.includes(book._id). const không gán lại; let có thể cập nhật.
              const isSelected = selectedIds.includes(book._id);
              // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <tr className={`group transition-colors hover:bg-[#FFFFFF] ${isSelected ? 'bg-.
              return (
                <tr className={`group transition-colors hover:bg-[#FFFFFF] ${isSelected ? 'bg-indigo-50/40' : ''}`} key={book._id}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(book._id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex min-w-64 items-center gap-3.5">
                      <img
                        className="h-[62px] w-12 shrink-0 border border-[#DDE9E6] bg-[#f1eee6] object-cover"
                        src={book.cover_url || '/book-cover-placeholder.svg'}
                        alt={`Bìa sách ${book.title}`}
                        onError={(event) => { event.currentTarget.src = '/book-cover-placeholder.svg'; }}
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-bold leading-5 text-[#202b28]">{book.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{book.author_name}</p>
                        <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{book.slug || book._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex border border-[#DDE9E6] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {genres[book.genre || 'van_hoc_viet_nam']}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex border border-[#DDE9E6] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {categories[book.category] || book.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${book.access_level === 'free' ? 'text-[#486b58]' : 'text-[#92703d]'}`}>
                      <span className={`h-1.5 w-1.5 ${book.access_level === 'free' ? 'bg-[#6a9277]' : 'bg-[#c59b58]'}`} />
                      {accessNames[book.access_level]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`status-badge ${book.status === 'published' ? 'status-published' : 'status-draft'}`}>
                      <span className="h-1.5 w-1.5 bg-current" />
                      {book.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs tabular-nums text-slate-500">{book.publication_year || '—'}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button className="icon-button" type="button" aria-label={`Đọc sách ${book.title}`} onClick={() => onRead(book)}>
                        <BookOpen size={15} />
                      </button>
                      <button className="icon-button" type="button" aria-label={`Tải file cho ${book.title}`} onClick={() => onUpload(book)}>
                        <FileUp size={15} />
                      </button>
                      <button className="icon-button" type="button" aria-label={`Sửa ${book.title}`} onClick={() => onEdit(book)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button icon-button-danger" type="button" aria-label={`Xóa ${book.title}`} onClick={() => onDelete(book)}>
                        <Trash2 size={15} />
                      </button>
                    </div>  
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
