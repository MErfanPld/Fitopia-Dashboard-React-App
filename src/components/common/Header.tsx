import React from 'react';
import { Menu, RefreshCw, Sun, Moon } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel,
  actions,
}) => {
  const { toggleSidebar } = useUI();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-hover shrink-0 mt-0.5"
          aria-label="منو"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <NotificationBell />
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted hover:text-ink hover:bg-surface-hover transition-colors"
          aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
          title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
