import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Dumbbell, Layers, BookOpen, Tag,
  ClipboardCheck, Clock, Wallet, ArrowLeftRight, RotateCcw, BarChart3,
  TicketCheck, ScrollText, Settings, LogOut, X, Zap, Building2, HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_LABELS, type StaffRole, type PermissionCode } from '../../types/api';

interface Item {
  path: string;
  label: string;
  icon: React.ElementType;
  perm?: PermissionCode;
}

const groups: { title: string; items: Item[] }[] = [
  {
    title: 'نمای کلی',
    items: [{ path: '/dashboard', label: 'داشبورد', icon: LayoutDashboard }],
  },
  {
    title: 'مدیریت باشگاه',
    items: [
      { path: '/members', label: 'اعضا', icon: Users, perm: 'customer.view' },
      { path: '/coaches', label: 'مربیان', icon: Dumbbell },
      { path: '/employees', label: 'کارکنان', icon: UserCog, perm: 'employee.view' },
      { path: '/offerings', label: 'خدمات و رشته‌ها', icon: Layers, perm: 'offering.manage' },
      { path: '/prices', label: 'قیمت‌ها', icon: Tag },
      { path: '/courses', label: 'دوره‌ها', icon: BookOpen, perm: 'course.view' },
    ],
  },
  {
    title: 'عملیات',
    items: [
      { path: '/attendance', label: 'حضور و غیاب', icon: ClipboardCheck, perm: 'attendance.view' },
      { path: '/fitopia-users', label: 'کاربران فیتوپیا', icon: Sparkles, perm: 'customer.view' },
      { path: '/sessions', label: 'جلسات تکی', icon: Clock, perm: 'finance.create' },
    ],
  },
  {
    title: 'مالی',
    items: [
      { path: '/finance', label: 'گزارش مالی', icon: BarChart3, perm: 'finance.report' },
      { path: '/finance/transactions', label: 'تراکنش‌ها', icon: ArrowLeftRight, perm: 'finance.view' },
      { path: '/finance/payments', label: 'پرداخت‌ها', icon: Wallet, perm: 'finance.view' },
      { path: '/finance/refunds', label: 'استردادها', icon: RotateCcw, perm: 'finance.refund' },
    ],
  },
  {
    title: 'پشتیبانی و سیستم',
    items: [
      { path: '/tickets', label: 'تیکت‌ها', icon: TicketCheck },
      { path: '/audit', label: 'گزارش فعالیت', icon: ScrollText },
      { path: '/settings', label: 'تنظیمات', icon: Settings },
      { path: '/guide', label: 'راهنما', icon: HelpCircle },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { logout, currentGym, gymAccessList, setCurrentGym, user, can } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const navigate = useNavigate();

  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role || '';

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => !item.perm || can(item.perm)),
        }))
        .filter((g) => g.items.length > 0),
    [can],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-[2px]"
          style={{ background: 'var(--fitopia-overlay)' }}
          aria-hidden
        />
      )}
      <aside
        className={`fixed right-0 top-0 bottom-0 w-[min(20rem,calc(100vw-2.5rem))] sm:w-72 lg:w-64 bg-sidebar border-l border-border flex flex-col z-50
          transition-transform duration-200 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary-fg" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ink truncate">فیتوپیا</p>
              <p className="text-[11px] text-muted truncate">پنل مدیریت باشگاه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="lg:hidden p-2 rounded-lg text-muted hover:bg-surface-hover"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gymAccessList && gymAccessList.length > 1 && (
          <div className="px-3 pt-3">
            <label className="text-[11px] text-muted mb-1 block">باشگاه فعال</label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <select
                value={currentGym?.id ?? ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const g = gymAccessList.find((x) => x.id === id);
                  if (g) setCurrentGym(g);
                }}
                className="w-full appearance-none rounded-xl border border-border bg-input pr-8 pl-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {gymAccessList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.gym_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-bold text-muted tracking-wide px-2 mb-1.5">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-soft text-primary font-bold'
                              : 'text-secondary hover:bg-surface-hover hover:text-ink'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.full_name || user?.phone || 'ک').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{user?.full_name || 'کاربر'}</p>
              <p className="text-[11px] text-muted truncate">{roleLabel || currentGym?.gym_name || ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-danger-text border border-danger/20 hover:bg-danger-soft"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
