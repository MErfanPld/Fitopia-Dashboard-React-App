import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  quickActionLabel,
  onQuickAction,
  actions,
}) => {
  const { toggleMobileMenu } = useUI();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden mt-1 p-2 rounded-xl border border-line bg-surface text-muted hover:text-ink hover:bg-canvas"
          aria-label="منو"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-[28px] font-extrabold text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {actions}
        {onQuickAction && (
          <Button variant="secondary" size="sm" onClick={onQuickAction} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {quickActionLabel || 'بروزرسانی'}
          </Button>
        )}
      </div>
    </div>
  );
};
