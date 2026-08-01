import React from 'react';

type BadgeType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'enterprise'
  | 'admin'
  | 'manager'
  | 'coach'
  | 'member'
  | 'support';

interface StatusBadgeProps {
  status: BadgeType | string;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel, size = 'md' }) => {
  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = customLabel || status;

  switch (status) {
    // Users & Gyms
    case 'active':
      styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      label = customLabel || 'فعال';
      break;
    case 'inactive':
      styles = 'bg-slate-800 text-slate-400 border-slate-700';
      label = customLabel || 'غیرفعال';
      break;
    case 'pending':
      styles = 'bg-[#FF7A1A]/10 text-[#FF7A1A] border-[#FF7A1A]/30';
      label = customLabel || 'در انتظار تایید';
      break;
    case 'suspended':
      styles = 'bg-red-500/10 text-red-400 border-red-500/20';
      label = customLabel || 'معلق / مسدود';
      break;

    // Tickets Status
    case 'open':
      styles = 'bg-[#FF7A1A]/15 text-[#FF7A1A] border-[#FF7A1A]/40 animate-pulse';
      label = customLabel || 'باز / نیازمند اقدام';
      break;
    case 'in_progress':
      styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      label = customLabel || 'در حال بررسی';
      break;
    case 'resolved':
      styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      label = customLabel || 'پاسخ داده شده / حل شده';
      break;
    case 'closed':
      styles = 'bg-slate-800 text-slate-400 border-slate-700';
      label = customLabel || 'بسته شده';
      break;

    // Priorities
    case 'urgent':
      styles = 'bg-red-500/15 text-red-400 border-red-500/30 font-extrabold';
      label = customLabel || 'فوری';
      break;
    case 'high':
      styles = 'bg-[#FF7A1A]/15 text-[#FF7A1A] border-[#FF7A1A]/30';
      label = customLabel || 'بالا';
      break;
    case 'medium':
      styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      label = customLabel || 'متوسط';
      break;
    case 'low':
      styles = 'bg-slate-800 text-slate-300 border-slate-700';
      label = customLabel || 'معمولی';
      break;

    // Payments
    case 'paid':
      styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      label = customLabel || 'پرداخت شده';
      break;
    case 'failed':
      styles = 'bg-red-500/15 text-red-400 border-red-500/30';
      label = customLabel || 'ناموفق / خطا';
      break;
    case 'refunded':
      styles = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      label = customLabel || 'مسترد شده';
      break;

    // Tiers
    case 'bronze':
      styles = 'bg-amber-700/20 text-amber-300 border-amber-700/40';
      label = customLabel || 'برنزی';
      break;
    case 'silver':
      styles = 'bg-slate-700/40 text-slate-200 border-slate-600';
      label = customLabel || 'نقره‌ای';
      break;
    case 'gold':
      styles = 'bg-[#FF7A1A]/20 text-[#FF7A1A] border-[#FF7A1A]/40 font-bold';
      label = customLabel || 'طلایی';
      break;
    case 'enterprise':
      styles = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold shadow-sm shadow-purple-500/10';
      label = customLabel || 'سازمانی (Enterprise)';
      break;

    // Roles
    case 'admin':
      styles = 'bg-[#FF7A1A]/20 text-[#FF7A1A] border-[#FF7A1A]/40 font-bold';
      label = customLabel || 'مدیر کل';
      break;
    case 'manager':
      styles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      label = customLabel || 'مدیر باشگاه';
      break;
    case 'coach':
      styles = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      label = customLabel || 'مربی';
      break;
    case 'member':
      styles = 'bg-slate-800 text-slate-300 border-slate-700';
      label = customLabel || 'ورزشکار / عضو';
      break;
    case 'support':
      styles = 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      label = customLabel || 'پشتیبان';
      break;

    default:
      styles = 'bg-slate-800 text-slate-300 border-slate-700';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border shadow-xs whitespace-nowrap ${sizeClasses} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
    </span>
  );
};
