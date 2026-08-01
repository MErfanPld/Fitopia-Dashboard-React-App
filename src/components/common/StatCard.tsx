import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  subtext?: string;
  accentColor?: 'orange' | 'emerald' | 'blue' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePeriod = 'نسبت به ماه گذشته',
  icon: Icon,
  subtext,
  accentColor = 'orange',
}) => {
  const isPositive = change !== undefined && change >= 0;

  const iconBgMap = {
    orange: 'bg-[#FF7A1A]/10 text-[#FF7A1A] border-[#FF7A1A]/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 hover:border-[#383838] transition-all duration-200 group relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF7A1A]/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-[#FF7A1A]/10 transition-all" />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400">{title}</span>
          <div className="text-2xl md:text-3xl font-black text-white mt-1.5 tracking-tight">
            {value}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${iconBgMap[accentColor]} transition-transform duration-200 group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#262626] text-xs">
        {change !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold dir-ltr ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(change)}%
            </span>
            <span className="text-slate-400 text-[11px]">{changePeriod}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">{subtext || 'بروزرسانی لحظه‌ای'}</span>
        )}
      </div>
    </div>
  );
};
