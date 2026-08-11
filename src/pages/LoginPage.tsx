import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, User, ArrowLeft, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setLocalError('لطفاً نام کاربری را وارد کنید.'); return; }
    if (!password) { setLocalError('لطفاً کلمه عبور را وارد کنید.'); return; }
    setLocalError(''); clearError(); setIsLoading(true);
    try {
      await login(username.trim(), password);
      const target = localStorage.getItem('fitopia_return_to');
      localStorage.removeItem('fitopia_return_to');
      navigate(target && target !== '/login' ? target : '/dashboard');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-8 shadow-lg">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">ورود به پنل باشگاه</h1>
          <p className="text-sm text-muted">فیتوپیا — مدیریت باشگاه ورزشی</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">نام کاربری</label>
            <div className="relative">
              <input
                className="w-full bg-canvas border border-line rounded-xl pr-10 pl-3 py-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="نام کاربری"
              />
              <User className="w-4 h-4 text-muted absolute right-3.5 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">کلمه عبور</label>
            <div className="relative">
              <input
                type="password"
                className="w-full bg-canvas border border-line rounded-xl pr-10 pl-3 py-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-muted absolute right-3.5 top-3.5" />
            </div>
          </div>
          <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-xs text-muted hover:text-ink">
            {rememberMe ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted" />}
            مرا به خاطر بسپار
          </button>
          <Button type="submit" variant="primary" className="w-full" loading={isLoading} rightIcon={<ArrowLeft className="w-4 h-4" />}>
            ورود به پنل
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> ورود امن JWT
        </p>
      </div>
    </div>
  );
};
