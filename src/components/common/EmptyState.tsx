import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState: React.FC<{ title?: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({
  title = '\u062f\u0627\u062f\u0647\u200c\u0627\u06cc \u0628\u0631\u0627\u06cc \u0646\u0645\u0627\u06cc\u0634 \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f', description, action, icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-slate-500 mb-4">
      {icon || <Inbox className="w-7 h-7" />}
    </div>
    <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-md mb-4">{description}</p>}
    {action}
  </div>
);

export const LoadingBlock: React.FC<{ label?: string }> = ({ label = '\u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-4 border-[#FF7A1A] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-400">{label}</span>
  </div>
);

export const ErrorBlock: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
    <p className="text-sm text-red-300 mb-3">{message || '\u062f\u0631\u06cc\u0627\u0641\u062a \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627 \u062e\u0637\u0627 \u0645\u0648\u0627\u062c\u0647 \u0634\u062f.'}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="px-4 py-2 text-xs font-medium rounded-lg bg-[#FF7A1A] text-white hover:bg-[#FF8C33]">
        \u062a\u0644\u0627\u0634 \u0645\u062c\u062f\u062f
      </button>
    )}
  </div>
);

export const NoGymSelected: React.FC = () => (
  <EmptyState title="\u0628\u0627\u0634\u06af\u0627\u0647\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0646\u0634\u062f\u0647 \u0627\u0633\u062a" description="\u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0647\u062f\u0647 \u0627\u06cc\u0646 \u0628\u062e\u0634\u060c \u06cc\u06a9 \u0628\u0627\u0634\u06af\u0627\u0647 \u0627\u0632 \u0641\u0647\u0631\u0633\u062a \u062f\u0633\u062a\u0631\u0633\u06cc\u200c\u0647\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f." />
);
