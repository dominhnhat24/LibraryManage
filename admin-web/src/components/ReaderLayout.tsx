// Import type { ReactNode } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ReaderLayout.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import type { ReactNode } from 'react';
// Import { useNavigate } từ react-router-dom để dùng trong giao diện.
import { useNavigate } from 'react-router-dom';
// Import { ReaderShell } từ ./ReaderShell để dùng trong giao diện.
import { ReaderShell } from './ReaderShell';

// Interface ReaderLayoutProps quy định các trường và kiểu dữ liệu mà object/thành phần cần tuân theo.
interface ReaderLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

/** Kept as a compatibility wrapper; all reader routes now share ReaderShell. */
/**
 * Hàm/thành phần ReaderLayout: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { children, searchValue, onSearchChange,.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useNavigate, onSearchSubmit, navigate, encodeURIComponent.
 */
export function ReaderLayout({ children, searchValue, onSearchChange, onSearchSubmit }: ReaderLayoutProps) {
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  /**
   * Hàm/thành phần submitSearch: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: value.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: onSearchSubmit, navigate, encodeURIComponent.
   * Được tham chiếu tại: admin-web/src/components/ReaderShell.tsx.
   */
  const submitSearch = (value: string) => {
    // if chỉ chạy nhánh này khi điều kiện onSearchSubmit đúng.
    if (onSearchSubmit) onSearchSubmit(value);
    else navigate(value ? `/?search=${encodeURIComponent(value)}` : '/');
  };

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderShell searchValue={searchValue} onSearchChange={onSearchChange} onSearchS.
  return <ReaderShell
    searchValue={searchValue}
    onSearchChange={onSearchChange}
    onSearchSubmit={submitSearch}
  >{children}</ReaderShell>;
}
