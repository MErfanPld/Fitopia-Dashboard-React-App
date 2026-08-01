import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  TicketCheck,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ShieldAlert,
  Zap,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { adminUser, logout: appLogout, tickets, isMobileMenuOpen, closeMobileMenu } = useApp();
  const { logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;

  const navItems = [
    {
      path: '/dashboard',
      label: 'داشبورد اصلی',
      icon: LayoutDashboard,
    },
    {
      path: '/users',
      label: 'مدیریت کاربران',
      icon: Users,
    },
    {
      path: '/gyms',
      label: 'مدیریت باشگاه‌ها',
      icon: Dumbbell,
    },
    {
      path: '/tickets',
      label: 'تیکت‌های پشتیبانی',
      icon: TicketCheck,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    {
      path: '/payments',
      label: 'امور مالی و فاکتورها',
      icon: CreditCard,
    },
    {
      path: '/settings',
      label: 'تنظیمات سامانه',
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    closeMobileMenu();
    authLogout();
    appLogout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed right-0 top-0 bottom-0 w-72 lg:w-64 bg-[#141414] border-l border-[#262626] flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'max-lg:translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 px-5 border-b border-[#262626] flex items-center justify-between">
            <NavLink to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF9D4D] flex items-center justify-center text-white shadow-lg shadow-[#FF7A1A]/20">
                <Zap className="w-6 h-6 fill-white text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                  فیتوپیا
                </span>
                <span className="text-[11px] text-slate-400 font-medium">پنل مدیریت باشگاه‌ها</span>
              </div>
            </NavLink>

            {/* Mobile Close Button */}
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#222] lg:hidden transition-colors"
              title="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1.5 mt-2">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              منوی مدیریتی
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#FF7A1A]/10 text-[#FF7A1A] border-r-4 border-[#FF7A1A] shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-[#1E1E1E] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-[#FF7A1A]' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#FF7A1A] text-slate-950'
                          : 'bg-[#FF7A1A]/20 text-[#FF7A1A] border border-[#FF7A1A]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronLeft
                      className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 ${
                        isActive ? 'opacity-100 text-[#FF7A1A]' : ''
                      }`}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile Card */}
        <div className="p-3 border-t border-[#262626]">
          <div className="bg-[#1C1C1C] p-3 rounded-xl border border-[#2A2A2A] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  adminUser?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt={adminUser?.name}
                className="w-9 h-9 rounded-full object-cover border border-[#FF7A1A]/40 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{adminUser?.name || 'مدیر سیستم'}</span>
                <span className="text-[10px] text-slate-400 truncate">{adminUser?.role || 'مدیر ارشد'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="خروج از حساب"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
