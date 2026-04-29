import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, User } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Register form
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Đăng nhập thất bại');
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      window.location.href = '/';
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(', ') || 'Đăng ký thất bại');
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      window.location.href = '/';
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="glass-card relative overflow-hidden !p-0">
          {/* Decorative blobs inside card */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />

          {/* Tab switcher */}
          <div className="flex border-b border-slate-100 relative z-10">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-7 relative z-10">
            <div className="text-center mb-7">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {tab === 'login' ? 'Chào mừng trở lại 👋' : 'Tạo tài khoản mới'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {tab === 'login' ? 'Đăng nhập để tiếp tục mua sắm' : 'Tham gia EcomFinal ngay hôm nay'}
              </p>
            </div>

            {/* Login form */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide" htmlFor="l-username">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="l-username"
                      type="text"
                      required
                      autoComplete="username"
                      value={loginForm.username}
                      onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                      className="glass-input pl-10 w-full"
                      placeholder="demouser"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide" htmlFor="l-password">
                      Mật khẩu
                    </label>
                    <a href="#" className="text-xs text-primary hover:underline font-medium">Quên mật khẩu?</a>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="l-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      className="glass-input pl-10 pr-10 w-full"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex justify-center items-center gap-2 py-3.5 mt-1 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Đăng nhập <ArrowRight size={17} /></>
                  )}
                </button>

                {/* Demo hint */}
                <p className="text-center text-xs text-slate-400 mt-1">
                  Demo: <span className="font-mono text-slate-600">demouser</span> / <span className="font-mono text-slate-600">Demo1234!</span>
                </p>
              </form>
            )}

            {/* Register form */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide" htmlFor="r-username">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="r-username"
                      type="text"
                      required
                      value={regForm.username}
                      onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))}
                      className="glass-input pl-10 w-full"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide" htmlFor="r-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="r-email"
                      type="email"
                      required
                      value={regForm.email}
                      onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                      className="glass-input pl-10 w-full"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide" htmlFor="r-password">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="r-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={regForm.password}
                      onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                      className="glass-input pl-10 pr-10 w-full"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="glass-button-primary w-full flex justify-center items-center gap-2 py-3.5 mt-1 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Tạo tài khoản <ArrowRight size={17} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          © 2026 EcomFinal — Dữ liệu được bảo mật bởi JWT
        </p>
      </div>
    </div>
  );
}
