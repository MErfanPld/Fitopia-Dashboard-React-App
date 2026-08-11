import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Accent = 'orange' | 'emerald' | 'blue' | 'purple' | 'primary';

const accentMap: Record<Accent, { iconBg: string; iconColor: string }> = {
  orange: { iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
  primary: { iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
  emerald: { iconBg: 'bg-success-soft', iconColor: 'text-success-text' },
  blue: { iconBg: 'bg-info-soft', iconColor: 'text-info-text' },
  purple: { iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
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
    <div
      className="bg-surface border border-border rounded-2xl p-5 hover:bg-surface-hover hover:border-border-hover transition-colors duration-200"
      style={{ boxShadow: 'var(--fitopia-shadow)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted mb-1.5 truncate">{title}</p>
          <p className="text-2xl font-extrabold text-ink tracking-tight truncate">{value}</p>
          {change != null && (
            <p className={`text-[11px] mt-1.5 font-semibold ${change >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
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
