import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Dumbbell, Layers, BookOpen,
  ClipboardCheck, Clock, Wallet, ArrowLeftRight, RotateCcw, BarChart3,
  TicketCheck, ScrollText, Settings, LogOut, X, Zap, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_LABELS, type StaffRole, type PermissionCode } from '../../types/api';

interface Item { path: string; label: string; icon: React.ElementType; perm?: PermissionCode }

const groups: { title: string; items: Item[] }[] = [
  { title: 'داشبورد', items: [{ path: '/dashboard', label: 'نمای کلی', icon: LayoutDashboard }] },
  { title: 'مدیریت باشگاه', items: [
    { path: '/members', label: 'اعضا', icon: Users, perm: 'customer.view' },
    { path: '/coaches', label: 'مربیان', icon: Dumbbell },
    { path: '/employees', label: 'کارکنان', icon: UserCog, perm: 'employee.view' },
    { path: '/offerings', label: 'خدمات و رشته‌ها', icon: Layers, perm: 'offering.manage' },
    { path: '/courses', label: 'دوره‌ها', icon: BookOpen, perm: 'course.view' },
  ]},
  { title: 'عملیات', items: [
    { path: '/attendance', label: 'حضور و غیاب', icon: ClipboardCheck, perm: 'attendance.view' },
    { path: '/sessions', label: 'جلسات تکی', icon: Clock, perm: 'finance.create' },
  ]},
  { title: 'مالی', items: [
    { path: '/finance', label: 'گزارش مالی', icon: BarChart3, perm: 'finance.report' },
    { path: '/finance/transactions', label: 'تراکنش‌ها', icon: ArrowLeftRight, perm: 'finance.view' },
    { path: '/finance/payments', label: 'پرداخت‌ها', icon: Wallet, perm: 'finance.view' },
    { path: '/finance/refunds', label: 'استرداد', icon: RotateCcw, perm: 'finance.refund' },
  ]},
  { title: 'سیستم', items: [
    { path: '/tickets', label: 'تیکت‌ها', icon: TicketCheck },
    { path: '/audit', label: 'گزارش فعالیت', icon: ScrollText },
    { path: '/settings', label: 'تنظیمات', icon: Settings },
  ]},
];

export const Sidebar: React.FC = () => {
  const { logout, currentGym, gymAccessList, setCurrentGym, user, can } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const roleLabel =
    currentGym?.role && ROLE_LABELS[currentGym.role as StaffRole]
      ? ROLE_LABELS[currentGym.role as StaffRole]
      : currentGym?.role || '';

  return (
    <>
      {isMobileMenuOpen && (
        <div onClick={closeMobileMenu} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" aria-hidden />
      )}
      <aside
        className={`fixed right-0 top-0 bottom-0 w-72 lg:w-64 bg-surface border-l border-border flex flex-col z-50
          transition-transform duration-200 shadow-xl
          ${isMobileMenuOpen ? 'translate-x-0' : 'max-lg:translate-x-full'}`}
      >
        <div className="h-16 px-5 border-b border-border flex items-center justify-between shrink-0">
          <NavLink to="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-ink block leading-tight">فیتوپیا</span>
              <span className="text-[11px] text-muted">پنل مدیریت باشگاه</span>
            </div>
          </NavLink>
          <button type="button" onClick={closeMobileMenu} className="lg:hidden text-muted p-2 hover:bg-surface-hover rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-border">
          <label className="text-[10px] text-muted-2 font-semibold mb-1.5 block px-1">باشگاه فعال</label>
          {gymAccessList.length === 0 ? (
            <div className="text-xs text-muted px-2 py-2 rounded-lg bg-surface-elevated">دسترسی به باشگاهی ندارید</div>
          ) : (
            <div className="relative">
              <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <select
                value={currentGym?.gym ?? ''}
                onChange={(e) => {
                  const g = gymAccessList.find((x) => String(x.gym) === e.target.value);
                  if (g) setCurrentGym(g);
                }}
                className="w-full appearance-none bg-surface-elevated border border-border text-sm text-ink rounded-lg pr-8 pl-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {gymAccessList.map((g) => (
                  <option key={g.gym} value={g.gym}>{g.gym_name || `باشگاه #${g.gym}`}</option>
                ))}
              </select>
            </div>
          )}
          {currentGym && (
            <p className="text-[10px] text-muted mt-1.5 px-1">
              نقش: <span className="text-primary font-semibold">{roleLabel}</span>
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((group) => {
            const visible = group.items.filter((item) => !item.perm || can(item.perm));
            if (!visible.length) return null;
            return (
              <div key={group.title}>
                <div className="px-3 pb-1.5 text-[10px] font-semibold text-muted-2 uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const Icon = item.icon;
                    const active =
                      location.pathname === item.path ||
                      (item.path !== '/dashboard' && item.path !== '/finance' && location.pathname.startsWith(item.path)) ||
                      (item.path === '/finance' && (location.pathname === '/finance' || location.pathname === '/finance/reports'));
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 ${
                          active
                            ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                            : 'text-muted hover:text-ink hover:bg-surface-hover'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <div className="px-3 py-2 mb-1 rounded-xl bg-surface-elevated border border-border">
            <p className="text-sm font-semibold text-ink truncate">{user?.full_name || user?.username || 'کاربر'}</p>
            <p className="text-[11px] text-muted truncate">{user?.phone_number || user?.email || ''}</p>
          </div>
          <button
            type="button"
            onClick={() => { closeMobileMenu(); logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
};
