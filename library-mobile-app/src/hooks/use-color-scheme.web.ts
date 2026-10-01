import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Giữ màu sáng trong lần render tĩnh đầu tiên rồi đọc lại chế độ màu thực tế sau khi hydrate trên web.
 */
// Hook trả màu sáng trong lần dựng ban đầu, sau đó trả màu hệ thống trên web.
export function useColorScheme() {
  // Chặn khác biệt màu giữa HTML dựng sẵn và lần render đầu ở phía trình duyệt.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
