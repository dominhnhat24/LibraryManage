// Import { StrictMode } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/main.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { StrictMode } from 'react';
// Import { createRoot } từ react-dom/client để dùng trong giao diện.
import { createRoot } from 'react-dom/client';
// Import { BrowserRouter } từ react-router-dom để dùng trong giao diện.
import { BrowserRouter } from 'react-router-dom';
// Import { App } từ ./App để dùng trong giao diện.
import { App } from './App';
// Import { AuthProvider } từ ./auth/AuthContext để dùng trong giao diện.
import { AuthProvider } from './auth/AuthContext';
// Import module từ ./styles.css để dùng trong giao diện.
import './styles.css';
// Import module từ ./harvey.css để dùng trong giao diện.
import './harvey.css';

// Hàm renderApplication: Gắn router, provider xác thực và ứng dụng vào DOM của Vite.
// Gọi/thực thi createRoot với đối số để cập nhật logic/giao diện: createRoot(document.getElementById('root')!).render( <StrictMode> <BrowserRouter
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
