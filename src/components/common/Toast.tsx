import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-[#FF7A1A] shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/40 bg-[#161616]',
    danger: 'border-red-500/40 bg-[#161616]',
    warning: 'border-[#FF7A1A]/40 bg-[#161616]',
    info: 'border-blue-500/40 bg-[#161616]',
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-right text-xs font-bold text-white ${borderMap[toast.type]}`}
      >
        <div className="flex items-center gap-3">
          {iconMap[toast.type]}
          <span>{toast.message}</span>
        </div>
        <button
          onClick={clearToast}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
