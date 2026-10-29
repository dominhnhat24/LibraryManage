import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';

export function ReaderNotifications() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

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
