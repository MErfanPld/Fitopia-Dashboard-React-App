import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, User, ArrowLeft, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login: authLogin, error: authError } = useAuth();
  const { login: appLogin } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setLocalError('لطفاً نام کاربری را وارد کنید.');
      return;
    }
    if (!password) {
      setLocalError('لطفاً کلمه عبور را وارد کنید.');
      return;
    }

    setLocalError('');
    setIsLoading(true);

    try {
      const { gyms } = await authLogin(username, password);
      appLogin(username);

      // Successfully logged in - redirect to saved target if available, otherwise dashboard
      const redirectTarget = localStorage.getItem('fitopia_redirect_target');
      if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/welcome') {
        localStorage.removeItem('fitopia_redirect_target');
        navigate(redirectTarget);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login submit error:', err);
      setLocalError(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-['Vazirmatn',sans-serif] selection:bg-[#FF7A1A]/30 selection:text-[#FF7A1A]" dir="rtl">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FF7A1A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF9D4D] flex items-center justify-center text-white mx-auto shadow-xl shadow-[#FF7A1A]/30">
            <Zap className="w-9 h-9 fill-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            فیتوپیا
            <span className="text-xs bg-[#FF7A1A]/20 text-[#FF7A1A] px-2 py-0.5 rounded-md font-mono border border-[#FF7A1A]/30">
              Admin
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">سامانه جامع مدیریت باشگاه‌های ورزشی</p>
        </div>

        {/* Inline Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="block text-xs font-bold text-slate-300">نام کاربری مدیریتی</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری خود را وارد کنید"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-slate-100 placeholder-slate-500 rounded-xl pr-10 pl-3.5 py-3 text-xs md:text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">کلمه عبور</label>
              <button
                type="button"
                onClick={() => alert('لینک بازیابی رمز عبور به پشتیبانی پیامک می‌شود.')}
                className="text-[11px] text-[#FF7A1A] hover:underline cursor-pointer"
              >
                فراموشی کلمه عبور؟
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-slate-100 placeholder-slate-500 rounded-xl pr-10 pl-3.5 py-3 text-xs md:text-sm focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {rememberMe ? (
                <CheckSquare className="w-4 h-4 text-[#FF7A1A]" />
              ) : (
                <Square className="w-4 h-4 text-slate-600" />
              )}
              <span>مرا به خاطر بسپار</span>
            </button>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ورود امن
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-[#FF7A1A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF7A1A] text-slate-950 font-black py-3 px-4 rounded-xl text-sm shadow-lg shadow-[#FF7A1A]/25 hover:shadow-[#FF7A1A]/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block font-normal">در حال ورود...</span>
            ) : (
              <>
                <span>ورود به پنل مدیریت</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#242424] text-center">
          <p className="text-[11px] text-slate-500">
            دسترسی محدود فقط برای مدیران رسمی شبکه باشگاه‌های فیتوپیا
          </p>
        </div>
      </div>
    </div>
  );
};
