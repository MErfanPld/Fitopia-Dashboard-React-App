import React from 'react';
import { Menu, RefreshCw, Sun, Moon } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="lg:hidden mt-1 p-2 rounded-xl border border-border bg-surface text-muted hover:text-ink hover:bg-surface-hover transition-colors duration-200"
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
        <button
          type="button"
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-xl border border-border bg-surface text-muted hover:text-primary hover:border-primary/40 hover:bg-surface-hover transition-colors duration-200 flex items-center justify-center"
          aria-label={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
          title={isDark ? 'تم روشن' : 'تم تاریک'}
        >
          <Sun
            className={`w-4.5 h-4.5 absolute transition-all duration-200 ${
              isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
            }`}
          />
          <Moon
            className={`w-4.5 h-4.5 absolute transition-all duration-200 ${
              isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
            }`}
          />
        </button>
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
