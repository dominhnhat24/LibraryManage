// Import { ChevronLeft, ChevronRight } từ lucide-react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/Pagination.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Import type { PaginationData } từ ../types để dùng trong giao diện.
import type { PaginationData } from '../types';

// Hàm getPageNumbers: Tính tối đa năm số trang lân cận để thanh phân trang gọn trên màn hình nhỏ.
/**
 * Hàm/thành phần getPageNumbers: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: current, total.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: max, min, from.
 */
function getPageNumbers(current: number, total: number): number[] {
  // Biến start nhận giá trị từ Math.max(1, Math.min(current - 2, total - 4)). const không gán lại; let có thể cập nhật.
  const start = Math.max(1, Math.min(current - 2, total - 4));
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: Array.from({ length: Math.max(0, Math.min(5, total)) }, (_, index) => start + in.
  return Array.from({ length: Math.max(0, Math.min(5, total)) }, (_, index) => start + index);
}

// Hàm Pagination: Hiển thị trạng thái kết quả và các nút điều hướng trang từ metadata backend.
/**
 * Hàm/thành phần Pagination: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { pagination, onPageChange, itemLabel = .
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: getPageNumbers, min, return, onPageChange, map.
 */
export function Pagination({ pagination, onPageChange, itemLabel = 'đầu sách' }: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  // Biến pages nhận giá trị từ getPageNumbers(pagination.page, pagination.totalPages). const không gán lại; let có thể cập nhật.
  const pages = getPageNumbers(pagination.page, pagination.totalPages);
  // Biến firstItem nhận giá trị từ pagination.total === 0 ? 0 : (pagination.page - 1) * pa. const không gán lại; let có thể cập nhật.
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  // Biến lastItem nhận giá trị từ Math.min(pagination.page * pagination.limit, pagination. const không gán lại; let có thể cập nhật.
  const lastItem = Math.min(pagination.page * pagination.limit, pagination.total);

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="flex flex-col gap-4 border-t border-[#EEF3F0] px-4 py-4 sm:fle.
  return (
    <div className="flex flex-col gap-4 border-t border-[#EEF3F0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs font-medium text-slate-500">
        Hiển thị <span className="font-bold text-slate-800">{firstItem}–{lastItem}</span> trong{' '}
        <span className="font-bold text-slate-800">{pagination.total}        </span> {itemLabel}
      </p>
      <nav aria-label="Phân trang" className="flex items-center gap-1">
        <button
          className="control-button"
          type="button"
          aria-label="Trang trước"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page) => (
          <button
            className={`control-button ${page === pagination.page ? 'page-button-active' : ''}`}
            key={page}
            type="button"
            aria-current={page === pagination.page ? 'page' : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="control-button"
          type="button"
          aria-label="Trang sau"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
