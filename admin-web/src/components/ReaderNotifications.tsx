// Import { useEffect, useRef, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/components/ReaderNotifications.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useRef, useState } from 'react';
// Import { Bell } từ lucide-react để dùng trong giao diện.
import { Bell } from 'lucide-react';

/**
 * Hàm/thành phần ReaderNotifications: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useState, useEffect, contains, setOpen, focus, addEventListener, return, removeEventListener.
 */
export function ReaderNotifications() {
  // Biến [open, setOpen] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [open, setOpen] = useState(false);
  // Biến wrapRef nhận giá trị từ useRef<HTMLDivElement>(null). const không gán lại; let có thể cập nhật.
  const wrapRef = useRef<HTMLDivElement>(null);
  // Biến buttonRef nhận giá trị từ useRef<HTMLButtonElement>(null). const không gán lại; let có thể cập nhật.
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (!open) return; const closeOnOutsidePress = (event: Pointer
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện !open đúng.
    if (!open) return;
    /**
     * Hàm/thành phần closeOnOutsidePress: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: event.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: contains, setOpen.
     */
    const closeOnOutsidePress = (event: PointerEvent) => {
      // if chỉ chạy nhánh này khi điều kiện event.target instanceof Node && !wrapRef.current?.contains(event.target) đúng.
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    };
    /**
     * Hàm/thành phần closeOnEscape: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
     * Tham số/props: event.
     * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
     * Gọi tiếp: setOpen, focus.
     */
    const closeOnEscape = (event: KeyboardEvent) => {
      // if chỉ chạy nhánh này khi điều kiện event.key === 'Escape' đúng.
      if (event.key === 'Escape') {
        // Gọi/thực thi setOpen với đối số để cập nhật logic/giao diện: setOpen(false)
        setOpen(false);
        // Gọi/thực thi .focus với đối số để cập nhật logic/giao diện: buttonRef.current?.focus()
        buttonRef.current?.focus();
      }
    };
    // Gọi/thực thi document.addEventListener với đối số để cập nhật logic/giao diện: document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('pointerdown', closeOnOutsidePress);
    // Gọi/thực thi document.addEventListener với đối số để cập nhật logic/giao diện: document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('keydown', closeOnEscape);
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { document.removeEventListener('pointerdown', closeOnOutsidePress); docume.
    return () => {
      // Gọi/thực thi document.removeEventListener với đối số để cập nhật logic/giao diện: document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      // Gọi/thực thi document.removeEventListener với đối số để cập nhật logic/giao diện: document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <div className="booknest-notification-wrap reader-shared-notification" ref={wrap.
  return <div className="booknest-notification-wrap reader-shared-notification" ref={wrapRef}>
    <button ref={buttonRef} className="booknest-notification" type="button" aria-label="Thông báo" aria-expanded={open} aria-controls="reader-notifications" onClick={() => setOpen((value) => !value)}>
      <Bell size={22} />
    </button>
    {open && <section className="booknest-notification-popover" id="reader-notifications" role="dialog" aria-label="Thông báo">
      <h2>Thông báo</h2>
      <div className="booknest-notification-empty"><Bell size={22} /><strong>Chưa có thông báo</strong><p>Thông báo mới sẽ xuất hiện tại đây.</p></div>
    </section>}
  </div>;
}
