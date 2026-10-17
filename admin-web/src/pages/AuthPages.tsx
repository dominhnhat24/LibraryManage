import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { 
  Library, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound, 
  LoaderCircle, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { 
  errorMessage, requestRegistrationCode, resendRegistrationCode, 
  verifyRegistrationEmail 
} from '../api/client';
 

export function LoginPage({ admin = false }: { admin?: boolean }) {
  return <AuthPage admin={admin} />;
}

export function RegisterPage() {
  return <AuthPage admin={false} />;
}

export function AuthPage({ admin = false }: { admin?: boolean }) {
  const { user, login, loginAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  // ================= 1. LOGIC ĐĂNG NHẬP & VALIDATION =================
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(
    searchParams.get('forbidden') ? 'Tài khoản này không có quyền quản trị.' : ''
  );
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Validation lỗi cho ô đăng nhập
  const [loginEmailError, setLoginEmailError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');

function SocialAuthButtons() {
  const handleSocialClick = (provider: string) => {
    alert(`Chức năng đăng nhập bằng ${provider} đang được phát triển.`);
  };

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

  if (admin && user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (!admin && user?.role === 'USER') return <Navigate to="/" replace />;
  
  function validateLoginForm(): boolean {
    let isValid = true;
    setLoginEmailError('');
    setLoginPasswordError('');

    if (!loginEmail.trim()) {
      setLoginEmailError('Vui lòng nhập Email');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginEmailError('Email không hợp lệ');
      isValid = false;
    }

    if (!loginPassword) {
      setLoginPasswordError('Vui lòng nhập Mật khẩu');
      isValid = false;
    }

    return isValid;
  }



function handleSocialClick(provider: string) {
  // Xử lý đăng nhập Google/Facebook/v.v.
  console.log(`Logging in with ${provider}`);
}
  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');

    if (!validateLoginForm()) return;

    setLoginSubmitting(true);
    try {
      const account = admin
        ? await loginAdmin(loginEmail.trim(), loginPassword)
        : await login(loginEmail.trim(), loginPassword);

      if (account && account.role !== (admin ? 'ADMIN' : 'USER')) {
        await logout();
        setLoginError(
          admin ? 'Tài khoản chưa được cấp quyền ADMIN.' : 'Vui lòng đăng nhập tài khoản độc giả.'
        );
        return;
      }

      const target = admin
        ? ((location.state as { from?: string } | null)?.from || '/admin/dashboard')
        : ((location.state as { from?: string } | null)?.from || '/');
      navigate(target, { replace: true });
    } catch (err: unknown) {
      setLoginError(errorMessage(err) || 'Đăng nhập thất bại.');
    } finally {
      setLoginSubmitting(false);
    }
  }

  // ================= 2. LOGIC ĐĂNG KÝ, OTP & VALIDATION =================
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [stepOtp, setStepOtp] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Validation lỗi cho ô đăng ký
  const [regNameError, setRegNameError] = useState('');
  const [regPhoneError, setRegPhoneError] = useState('');
  const [regEmailError, setRegEmailError] = useState('');
  const [regPasswordError, setRegPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');

  function validateRegisterForm(): boolean {
    let isValid = true;
    setRegNameError('');
    setRegPhoneError('');
    setRegEmailError('');
    setRegPasswordError('');

    if (!regName.trim()) {
      setRegNameError('Vui lòng nhập Họ và tên');
      isValid = false;
    }

    if (!regPhone.trim()) {
      setRegPhoneError('Vui lòng nhập Số điện thoại');
      isValid = false;
    }

    if (!regEmail.trim()) {
      setRegEmailError('Vui lòng nhập Email');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegEmailError('Email không đúng định dạng');
      isValid = false;
    }

    if (!regPassword) {
      setRegPasswordError('Vui lòng nhập Mật khẩu');
      isValid = false;
    } else if (regPassword.length < 8) {
      setRegPasswordError('Mật khẩu tối thiểu 8 ký tự');
      isValid = false;
    }

    return isValid;
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegError('');

    if (!validateRegisterForm()) return;

    setRegSubmitting(true);
    try {
      await requestRegistrationCode(regName.trim(), regPhone.trim(), regEmail.trim(), regPassword);
      setStepOtp(true);
    } catch (err: unknown) {
      setRegError(errorMessage(err) || 'Gửi mã xác nhận thất bại.');
    } finally {
      setRegSubmitting(false);
    }
  }

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegError('');
    setOtpError('');

    if (!otp.trim() || otp.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setRegSubmitting(true);
    try {
      await verifyRegistrationEmail(regEmail.trim(), otp.trim());
      setVerified(true);
      await logout();
    } catch (err: unknown) {
      setRegError(errorMessage(err) || 'Xác thực OTP thất bại.');
    } finally {
      setRegSubmitting(false);
    }
  }

  async function handleResendCode() {
    setRegError('');
    setRegSubmitting(true);
    try {
      await resendRegistrationCode(regEmail.trim());
      alert('Đã gửi lại mã OTP!');
    } catch (err: unknown) {
      setRegError(errorMessage(err) || 'Không thể gửi lại OTP.');
    } finally {
      setRegSubmitting(false);
    }
  }

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
                  onClick={() => {
                    setVerified(false);
                    setStepOtp(false);
                    setIsRightPanelActive(false);
                  }} 
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
                      setOtp(e.target.value.replace(/\D/g, ''));
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
                <p className="text-xs text-slate-500 mb-1">Đăng ký để khám phá OpenBook</p>

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
                      placeholder="Số điện thoại" 
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
            <p className="text-xs text-slate-500 mb-4">Chủ động quản lý và đọc sách cùng OpenBook</p>

            <form onSubmit={handleLoginSubmit} noValidate className="w-full space-y-3">
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
        <div className="overlay-container">
          <div className="overlay-panel-inner relative h-full w-full text-white overflow-hidden">
            
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#122420]/90 via-[#1b3b36]/85 to-[#203a34]/90 backdrop-blur-[2px]"></div>

            {/* Banner Trái */}
            <div className={`absolute top-0 flex flex-col items-center justify-center h-full w-1/2 px-8 text-center transition-transform duration-700 ease-in-out z-10 ${
              isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'
            }`}>
              <div className="grid h-12 w-12 place-items-center bg-white/10 rounded-2xl mb-3 border border-white/20 shadow-lg">
                <Library size={24} className="text-emerald-300" />
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">Chào mừng trở lại!</h1>
              <p className="text-xs text-slate-200 leading-relaxed mb-6 font-medium">
                Để tiếp tục quản lý và khám phá không gian thư viện số OpenBook, vui lòng đăng nhập.
              </p>
              <button 
                onClick={() => setIsRightPanelActive(false)} 
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
              <div className="grid h-12 w-12 place-items-center bg-white/10 rounded-2xl mb-3 border border-white/20 shadow-lg">
                <Library size={24} className="text-emerald-300" />
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight">Xin chào, Bạn mới!</h1>
              <p className="text-xs text-slate-200 leading-relaxed mb-6 font-medium">
                Khởi tạo tài khoản ngay hôm nay để trải nghiệm hệ thống quản lý và đọc sách thông minh.
              </p>
              <button 
                onClick={() => setIsRightPanelActive(true)} 
                type="button"
                className="uppercase tracking-wider text-xs font-bold border border-white/80 py-3 px-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer backdrop-sm shadow-md"
              >
                Đăng ký
              </button>
            </div>

          </div>
        </div>

      </div>
    </main>
  );

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

