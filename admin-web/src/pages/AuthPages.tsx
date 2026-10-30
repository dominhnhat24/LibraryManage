// Import { useEffect, useRef, useState, type FormEvent } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/AuthPages.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
// Import { useNavigate, useLocation, useSearchParams, Navigate } từ react-router-dom để dùng trong giao diện.
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
// Import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound, LoaderCircle, ArrowRight } từ lucide-react để dùng trong giao diện.
import { 
  Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound,
  LoaderCircle, ArrowRight 
} from 'lucide-react';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { errorMessage, requestRegistrationCode, resendRegistrationCode, verifyRegistrat từ ../api/client để dùng trong giao diện.
import { 
  errorMessage, requestRegistrationCode, resendRegistrationCode, 
  verifyRegistrationEmail 
} from '../api/client';

/**
 * Hàm/thành phần safeReturnPath: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: value, fallback, allowedPrefix.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: URL, startsWith.
 */
function safeReturnPath(value: unknown, fallback: string, allowedPrefix: '/admin' | '/'): string {
  // if chỉ chạy nhánh này khi điều kiện typeof value !== 'string' || !value đúng.
  if (typeof value !== 'string' || !value) return fallback;
  // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
  try {
    // Biến destination nhận giá trị từ new URL(value, window.location.origin). const không gán lại; let có thể cập nhật.
    const destination = new URL(value, window.location.origin);
    // Biến path nhận giá trị từ destination.pathname. const không gán lại; let có thể cập nhật.
    const path = destination.pathname;
    // Biến allowed nhận giá trị từ allowedPrefix === '/admin' ? path === '/admin' || path.. const không gán lại; let có thể cập nhật.
    const allowed = allowedPrefix === '/admin'
      ? path === '/admin' || path.startsWith('/admin/')
      : !path.startsWith('/admin');
    // if chỉ chạy nhánh này khi điều kiện destination.origin !== window.location.origin || !allowed || path === '/login' | đúng.
    if (destination.origin !== window.location.origin || !allowed || path === '/login' || path === '/register') return fallback;
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: `${path}${destination.search}${destination.hash}`.
    return `${path}${destination.search}${destination.hash}`;
  } catch {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: fallback.
    return fallback;
  }
}
 

/**
 * Hàm/thành phần LoginPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { admin = false }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export function LoginPage({ admin = false }: { admin?: boolean }) {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <AuthPage admin={admin} />.
  return <AuthPage admin={admin} />;
}

/**
 * Hàm/thành phần RegisterPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 */
export function RegisterPage() {
  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <AuthPage admin={false} />.
  return <AuthPage admin={false} />;
}

/**
 * Hàm/thành phần AuthPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: { admin = false }.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useLocation, useSearchParams, useState, useEffect, setIsRightPanelActive, clearTimeout.
 */
export function AuthPage({ admin = false }: { admin?: boolean }) {
  // Biến { user, login, loginAdmin, logout } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, login, loginAdmin, logout } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến location nhận giá trị từ useLocation(). const không gán lại; let có thể cập nhật.
  const location = useLocation();
  // Biến [searchParams] nhận giá trị từ useSearchParams(). const không gán lại; let có thể cập nhật.
  const [searchParams] = useSearchParams();

  // Biến [isRightPanelActive, setIsRightPane nhận giá trị từ useState(location.pathname === '/register'). const không gán lại; let có thể cập nhật.
  const [isRightPanelActive, setIsRightPanelActive] = useState(location.pathname === '/register');
  // Biến authNavigationTimer nhận giá trị từ useRef<ReturnType<typeof setTimeout> | null>(null). const không gán lại; let có thể cập nhật.
  const authNavigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { setIsRightPanelActive(location.pathname === '/register'); }, [
  useEffect(() => {
    // Gọi/thực thi setIsRightPanelActive với đối số để cập nhật logic/giao diện: setIsRightPanelActive(location.pathname === '/register')
    setIsRightPanelActive(location.pathname === '/register');
  }, [location.pathname]);

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => () => { if (authNavigationTimer.current) clearTimeout(authNaviga
  useEffect(() => () => {
    // if chỉ chạy nhánh này khi điều kiện authNavigationTimer.current đúng.
    if (authNavigationTimer.current) clearTimeout(authNavigationTimer.current);
  }, []);

  /**
   * Hàm/thành phần switchAuthMode: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: register.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setIsRightPanelActive, clearTimeout, setTimeout, navigate.
   */
  function switchAuthMode(register: boolean) {
    // Gọi/thực thi setIsRightPanelActive với đối số để cập nhật logic/giao diện: setIsRightPanelActive(register)
    setIsRightPanelActive(register);
    // if chỉ chạy nhánh này khi điều kiện authNavigationTimer.current đúng.
    if (authNavigationTimer.current) clearTimeout(authNavigationTimer.current);
    // Gọi/thực thi setTimeout với đối số để cập nhật logic/giao diện: authNavigationTimer.current = setTimeout(() => { authNavigationTimer.current = n
    authNavigationTimer.current = setTimeout(() => {
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: authNavigationTimer.current = null
      authNavigationTimer.current = null;
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(register ? '/register' : '/login', { state: location.state })
      navigate(register ? '/register' : '/login', { state: location.state });
    }, 720);
  }

  // ================= 1. LOGIC ĐĂNG NHẬP & VALIDATION =================
  // Biến [loginEmail, setLoginEmail] nhận giá trị từ useState(searchParams.get('email') ?? ''). const không gán lại; let có thể cập nhật.
  const [loginEmail, setLoginEmail] = useState(searchParams.get('email') ?? '');
  // Biến [loginPassword, setLoginPassword] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [loginPassword, setLoginPassword] = useState('');
  // Biến [showLoginPassword, setShowLoginPas nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  // Biến [loginError, setLoginError] nhận giá trị từ useState( searchParams.get('forbidden') ? 'Tài khoản nà. const không gán lại; let có thể cập nhật.
  const [loginError, setLoginError] = useState(
    searchParams.get('forbidden') ? 'Tài khoản này không có quyền quản trị.' : ''
  );
  // Biến [loginSubmitting, setLoginSubmittin nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  // Biến emailVerified nhận giá trị từ searchParams.get('verified') === '1'. const không gán lại; let có thể cập nhật.
  const emailVerified = searchParams.get('verified') === '1';

  // Validation lỗi cho ô đăng nhập
  // Biến [loginEmailError, setLoginEmailErro nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [loginEmailError, setLoginEmailError] = useState('');
  // Biến [loginPasswordError, setLoginPasswo nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [loginPasswordError, setLoginPasswordError] = useState('');

/**
 * Hàm/thành phần SocialAuthButtons: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: alert, return, handleSocialClick.
 */
function SocialAuthButtons() {
  /**
   * Hàm/thành phần handleSocialClick: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: provider.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: alert.
   */
  const handleSocialClick = (provider: string) => {
    // Gọi/thực thi alert với đối số để cập nhật logic/giao diện: alert(`Chức năng đăng nhập bằng ${provider} đang được phát triển.`)
    alert(`Chức năng đăng nhập bằng ${provider} đang được phát triển.`);
  };

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <div className="pt-2"> <p className="text-[11px] font-semibold text-slate-400 .
  return (
    <div className="pt-2">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Hoặc tiếp tục với
      </p>
      <div className="flex justify-center items-center gap-3">
        <button
          type="button"
          onClick={() => handleSocialClick('Google')}
          title="Đăng nhập bằng Google"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick('Facebook')}
          title="Đăng nhập bằng Facebook"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleSocialClick('LinkedIn')}
          title="Đăng nhập bằng LinkedIn"
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

  /**
   * Hàm/thành phần validateLoginForm: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setLoginEmailError, setLoginPasswordError, trim, test.
   */
  function validateLoginForm(): boolean {
    // Biến isValid nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let isValid = true;
    // Gọi/thực thi setLoginEmailError với đối số để cập nhật logic/giao diện: setLoginEmailError('')
    setLoginEmailError('');
    // Gọi/thực thi setLoginPasswordError với đối số để cập nhật logic/giao diện: setLoginPasswordError('')
    setLoginPasswordError('');

    // if chỉ chạy nhánh này khi điều kiện !loginEmail.trim() đúng.
    if (!loginEmail.trim()) {
      // Gọi/thực thi setLoginEmailError với đối số để cập nhật logic/giao diện: setLoginEmailError('Vui lòng nhập Email')
      setLoginEmailError('Vui lòng nhập Email');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      // Gọi/thực thi setLoginEmailError với đối số để cập nhật logic/giao diện: setLoginEmailError('Email không hợp lệ')
      setLoginEmailError('Email không hợp lệ');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // if chỉ chạy nhánh này khi điều kiện !loginPassword đúng.
    if (!loginPassword) {
      // Gọi/thực thi setLoginPasswordError với đối số để cập nhật logic/giao diện: setLoginPasswordError('Vui lòng nhập Mật khẩu')
      setLoginPasswordError('Vui lòng nhập Mật khẩu');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: isValid.
    return isValid;
  }

  /**
   * Hàm/thành phần handleLoginSubmit: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setLoginError, validateLoginForm, setLoginSubmitting, loginAdmin, trim, toLowerCase, login.
   */
  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setLoginError với đối số để cập nhật logic/giao diện: setLoginError('')
    setLoginError('');

    // if chỉ chạy nhánh này khi điều kiện !validateLoginForm() đúng.
    if (!validateLoginForm()) return;

    // Gọi/thực thi setLoginSubmitting với đối số để cập nhật logic/giao diện: setLoginSubmitting(true)
    setLoginSubmitting(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến account nhận giá trị từ admin ? await loginAdmin(loginEmail.trim().toLowerCase(. const không gán lại; let có thể cập nhật.
      const account = admin
        ? await loginAdmin(loginEmail.trim().toLowerCase(), loginPassword)
        : await login(loginEmail.trim().toLowerCase(), loginPassword);

      // if chỉ chạy nhánh này khi điều kiện account && account.role !== (admin ? 'ADMIN' : 'USER') đúng.
      if (account && account.role !== (admin ? 'ADMIN' : 'USER')) {
        // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await logout()
        await logout();
        // Gọi/thực thi setLoginError với đối số để cập nhật logic/giao diện: setLoginError( admin ? 'Tài khoản chưa được cấp quyền ADMIN.' : 'Vui lòng đăng n
        setLoginError(
          admin ? 'Tài khoản chưa được cấp quyền ADMIN.' : 'Vui lòng đăng nhập tài khoản độc giả.'
        );
        // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
        return;
      }

      // Biến target nhận giá trị từ admin ? safeReturnPath((location.state as { from?: stri. const không gán lại; let có thể cập nhật.
      const target = admin
        ? safeReturnPath((location.state as { from?: string } | null)?.from, '/admin/dashboard', '/admin')
        : safeReturnPath((location.state as { from?: string } | null)?.from, '/', '/');
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate(target, { replace: true })
      navigate(target, { replace: true });
    } catch (err: unknown) {
      // Gọi/thực thi setLoginError với đối số để cập nhật logic/giao diện: setLoginError(errorMessage(err) || 'Đăng nhập thất bại.')
      setLoginError(errorMessage(err) || 'Đăng nhập thất bại.');
    } finally {
      // Gọi/thực thi setLoginSubmitting với đối số để cập nhật logic/giao diện: setLoginSubmitting(false)
      setLoginSubmitting(false);
    }
  }

  // ================= 2. LOGIC ĐĂNG KÝ, OTP & VALIDATION =================
  // Biến [regName, setRegName] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regName, setRegName] = useState('');
  // Biến [regPhone, setRegPhone] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regPhone, setRegPhone] = useState('');
  // Biến [regEmail, setRegEmail] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regEmail, setRegEmail] = useState('');
  // Biến [regPassword, setRegPassword] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regPassword, setRegPassword] = useState('');
  // Biến [showRegPassword, setShowRegPasswor nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [showRegPassword, setShowRegPassword] = useState(false);
  // Biến [regError, setRegError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regError, setRegError] = useState('');
  // Biến [stepOtp, setStepOtp] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [stepOtp, setStepOtp] = useState(false);
  // Biến [verified, setVerified] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [verified, setVerified] = useState(false);
  // Biến [otp, setOtp] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [otp, setOtp] = useState('');
  // Biến [regSubmitting, setRegSubmitting] nhận giá trị từ useState(false). const không gán lại; let có thể cập nhật.
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Validation lỗi cho ô đăng ký
  // Biến [regNameError, setRegNameError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regNameError, setRegNameError] = useState('');
  // Biến [regPhoneError, setRegPhoneError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regPhoneError, setRegPhoneError] = useState('');
  // Biến [regEmailError, setRegEmailError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regEmailError, setRegEmailError] = useState('');
  // Biến [regPasswordError, setRegPasswordEr nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [regPasswordError, setRegPasswordError] = useState('');
  // Biến [otpError, setOtpError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [otpError, setOtpError] = useState('');

  /**
   * Hàm/thành phần validateRegisterForm: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setRegNameError, setRegPhoneError, setRegEmailError, setRegPasswordError, trim, test.
   */
  function validateRegisterForm(): boolean {
    // Biến isValid nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let isValid = true;
    // Gọi/thực thi setRegNameError với đối số để cập nhật logic/giao diện: setRegNameError('')
    setRegNameError('');
    // Gọi/thực thi setRegPhoneError với đối số để cập nhật logic/giao diện: setRegPhoneError('')
    setRegPhoneError('');
    // Gọi/thực thi setRegEmailError với đối số để cập nhật logic/giao diện: setRegEmailError('')
    setRegEmailError('');
    // Gọi/thực thi setRegPasswordError với đối số để cập nhật logic/giao diện: setRegPasswordError('')
    setRegPasswordError('');

    // if chỉ chạy nhánh này khi điều kiện !regName.trim() đúng.
    if (!regName.trim()) {
      // Gọi/thực thi setRegNameError với đối số để cập nhật logic/giao diện: setRegNameError('Vui lòng nhập Họ và tên')
      setRegNameError('Vui lòng nhập Họ và tên');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // if chỉ chạy nhánh này khi điều kiện regPhone.trim() && !/^\+?[0-9()\s-]{7,12}$/.test(regPhone.trim()) đúng.
    if (regPhone.trim() && !/^\+?[0-9()\s-]{7,12}$/.test(regPhone.trim())) {
      // Gọi/thực thi setRegPhoneError với đối số để cập nhật logic/giao diện: setRegPhoneError('Số điện thoại không hợp lệ (7–12 ký tự số)')
      setRegPhoneError('Số điện thoại không hợp lệ (7–12 ký tự số)');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // if chỉ chạy nhánh này khi điều kiện !regEmail.trim() đúng.
    if (!regEmail.trim()) {
      // Gọi/thực thi setRegEmailError với đối số để cập nhật logic/giao diện: setRegEmailError('Vui lòng nhập Email')
      setRegEmailError('Vui lòng nhập Email');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      // Gọi/thực thi setRegEmailError với đối số để cập nhật logic/giao diện: setRegEmailError('Email không đúng định dạng')
      setRegEmailError('Email không đúng định dạng');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // if chỉ chạy nhánh này khi điều kiện !regPassword đúng.
    if (!regPassword) {
      // Gọi/thực thi setRegPasswordError với đối số để cập nhật logic/giao diện: setRegPasswordError('Vui lòng nhập Mật khẩu')
      setRegPasswordError('Vui lòng nhập Mật khẩu');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    } else if (regPassword.length < 8 || regPassword.length > 128) {
      // Gọi/thực thi setRegPasswordError với đối số để cập nhật logic/giao diện: setRegPasswordError('Mật khẩu cần từ 8 đến 128 ký tự')
      setRegPasswordError('Mật khẩu cần từ 8 đến 128 ký tự');
      // Gọi/thực thi biểu thức để cập nhật logic/giao diện: isValid = false
      isValid = false;
    }

    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: isValid.
    return isValid;
  }

  /**
   * Hàm/thành phần handleRegisterSubmit: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setRegError, validateRegisterForm, setRegSubmitting, requestRegistrationCode, trim, toLowerCase, setStepOtp.
   */
  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError('')
    setRegError('');

    // if chỉ chạy nhánh này khi điều kiện !validateRegisterForm() đúng.
    if (!validateRegisterForm()) return;

    // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(true)
    setRegSubmitting(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await requestRegistrationCode(regName.trim(), regPhone.trim(), regEmail.trim().t
      await requestRegistrationCode(regName.trim(), regPhone.trim(), regEmail.trim().toLowerCase(), regPassword);
      // Gọi/thực thi setStepOtp với đối số để cập nhật logic/giao diện: setStepOtp(true)
      setStepOtp(true);
    } catch (err: unknown) {
      // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError(errorMessage(err) || 'Gửi mã xác nhận thất bại.')
      setRegError(errorMessage(err) || 'Gửi mã xác nhận thất bại.');
    } finally {
      // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(false)
      setRegSubmitting(false);
    }
  }

  /**
   * Hàm/thành phần handleVerificationSubmit: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: event.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: preventDefault, setRegError, setOtpError, trim, setRegSubmitting, verifyRegistrationEmail, toLowerCase, setVerified.
   */
  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    // Gọi/thực thi event.preventDefault với đối số để cập nhật logic/giao diện: event.preventDefault()
    event.preventDefault();
    // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError('')
    setRegError('');
    // Gọi/thực thi setOtpError với đối số để cập nhật logic/giao diện: setOtpError('')
    setOtpError('');

    // if chỉ chạy nhánh này khi điều kiện !otp.trim() || otp.length !== 6 đúng.
    if (!otp.trim() || otp.length !== 6) {
      // Gọi/thực thi setOtpError với đối số để cập nhật logic/giao diện: setOtpError('Vui lòng nhập đủ 6 số OTP')
      setOtpError('Vui lòng nhập đủ 6 số OTP');
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }

    // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(true)
    setRegSubmitting(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await verifyRegistrationEmail(regEmail.trim().toLowerCase(), otp.trim())
      await verifyRegistrationEmail(regEmail.trim().toLowerCase(), otp.trim());
      // Gọi/thực thi setVerified với đối số để cập nhật logic/giao diện: setVerified(true)
      setVerified(true);
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await logout()
      await logout();
    } catch (err: unknown) {
      // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError(errorMessage(err) || 'Xác thực OTP thất bại.')
      setRegError(errorMessage(err) || 'Xác thực OTP thất bại.');
    } finally {
      // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(false)
      setRegSubmitting(false);
    }
  }

  /**
   * Hàm/thành phần handleResendCode: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: không có tham số.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setRegError, setRegSubmitting, resendRegistrationCode, trim, toLowerCase, alert, errorMessage.
   */
  async function handleResendCode() {
    // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError('')
    setRegError('');
    // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(true)
    setRegSubmitting(true);
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // await chờ tác vụ bất đồng bộ hoàn tất rồi mới cập nhật giao diện/trạng thái: await resendRegistrationCode(regEmail.trim().toLowerCase())
      await resendRegistrationCode(regEmail.trim().toLowerCase());
      // Gọi/thực thi alert với đối số để cập nhật logic/giao diện: alert('Đã gửi lại mã OTP!')
      alert('Đã gửi lại mã OTP!');
    } catch (err: unknown) {
      // Gọi/thực thi setRegError với đối số để cập nhật logic/giao diện: setRegError(errorMessage(err) || 'Không thể gửi lại OTP.')
      setRegError(errorMessage(err) || 'Không thể gửi lại OTP.');
    } finally {
      // Gọi/thực thi setRegSubmitting với đối số để cập nhật logic/giao diện: setRegSubmitting(false)
      setRegSubmitting(false);
    }
  }

  // Redirect only after all hooks have been initialized on every render.
  // if chỉ chạy nhánh này khi điều kiện admin && user?.role === 'ADMIN' đúng.
  if (admin && user?.role === 'ADMIN') {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <Navigate to="/admin/dashboard" replace />.
    return <Navigate to="/admin/dashboard" replace />;
  }
  // if chỉ chạy nhánh này khi điều kiện !admin && user?.role === 'USER' đúng.
  if (!admin && user?.role === 'USER') {
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <Navigate to="/" replace />.
    return <Navigate to="/" replace />;
  }

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: ( <main className="min-h-screen bg-[#f4f3ef] flex items-center justify-center p-.
  return (
    <main className="min-h-screen bg-[#f4f3ef] flex items-center justify-center p-4">
      <div 
        className={`auth-container relative w-[880px] max-w-full min-h-[580px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#deddd5] ${
          isRightPanelActive ? 'right-panel-active' : ''
        }`}
      >
        
        {/* ================= FORM ĐĂNG KÝ & OTP ================= */}
        <div className="form-signup">
          <div className="flex flex-col items-center justify-center h-full px-8 py-6 text-center">
            
            {verified ? (
              <div className="w-full space-y-4">
                <h2 className="text-2xl font-bold text-[#202b28]">Email đã xác minh</h2>
                <div className="border-l-2 border-[#527563] bg-[#edf5ee] p-3 text-xs text-[#45704f] text-left">
                  Tài khoản đã sẵn sàng! Vui lòng đăng nhập.
                </div>
                <button 
                  onClick={() => navigate(`/login?verified=1&email=${encodeURIComponent(regEmail.trim().toLowerCase())}`, { replace: true })} 
                  type="button"
                  className="button-primary w-full justify-center !rounded-full"
                >
                  Đến đăng nhập
                </button>
              </div>
            ) : stepOtp ? (
              <form onSubmit={handleVerificationSubmit} noValidate className="w-full space-y-3">
                <h2 className="text-2xl font-bold text-[#202b28]">Xác thực OTP</h2>
                <p className="text-xs text-slate-500">Mã 6 chữ số gửi tới <br/><strong className="text-slate-800">{regEmail}</strong></p>

                <div className="text-left w-full">
                  <input
                    type="text" 
                    maxLength={6} 
                    placeholder="••••••" 
                    value={otp} 
                    onChange={(e) => {
                      // Gọi/thực thi setOtp với đối số để cập nhật logic/giao diện: setOtp(e.target.value.replace(/\D/g, ''))
                      setOtp(e.target.value.replace(/\D/g, ''));
                      // Gọi/thực thi setOtpError với đối số để cập nhật logic/giao diện: setOtpError('')
                      setOtpError('');
                    }} 
                    className={`form-input text-center text-xl tracking-[0.3em] font-bold h-12 ${
                      otpError ? '!border-rose-500 bg-rose-50/20' : ''
                    }`} 
                  />
                  {otpError && <p className="text-[11px] text-rose-600 font-semibold mt-1 pl-1">{otpError}</p>}
                </div>
                
                {regError && <p className="text-xs text-rose-800 bg-rose-50 p-2 border-l-2 border-rose-500 text-left" role="alert">{regError}</p>}
                
                <button 
                  type="submit" 
                  disabled={regSubmitting} 
                  className="button-primary w-full justify-center !rounded-full !py-3"
                >
                  {regSubmitting ? <LoaderCircle className="animate-spin" size={14} /> : 'Xác nhận OTP'}
                </button>
                
                <button 
                  type="button" 
                  disabled={regSubmitting} 
                  onClick={() => void handleResendCode()} 
                  className="text-xs font-bold text-[#203a34] hover:underline cursor-pointer block mx-auto pt-1"
                >
                  Gửi lại mã OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate className="w-full space-y-2">
                <h2 className="text-2xl font-bold text-[#202b28]">Tạo tài khoản</h2>
                <p className="text-xs text-slate-500 mb-1">Đăng ký để khám phá HarveyBook</p>

                {/* Ô Họ tên */}
                <div className="text-left w-full">
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type="text" 
                      placeholder="Họ và tên" 
                      value={regName} 
                      onChange={(e) => { setRegName(e.target.value); setRegNameError(''); }} 
                      className={`form-input !pl-10 ${regNameError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                      maxLength={100} 
                    />
                  </div>
                  {regNameError && <p className="text-[11px] text-rose-600 font-semibold mt-0.5 pl-1">{regNameError}</p>}
                </div>

                {/* Ô Số điện thoại */}
                <div className="text-left w-full">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type="tel" 
                      placeholder="Số điện thoại (không bắt buộc)" 
                      value={regPhone} 
                      onChange={(e) => { setRegPhone(e.target.value); setRegPhoneError(''); }} 
                      className={`form-input !pl-10 ${regPhoneError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                      maxLength={12} 
                    />
                  </div>
                  {regPhoneError && <p className="text-[11px] text-rose-600 font-semibold mt-0.5 pl-1">{regPhoneError}</p>}
                </div>

                {/* Ô Email */}
                <div className="text-left w-full">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={regEmail} 
                      onChange={(e) => { setRegEmail(e.target.value); setRegEmailError(''); }} 
                      className={`form-input !pl-10 ${regEmailError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                    />
                  </div>
                  {regEmailError && <p className="text-[11px] text-rose-600 font-semibold mt-0.5 pl-1">{regEmailError}</p>}
                </div>

                {/* Ô Mật khẩu */}
                <div className="text-left w-full">
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type={showRegPassword ? 'text' : 'password'} 
                      placeholder="Mật khẩu (tối thiểu 8 ký tự)" 
                      value={regPassword} 
                      onChange={(e) => { setRegPassword(e.target.value); setRegPasswordError(''); }} 
                      className={`form-input !pl-10 pr-10 ${regPasswordError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                    />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {regPasswordError && <p className="text-[11px] text-rose-600 font-semibold mt-0.5 pl-1">{regPasswordError}</p>}
                </div>

                {regError && <p className="text-xs text-rose-800 bg-rose-50 p-2 border-l-2 border-rose-500 text-left" role="alert">{regError}</p>}

                <button 
                  type="submit" 
                  disabled={regSubmitting} 
                  className="button-primary w-full justify-center !rounded-full !py-2.5 mt-1"
                >
                  {regSubmitting ? <LoaderCircle className="animate-spin" size={14} /> : 'Đăng ký'}
                </button>

                <SocialAuthButtons />
              </form>
            )}

          </div>
        </div>

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        <div className="form-login">
          <div className="flex flex-col items-center justify-center h-full px-8 py-6 text-center">
            <h2 className="text-2xl font-bold text-[#202b28] mb-1">
              {admin ? 'Đăng nhập Quản trị' : 'Đăng nhập'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Chủ động quản lý và đọc sách cùng HarveyBook</p>

            <form onSubmit={handleLoginSubmit} noValidate className="w-full space-y-3">
              {emailVerified && <p className="text-xs text-emerald-800 bg-emerald-50 p-2 border-l-2 border-emerald-500 text-left" role="status">Email đã được xác minh. Bạn có thể đăng nhập.</p>}
              {/* Ô Email Login */}
              <div className="text-left w-full">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={loginEmail} 
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginEmailError(''); }} 
                    className={`form-input !pl-10 ${loginEmailError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                    autoComplete="username" 
                  />
                </div>
                {loginEmailError && <p className="text-[11px] text-rose-600 font-semibold mt-1 pl-1">{loginEmailError}</p>}
              </div>

              {/* Ô Password Login */}
              <div className="text-left w-full">
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type={showLoginPassword ? 'text' : 'password'} 
                    placeholder="Mật khẩu" 
                    value={loginPassword} 
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginPasswordError(''); }} 
                    className={`form-input !pl-10 pr-10 ${loginPasswordError ? '!border-rose-500 bg-rose-50/20' : ''}`} 
                    autoComplete="current-password" 
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginPasswordError && <p className="text-[11px] text-rose-600 font-semibold mt-1 pl-1">{loginPasswordError}</p>}
              </div>

              {loginError && <p className="text-xs text-rose-800 bg-rose-50 p-2 border-l-2 border-rose-500 text-left" role="alert">{loginError}</p>}

              <button 
                type="submit" 
                disabled={loginSubmitting} 
                className="button-primary w-full justify-center !rounded-full !py-2.5"
              >
                {loginSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : 'Đăng nhập'}
                {!loginSubmitting && <ArrowRight size={16} />}
              </button>

              <SocialAuthButtons />
            </form>
          </div>
        </div>

        {/* ================= OVERLAY BANNER KHUNG BO VÒM TRƯỢT ================= */}
        {!admin && <div className="overlay-container">
          <div className="overlay-panel-inner relative h-full w-full text-white overflow-hidden">
            
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#122420]/90 via-[#1b3b36]/85 to-[#203a34]/90 backdrop-blur-[2px]"></div>

            {/* Banner Trái */}
            <div className={`absolute top-0 flex flex-col items-center justify-center h-full w-1/2 px-8 text-center transition-transform duration-700 ease-in-out z-10 ${
              isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'
            }`}>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">Chào mừng trở lại!</h1>
              <p className="text-xs text-slate-200 leading-relaxed mb-6 font-medium">
                Để tiếp tục quản lý và khám phá không gian thư viện số HarveyBook, vui lòng đăng nhập.
              </p>
              <button 
                onClick={() => switchAuthMode(false)}
                type="button"
                className="uppercase tracking-wider text-xs font-bold border border-white/80 py-3 px-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-sm shadow-md"
              >
                Đăng nhập
              </button>
            </div>

            {/* Banner Phải */}
            <div className={`absolute top-0 right-0 flex flex-col items-center justify-center h-full w-1/2 px-8 text-center transition-transform duration-700 ease-in-out z-10 ${
              isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'
            }`}>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">Xin chào, Bạn mới!</h1>
              <p className="text-xs text-slate-200 leading-relaxed mb-6 font-medium">
                Khởi tạo tài khoản ngay hôm nay để trải nghiệm hệ thống quản lý và đọc sách thông minh.
              </p>
              <button 
                onClick={() => switchAuthMode(true)}
                type="button"
                className="uppercase tracking-wider text-xs font-bold border border-white/80 py-3 px-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-sm shadow-md"
              >
                Đăng ký
              </button>
            </div>

          </div>
        </div>}

      </div>
    </main>
  );

}
