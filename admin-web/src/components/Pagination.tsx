import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationData } from '../types';

// Hàm getPageNumbers: Tính tối đa năm số trang lân cận để thanh phân trang gọn trên màn hình nhỏ.
function getPageNumbers(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: Math.max(0, Math.min(5, total)) }, (_, index) => start + index);
}

// Hàm Pagination: Hiển thị trạng thái kết quả và các nút điều hướng trang từ metadata backend.
export function Pagination({ pagination, onPageChange, itemLabel = 'đầu sách' }: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const pages = getPageNumbers(pagination.page, pagination.totalPages);
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const lastItem = Math.min(pagination.page * pagination.limit, pagination.total);

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
