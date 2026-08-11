import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Accent = 'orange' | 'emerald' | 'blue' | 'purple' | 'primary';

const accentMap: Record<Accent, { iconBg: string; iconColor: string }> = {
  orange: { iconBg: 'bg-primary/15', iconColor: 'text-primary' },
  primary: { iconBg: 'bg-primary/15', iconColor: 'text-primary' },
  emerald: { iconBg: 'bg-success/15', iconColor: 'text-success' },
  blue: { iconBg: 'bg-info/15', iconColor: 'text-info' },
  purple: { iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
};

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  accentColor?: Accent;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePeriod,
  icon: Icon,
  accentColor = 'primary',
}) => {
  const a = accentMap[accentColor] || accentMap.primary;
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted mb-1.5 truncate">{title}</p>
          <p className="text-2xl font-extrabold text-ink tracking-tight truncate">{value}</p>
          {change != null && (
            <p className={`text-[11px] mt-1.5 font-semibold ${change >= 0 ? 'text-success' : 'text-danger'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}٪
              {changePeriod && <span className="text-muted font-normal mr-1">{changePeriod}</span>}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.iconBg}`}>
          <Icon className={`w-5 h-5 ${a.iconColor}`} />
        </div>
      </div>
    </div>
  );
};
