import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, User, ArrowLeft, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    if (!username.trim()) { setLocalError('\u0644\u0637\u0641\u0627\u064b \u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.'); return; }
    if (!password) { setLocalError('\u0644\u0637\u0641\u0627\u064b \u06a9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.'); return; }
    setLocalError(''); clearError(); setIsLoading(true);
    try {
      await login(username.trim(), password);
      const target = localStorage.getItem('fitopia_return_to');
      localStorage.removeItem('fitopia_return_to');
      navigate(target && target !== '/login' ? target : '/dashboard');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : '\u062e\u0637\u0627 \u062f\u0631 \u0648\u0631\u0648\u062f');
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = localError || authError;
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-slate-100 flex items-center justify-center p-4 font-['Vazirmatn',sans-serif]" dir="rtl">
      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-2xl">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF9D4D] flex items-center justify-center shadow-lg shadow-[#FF7A1A]/30">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white">\u0648\u0631\u0648\u062f \u0628\u0647 \u067e\u0646\u0644 \u0628\u0627\u0634\u06af\u0627\u0647</h1>
          <p className="text-sm text-slate-400">\u0641\u06cc\u062a\u0648\u067e\u06cc\u0627 \u2014 \u0645\u062f\u06cc\u0631\u06cc\u062a \u0628\u0627\u0634\u06af\u0627\u0647 \u0648\u0631\u0632\u0634\u06cc</p>
        </div>
        {errorMessage && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc</label>
            <div className="relative">
              <input className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pr-10 pl-3 py-3 text-sm text-white focus:outline-none focus:border-[#FF7A1A]" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">\u06a9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631</label>
            <div className="relative">
              <input type="password" className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pr-10 pl-3 py-3 text-sm text-white focus:outline-none focus:border-[#FF7A1A]" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>
          <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-xs text-slate-400">
            {rememberMe ? <CheckSquare className="w-4 h-4 text-[#FF7A1A]" /> : <Square className="w-4 h-4 text-slate-600" />}
            \u0645\u0631\u0627 \u0628\u0647 \u062e\u0627\u0637\u0631 \u0628\u0633\u067e\u0627\u0631
          </button>
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF8C00] text-slate-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? '\u062f\u0631 \u062d\u0627\u0644 \u0648\u0631\u0648\u062f...' : <>\u0648\u0631\u0648\u062f \u0628\u0647 \u067e\u0646\u0644 <ArrowLeft className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> \u0648\u0631\u0648\u062f \u0627\u0645\u0646 JWT
        </p>
      </div>
    </div>
  );
};
