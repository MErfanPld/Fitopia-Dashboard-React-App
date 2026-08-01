import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  description?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تایید حذف اطلاعات',
  itemName,
  description = 'آیا از حذف این مورد اطمینان کامل دارید؟ این عملیات غیرقابل بازگشت است و تمام داده‌های مرتبط پاک خواهند شد.',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#181818] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Red Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

        <div className="p-6 text-right">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-black text-white">{title}</h3>
              <p className="text-xs font-bold text-red-400 mt-1">«{itemName}»</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{description}</p>
            </div>
          </div>

          {/* Action Buttons styled with distinct warning red */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-[#333] text-slate-300 hover:bg-[#252525] text-xs font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف قطعی</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
