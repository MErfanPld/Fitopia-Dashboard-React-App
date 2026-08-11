import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onQuickAction, quickActionLabel }) => {
  const { toggleMobileMenu } = useUI();
  const { currentGym } = useAuth();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <button type="button" onClick={toggleMobileMenu} className="lg:hidden p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-slate-300">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          {currentGym && <p className="text-[11px] text-[#FF9D4D] mt-1 font-medium">{currentGym.gym_name}</p>}
        </div>
      </div>
      {onQuickAction && quickActionLabel && (
        <button type="button" onClick={onQuickAction} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#FF7A1A] to-[#FF9D4D] text-white text-sm font-semibold shadow-lg shadow-[#FF7A1A]/20">
          <Plus className="w-4 h-4" />{quickActionLabel}
        </button>
      )}
    </div>
  );
};
