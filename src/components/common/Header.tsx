import React, { useState } from 'react';
import { Search, Bell, Shield, Plus, CheckCircle2, Ticket, AlertCircle, Menu, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel,
}) => {
  const { adminUser, activities, tickets, toggleMobileMenu } = useApp();
  const { currentGym, gymAccessList, setCurrentGym } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const openTickets = tickets.filter((t) => t.status === 'open');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/users?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#262626] px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
      {/* Top row / Left side: Mobile Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-slate-300 hover:text-white hover:border-[#3A3A3A] lg:hidden transition-colors shrink-0"
          title="منوی اصلی"
        >
          <Menu className="w-5 h-5 text-[#FF7A1A]" />
        </button>

        <div>
          {title ? (
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[#FF7A1A] font-medium">فیتوپیا</span>
              <span>/</span>
              <span className="text-slate-200">پنل مدیریتی آمار و عملیات</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Gym Switcher & Search & Notifications & Action Button */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Active Gym Switcher */}
        {gymAccessList && gymAccessList.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#FF7A1A]" />
            {gymAccessList.length > 1 ? (
              <select
                value={currentGym?.id ?? currentGym?.gym ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const selected = gymAccessList.find(
                    (g) => String(g.id) === val || String(g.gym) === val
                  );
                  if (selected) setCurrentGym(selected);
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {gymAccessList.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#1A1A1A] text-white">
                    {g.gym_name} ({g.role === 'owner' ? 'مالک' : 'پرسنل'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-200 text-xs">
                {currentGym?.gym_name || gymAccessList[0].gym_name}
              </span>
            )}
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-40 md:w-56">
          <input
            type="text"
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-slate-200 placeholder-slate-500 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:outline-none focus:border-[#FF7A1A] focus:ring-1 focus:ring-[#FF7A1A] transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
        </form>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-slate-300 hover:text-white hover:border-[#3A3A3A] transition-colors"
            title="اعلان‌ها"
          >
            <Bell className="w-5 h-5" />
            {openTickets.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7A1A] text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                {openTickets.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl shadow-2xl p-4 z-50 text-right animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#FF7A1A]" />
                  اعلان‌ها و رویدادهای اخیر
                </span>
                <span className="text-[11px] bg-[#FF7A1A]/10 text-[#FF7A1A] px-2 py-0.5 rounded-full font-bold">
                  {openTickets.length} تیکت باز
                </span>
              </div>

              <div className="space-y-3 mt-3 max-h-72 overflow-y-auto pr-1">
                {openTickets.length > 0 && (
                  <div className="bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 p-2.5 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#FF7A1A] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">تیکت فوری نیازمند پاسخ</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{openTickets[0].subject}</p>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/tickets');
                        }}
                        className="text-[11px] text-[#FF7A1A] underline mt-1 font-semibold block"
                      >
                        مشاهده تیکت‌ها
                      </button>
                    </div>
                  </div>
                )}

                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-300 border-b border-[#242424] pb-2 last:border-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{act.action}</span>
                        <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{act.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button (if provided) */}
        {onQuickAction && quickActionLabel && (
          <button
            onClick={onQuickAction}
            className="flex items-center gap-2 bg-[#FF7A1A] hover:bg-[#FF8C00] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-[#FF7A1A]/20 hover:shadow-[#FF7A1A]/40 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{quickActionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};
