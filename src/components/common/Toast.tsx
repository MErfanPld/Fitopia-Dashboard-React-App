import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useUI();
  if (!toast) return null;
  const icon = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-[#FF7A1A] shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  }[toast.type];
  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <div className="flex items-start gap-3 max-w-sm bg-[#161616] border border-[#333] rounded-xl shadow-2xl p-4">
        {icon}
        <p className="text-sm text-slate-200 flex-1 leading-relaxed">{toast.message}</p>
        <button type="button" onClick={clearToast} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
